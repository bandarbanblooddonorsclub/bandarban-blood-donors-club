'use strict';

/**
 * স্বয়ংক্রিয় উত্তর ব্যবস্থা — এআই সিস্টেমের মাধ্যমে ব্যবহারকারীর বার্তার উত্তর দেয়।
 */

const ai = require('../ai');
const { saveUser } = require('../database');
const { info } = require('../utils/logger');

/**
 * একটি মেসেজ ইভেন্ট প্রসেস করে এবং এআই উত্তর তৈরি করে।
 * @param {object} messageEvent — ফেসবুক 웹হুক মেসেজ ইভেন্ট
 * @returns {Promise<{reply:string, lang:string}>}
 */
async function handleAutoReply(messageEvent) {
  const senderId = messageEvent.sender && messageEvent.sender.id ? String(messageEvent.sender.id) : null;
  const text = messageEvent.message && messageEvent.message.text ? messageEvent.message.text : '';
  const lang = detectUserLang(senderId, text);

  // ব্যবহারকারীর তথ্য সেভ করুন
  if (senderId) {
    try {
      saveUser({ id: senderId, language: lang, lastSeen: new Date().toISOString() });
    } catch (e) {}
  }

  const reply = await ai.generateReply(text, lang);
  info(`স্বয়ংক্রিয় উত্তর তৈরি হলো ব্যবহারকারী ${senderId || 'অজানা'} এর জন্য`);
  return { reply, lang };
}

/**
 * ব্যবহারকারীর ভাষা শনাক্ত করে। ডাটাবেজে সংরক্ষিত ভাষা থাকলে সেটি অগ্রাধিকার পায়।
 * @param {string|null} senderId
 * @param {string} text
 * @returns {'bn'|'eng'}
 */
function detectUserLang(senderId, text) {
  const aiLang = ai.detectLanguage(text);
  if (!senderId) return aiLang;
  try {
    const db = require('../database');
    const user = db.getUser(senderId);
    if (user && user.language) {
      return user.language === 'bn' ? 'bn' : 'eng';
    }
  } catch (e) {}
  return aiLang;
}

module.exports = { handleAutoReply, detectUserLang };
