'use strict';

/**
 * কমান্ড পরিচালনা ব্যবস্থা — বটের সকল কমান্ড রাউট করে।
 * কমান্ডের_PREFIX দিয়ে শুরু হলে এটি হ্যান্ডেল করে।
 */

const { t } = require('../utils/language');
const { saveUser, getUser, settings } = require('../database');
const admin = require('../admin');
const { info, warn, error } = require('../utils/logger');

/**
 * কমান্ড রেজিস্ট্রি — প্রতিটি কমান্ড একটি অ্যাসিনক ফাংশন:
 * (args, userId, lang, context) => Promise<string|undefined>
 */
const commands = new Map();

/**
 * একটি কমান্ড নিবন্ধন করে।
 * @param {string[]|string} names — ক 명령ের নামের তালিকা (পূর্ব-প্রিফিক্স ছাড়া)
 * @param {Function} handler — হ্যান্ডলার ফাংশন
 */
function register(names, handler) {
  (Array.isArray(names) ? names : [names]).forEach((name) => {
    commands.set(name.toLowerCase(), handler);
  });
}

/**
 * পাঠানো বার্তা কমান্ড কিনা যাচাই করে এবং হ্যান্ডেল করে।
 * @param {string} text — ব্যবহারকারীর বার্তা
 * @param {string} userId — প্রেরকের আইডি
 * @param {string} lang — ভাষা ('bn' অথবা 'eng')
 * @param {object} [context] — অতিরিক্ত প্রসঙ্গ
 * @returns {Promise<{isCommand:boolean, reply:string|null}>}
 */
async function handle(text, userId, lang = 'bn', context = {}) {
  if (!text || typeof text !== 'string') {
    return { isCommand: false, reply: null };
  }

  const cfg = settings();
  const prefix = cfg.commandPrefix || '!';
  const trimmed = text.trim();

  if (!trimmed.startsWith(prefix)) {
    return { isCommand: false, reply: null };
  }

  // কমান্ড এবং আর্গুমেন্ট আলাদা করুন
  const withoutPrefix = trimmed.slice(prefix.length).trim();
  const parts = withoutPrefix.split(/\s+/);
  const cmdName = parts[0].toLowerCase();
  const args = parts.slice(1);

  // ব্যবহারকারীর তথ্য সেভ করুন (কমান্ড ব্যবহার করলে)
  try {
    if (userId) {
      saveUser({ id: userId, language: lang });
    }
  } catch (err) {
    warn('কমান্ড হ্যান্ডেলিং সময় ব্যবহারকারী সেভ করতে সমস্যা', err);
  }

  const handler = commands.get(cmdName);
  if (!handler) {
    info(`অজানা কমান্ড: ${cmdName}`);
    return {
      isCommand: true,
      reply: t(lang, 'unknownCommand')
    };
  }

  // বট বন্ধ থাকলে শুধুমাত্র এডমিন কমান্ড চালু করতে দেয়
  if (!admin.isBotEnabled() && cmdName !== 'enable' && cmdName !== 'on') {
    if (!admin.isAdmin(userId)) {
      return { isCommand: true, reply: t(lang, 'botDisabled') };
    }
  }

  try {
    const reply = await handler(args, userId, lang, context);
    return { isCommand: true, reply: reply || '' };
  } catch (err) {
    error(`কমান্ড "${cmdName}" execute করতে ত্রুটি`, err);
    return { isCommand: true, reply: t(lang, 'error') };
  }
}

// ---------- বিল্ট-ইন কমান্ডগুলো নিবন্ধন ----------

// !ping — বট সক্রিয় আছে কি না যাচাই
register(['ping'], () => {
  return t('bn', 'ping');
});

// !info — ব্যবহারকারীর তথ্য দেখান
register(['info', 'myinfo'], async (args, userId, lang) => {
  const user = getUser(userId) || {};
  return t(lang, 'info', {
    userId: userId || 'অজানা',
    lang: user.language || lang,
    joinedAt: user.joinedAt || 'অজানা'
  });
});

// !lang — ভাষা পরিবর্তন (bn অথবা eng)
register(['lang', 'language'], (args, userId, lang) => {
  const target = (args[0] || '').toLowerCase();
  if (target === 'bn' || target === 'eng') {
    try {
      saveUser({ id: userId, language: target });
    } catch (e) {}
    return t(target, 'languageSet', { lang: target === 'bn' ? 'বাংলা' : 'English' });
  }
  return t(lang, 'invalidLang');
});

// !help — সাহায্য বার্তা
register(['help'], (args, userId, lang) => {
  return t(lang, 'help');
});

// !enable / !on — বট চালু (শুধুমাত্র এডমিন)
register(['enable', 'on'], (args, userId, lang) => {
  const result = admin.setBotEnabled(userId, true, lang);
  return result.message;
});

// !disable / !off — বট বন্ধ (শুধুমাত্র এডমিন)
register(['disable', 'off'], (args, userId, lang) => {
  const result = admin.setBotEnabled(userId, false, lang);
  return result.message;
});

// !broadcast — সব ব্যবহারকারীকে বার্তা পাঠানো (শুধুমাত্র এডমিন)
register(['broadcast'], async (args, userId, lang) => {
  const message = args.join(' ').trim();
  const result = admin.prepareBroadcast(userId, message, lang);
  if (!result.ok) return result.message;
  // ব্রডকাস्ट কাজ করতে হলে পেজ অ্যাক্সেস টোকেনের মাধ্যমে Graph API কল প্রয়োজন।
  // এখানে শুধু প্রস্তুতি এবং নোটিফিকেশন রিটার্ন করা হয়েছে।
  return `${result.message} — বার্তা: "${result.broadcastMessage}"`;
});

// !admin — এডমিন কমান্ডের তালিকা
register(['admin'], (args, userId, lang) => {
  if (!admin.isAdmin(userId)) {
    return t(lang, 'notAdmin');
  }
  return t(lang, 'help') +
    '\n\nএডমিন কমান্ড:\n!enable / !on — বট চালু\n!disable / !off — বট বন্ধ\n!broadcast <বার্তা> — সব ব্যবহারকারীকে বার্তা পাঠানো';
});

module.exports = { handle, register, commands };
