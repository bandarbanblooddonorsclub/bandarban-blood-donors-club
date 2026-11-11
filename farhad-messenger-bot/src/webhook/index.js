'use strict';

/**
 * ওয়েবহুক হ্যান্ডলার — ফেসবুক মেসেঞ্জার প্ল্যাটফর্মের ওয়েবহুক এর CGPoint রিসিভ করে।
 * GET /webhook — ভেরিফিকেশন (ফেসবুক অ্যাপ সেটআপের সময়)
 * POST /webhook — মেসেজ, পোস্টব্যাক, ডিলিভারি ইভেন্ট রিসিভ
 */

const express = require('express');
const axios = require('axios');
const { settings } = require('../database');
const commands = require('../commands');
const autoReply = require('../features/autoReply');
const welcome = require('../features/welcome');
const groupInfo = require('../features/groupInfo');
const spamControl = require('../features/spamControl');
const admin = require('../admin');
const { t } = require('../utils/language');
const { info, warn, error } = require('../utils/logger');

const router = express.Router();

// JSON বডি পার্স করার জন্য
router.use(express.json({ limit: '1mb' }));

/**
 * ফেসবুক সेंড এপিআইয়ে বার্তা পাঠান।
 * @param {string} recipientId — প্রাপকের ইউজার/গ্রুপ আইডি
 * @param {object} message — মেসেজ অবজেক্ট (যেমন: { text: '...' })
 * @returns {Promise<object>}
 */
async function sendMessage(recipientId, message) {
  const pageAccessToken = process.env.PAGE_ACCESS_TOKEN;
  if (!pageAccessToken) {
    throw new Error('PAGE_ACCESS_TOKEN Set নেই। .env ফাইল যোগ করুন।');
  }
  const apiVersion = process.env.MESSAGER_API_VERSION || 'v18.0';
  const url = `https://graph.facebook.com/${apiVersion}/me/messages`;
  const res = await axios.post(
    url,
    {
      recipient: { id: recipientId },
      message
    },
    {
      params: { access_token: pageAccessToken },
      timeout: 15000
    }
  );
  return res.data;
}

/**
 * প্রেরকের ব্যবহারকারীর প্রোফাইল নৌ.bg ফেসবুক প্রোফাইল এপিআই থেকে পাওয়া যায় (ঐচ্ছিক)
 * এখানে সরলভাবে শুধু আইডি ব্যবহার করা হয়েছে যাতে অতিরিক্ত API কল না হয়।
 */

/**
 * একটি মেসেজ ইভেন্ট পূর্ণাঙ্গভাবে প্রসেস করে।
 * @param {object} event — মেসেজিং ইভেন্ট
 */
async function handleMessageEvent(event) {
  try {
    const senderId = event.sender && event.sender.id ? String(event.sender.id) : null;
    const recipientId = event.recipient && event.recipient.id ? String(event.recipient.id) : null;
    if (!senderId) {
      warn('প্রেরক আইডি nél মেসেজ ইভেন্ট উপেক্ষা করা হলো');
      return;
    }

    const cfg = settings();
    const lang = 'bn'; // ডিফল্ট বাংলা; autoReply-module 내에서 আরও Details শনাক্ত করে

    // বট বন্ধ থাকলে শুধু এডমিন কমান্ড গ্রহণ করবে
    const botEnabled = admin.isBotEnabled();

    // কমান্ড কিনা পরীক্ষা
    const messageText = event.message && event.message.text ? event.message.text : '';
    const isCommand = messageText.startsWith((cfg.commandPrefix || '!'));

    if (isCommand) {
      // কমান্ড হ্যান্ডেল (স্প্যাম চেক ছাড়া — এডমিন কমান্ডের জন্য শিথিল)
      const result = await commands.handle(messageText, senderId, lang, {
        pageAccessToken: process.env.PAGE_ACCESS_TOKEN,
        recipientId
      });
      if (result.reply) {
        await sendMessage(senderId, { text: result.reply });
      }
      return;
    }

    // নন-কমান্ড মেসেজ: বট বন্ধ থাকলে উত্তর দেবে না
    if (!botEnabled) {
      return;
    }

    // স্প্যাম চেক
    const spam = spamControl.checkSpam(senderId, lang);
    if (!spam.allowed) {
      await sendMessage(senderId, { text: spam.reply });
      return;
    }

    // প্রথমবার মেসেজ হলে স্বাগত বার্তা (যদি ব্যবহারকারী নতুন হয়)
    const existingUser = require('../database').getUser(senderId);
    if (!existingUser) {
      const greet = welcome.welcomeMessage(senderId, lang);
      await sendMessage(senderId, { text: greet });
      // স্বাগতের পর স্বয়ংক্রিয় উত্তরও দিলেUX উন্নত হয়, কিন্তু এখানে শুধু স্বাগত পাঠানো হলো
      return;
    }

    // স্বয়ংক্রিয় এআই উত্তর
    const { reply } = await autoReply.handleAutoReply(event);
    if (reply) {
      await sendMessage(senderId, { text: reply });
    }
  } catch (err) {
    error('মেসেজ ইভেন্ট প্রসেস করতে ত্রুটি', err);
  }
}

/**
 * পোস্টব্যাক ইভেন্ট হ্যান্ডেল করে (বাটন ক্লিক, পurrected payload)।
 * @param {object} event
 */
async function handlePostback(event) {
  try {
    const senderId = event.sender && event.sender.id ? String(event.sender.id) : null;
    const payload = event.postback && event.postback.payload ? event.postback.payload : '';
    if (!senderId) return;

    const lang = 'bn';
    if (payload === 'GET_STARTED') {
      const greet = welcome.welcomeMessage(senderId, lang);
      await sendMessage(senderId, { text: greet });
    } else {
      await sendMessage(senderId, { text: t(lang, 'unknownCommand') });
    }
  } catch (err) {
    error('পোস্টব্যাক হ্যান্ডেল করতে ত্রুটি', err);
  }
}

// ---------- রুট: ভেরিফিকেশন (GET) ----------
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      info('ওয়েবহুক ভেরিফিকেশন সফল হয়েছে।');
      res.status(200).send(challenge);
    } else {
      warn('ওয়েবহুক ভেরিফিকেশন ব্যর্থ: টোকেন মেলেনি।');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(200);
  }
});

// ---------- রুট: মেসেজ ইভেন্ট (POST) ----------
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // ফেসবuk পেজ ইভেন্ট পরীক্ষা
    if (body.object === 'page') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const messagingEvents = entry.messaging || [];
        for (const event of messagingEvents) {
          if (event.message) {
            await handleMessageEvent(event);
          } else if (event.postback) {
            await handlePostback(event);
          } else if (event.delivery || event.read) {
            // ডেলিভারি/পাঠன ইভেন্ট — লগ কর রাখুন
            info('ডেলিভারি/পাঠান ইভেন্ট রিসিভ করা হলো');
          } else if (event.reaction) {
            info('প্রতিক্রিয়া ইভেন্ট রিসিভ করা হলো');
          }
        }
      }
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    error('ওয়েবহুক পোস্ট হ্যান্ডেল করতে ত্রুটি', err);
    res.sendStatus(500);
  }
});

// ---------- স্বাস্থ্য পরীক্ষা রুট ----------
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Farhad Messenger AI Bot',
    developer: 'Md Farhad Uddin',
    botEnabled: admin.isBotEnabled(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
