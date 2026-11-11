'use strict';

/*==============================================================================
  Farhad Messenger AI Bot — প্রধান ফাইল (Farhad.js)
  প্রজেক্ট: Farhad Messenger AI Bot
  ডেভেলপার: Md Farhad Uddin
  ভাষা: JavaScript | রানটাইম: Node.js

  এই ফাইলটি পুরো বটের প্রবেশদ্বার (entry point)। এটি এক্সপ্রেস সার্ভার চালু করে,
  ফেসবুক মেসেঞ্জার ওয়েবহুক রেজিস্ট্র করে এবং সকল মডিউলকে সংযুক্ত করে।

  ব্যবহারের আগে:
  ১. এই ফোল্ডারে .env.example কে কপি করে .env নামে সেভ করুন।
  ২. .env-এ আপনার ফেসবুক পেজ অ্যাক্সেস টোকেন, অ্যাপ সিক্রেট, ভেরিফাই টোকেন এবং এডমিন আইডি যোগ করুন।
  ৩. `npm install` চাল করুন, তারপর `node Farhad.js` দিয়ে বট শুরু করুন।
==============================================================================*/

require('dotenv').config();

const express = require('express');
const { info, error } = require('./src/utils/logger');
const webhook = require('./src/webhook');
const { settings } = require('./src/database');
const admin = require('./src/admin');

// পোর্ট কনফিগার
const PORT = Number(process.env.PORT) || 3000;

// এক্সপ্রেস অ্যাপ তৈরি
const app = express();

// ওয়েবহুক রুট মাউন্ট করা
app.use(webhook);

// রুট রুট (সর্বমূল্য पृष्ठ)
app.get('/', (req, res) => {
  res.send('Farhad Messenger AI Bot চলছে। ডেভেলপার: Md Farhad Uddin');
});

// গ্লোবাল এরর হ্যান্ডলার
app.use((err, req, res, next) => {
  error('অপ্রত্যাশিত সার্ভার ত্রুটি', err);
  res.status(500).json({ ok: false, message: 'সার্ভারের অভ্যন্তরীণ ত্রুটি হয়েছে।' });
});

// সার্ভার চালু করা
const server = app.listen(PORT, () => {
  info(`================================================`);
  info(`Farhad Messenger AI Bot সার্ভার শুরু হলো`);
  info(`ডেভেলপার: Md Farhad Uddin`);
  info(`পোর্ট: ${PORT}`);
  info(`বটের অবস্থা: ${admin.isBotEnabled() ? 'চালু ✅' : 'বন্ধ ❌'}`);
  info(`পরিবেশ ফাইল (.env): লোড করা হয়েছে`);
  info(`স্বাস্থ্য পরীক্ষা: http://localhost:${PORT}/health`);
  info(`ওয়েবহুক Endpoint: http://localhost:${PORT}/webhook`);
  info(`================================================`);
});

// গরফুল শাটডাউন হ্যান্ডলিং (Ctrl+C)
process.on('SIGINT', () => {
  info('বট বন্ধ করা হচ্ছে (SIGINT)...');
  server.close(() => {
    info('বট সফলভাবে বন্ধ হলো।');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  info('বট বন্ধ করা হচ্ছে (SIGTERM)...');
  server.close(() => {
    info('বট সফলভাবে বন্ধ হলো।');
    process.exit(0);
  });
});

// অপ্রত্যাশিত rejections ধরা
process.on('unhandledRejection', (reason, promise) => {
  error('অপ্রসেসড প্রমিস রিজেকশন', reason);
});

process.on('uncaughtException', (err) => {
  error('অনক্যাচড এক্সzeption (uncaughtException)', err);
  process.exit(1);
});

module.exports = { app, server };
