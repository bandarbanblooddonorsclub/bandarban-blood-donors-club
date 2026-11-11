'use strict';

/**
 * এআই সিস্টেম — স্বয়ংক্রিয় কথোপকথন।
 * norms-ভিত্তিক রুলসের ওপর ভিত্তি করে বাংলা ও ইংরেজিতে উত্তর দেয়।
 * প্রয়োজন হলে বাহ্যিক OpenAI API-এ সংযুক্ত করার সুযোগ রাখা হয়েছে (AI_PROVIDER=openai)।
 */

const { t } = require('../utils/language');
const { settings } = require('../database');
const { info, error } = require('../utils/logger');

// বাংলা ও ইংরেজি কিওয়ার্ড এবং উত্তর প্যাটার্ন
const RULES = [
  // বাংলা — অভিবাদন
  {
    lang: 'bn',
    patterns: ['সালাম', 'অস্সালামু আলাইকুম', 'হাই', 'হ্যালো', 'নমস্কার', 'কেমন আছো', 'কেমন আছেন'],
    reply: (lang) => t(lang, 'welcome')
  },
  // ইংরেজি — অভিবাদন
  {
    lang: 'eng',
    patterns: ['hi', 'hello', 'hey', 'salam', 'assalamu alaikum', 'how are you', 'good morning', 'good evening'],
    reply: (lang) => t(lang, 'welcome')
  },
  // বাংলা — বট পরিচয়
  {
    lang: 'bn',
    patterns: ['তুমি কে', 'আপনি কে', 'তুমি কী', 'বট পরিচয়', 'তোমার নাম কী', 'আপনার নাম কী'],
    reply: () => 'আমি ফরহাদ মেসেঞ্জার এআই বট, যা Md Farhad Uddin তৈরি করেছেন। আমি আপনার কথার উত্তর দিতে সক্ষম।'
  },
  // ইংরেজি — বট পরিচয়
  {
    lang: 'eng',
    patterns: ['who are you', 'your name', 'bot identity', 'what is your name', 'are you a bot'],
    reply: () => 'I am Farhad Messenger AI Bot, created by Md Farhad Uddin. I am here to answer your questions.'
  },
  // বাংলা — ধন্যবাদ
  {
    lang: 'bn',
    patterns: ['ধন্যবাদ', 'থ্যাঁকস', 'thanks', 'শুকরিয়া'],
    reply: (lang) => t(lang, 'memberSaved') || 'আপনাকে স্বাগতম!'
  },
  // ইংরেজি — ধন্যবাদ
  {
    lang: 'eng',
    patterns: ['thank you', 'thanks', 'thankyou'],
    reply: (lang) => t(lang, 'memberSaved') || "You're welcome!"
  },
  // বাংলা — বイドbye
  {
    lang: 'bn',
    patterns: ['বাই', 'আলবিদা', 'ভলো থাকো', 'খোদা হাফেজ'],
    reply: () => 'আলবিদা! ভালো থাকুন, আল্লাহ হাফেজ।'
  },
  // ইংরেজি — bye
  {
    lang: 'eng',
    patterns: ['bye', 'goodbye', 'see you', 'take care'],
    reply: () => 'Goodbye! Take care. Allah Hafiz.'
  },
  // বাংলা — সাহায্য
  {
    lang: 'bn',
    patterns: ['সহায়তা', 'হেল্প', 'হেল্প চাই', 'কীভাবে'],
    reply: (lang) => t(lang, 'help')
  },
  // ইংরেজি — সাহায্য
  {
    lang: 'eng',
    patterns: ['help', 'assistance', 'support', 'how to'],
    reply: (lang) => t(lang, 'help')
  }
];

/**
 * ব্যবহারকারীর বার্তার ভাষা অনুমান করে।
 * @param {string} text
 * @returns {'bn'|'eng'}
 */
function detectLanguage(text) {
  const lower = text.toLowerCase();
  const bnChars = /[\u0980-\u09FF]/; // বাংলা ইউনিকোড রেঞ্জ
  if (bnChars.test(text)) return 'bn';
  return 'eng';
}

/**
 * রুল-ভিত্তিক উত্তর খোঁয়ায়। কোনো রুল মেলে না হলে null রিটার্ন করে।
 * @param {string} text
 * @param {string} lang
 * @returns {string|null}
 */
function ruleBasedReply(text, lang) {
  const lower = text.toLowerCase();
  for (const rule of RULES) {
    // শুধু সেই রুল চেষ্টা করবো যা ব্যবহারকারীর ভাষার সাথে মেলে অথবা যেসব রুলের কোনো ভাষা নেই
    if (rule.lang && rule.lang !== lang) continue;
    for (const pattern of rule.patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        return rule.reply(lang);
      }
    }
  }
  return null;
}

/**
 * এআই উত্তর জেনারেট করে।
 * @param {string} text — ব্যবহারকারীর বার্তা
 * @param {string} lang — ব্যবহারকারীর ভাষা ('bn' অথবা 'eng')
 * @returns {Promise<string>}
 */
async function generateReply(text, lang = 'bn') {
  try {
    const cfg = settings();
    // বাহ্যিক OpenAI API ব্যবহার (যদি কনফিগার করা থাকে)
    if (cfg.aiProvider === 'openai' && process.env.OPENAI_API_KEY) {
      return await _openaiReply(text, lang);
    }
    // রুল-ভিত্তিক উত্তর চেষ্টা করুন
    const ruleReply = ruleBasedReply(text, lang);
    if (ruleReply) {
      return ruleReply;
    }
    // ডিফল্ট উত্তর
    return t(lang, 'unknownCommand');
  } catch (err) {
    error('এআই উত্তর জেনারেট করতে ত্রুটি', err);
    return t(lang, 'error');
  }
}

/**
 * বাহ্যিক OpenAI ChatCompletion কল (ঐচ্ছিক)।
 * @param {string} text
 * @param {string} lang
 * @returns {Promise<string>}
 */
async function _openaiReply(text, lang) {
  const axios = require('axios');
  try {
    const systemPrompt = lang === 'bn'
      ? 'আপনি বাংলা ভাষায় কথা বলেন। সংক্ষিপ্ত ও বন্ধুভাবপূর্ণ উত্তর দিন।'
      : 'You speak English. Give short and friendly answers.';
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: 200,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    return res.data.choices[0].message.content.trim();
  } catch (err) {
    error('OpenAI API ত্রুটি', err);
    return t(lang, 'error');
  }
}

module.exports = { generateReply, detectLanguage, ruleBasedReply };
