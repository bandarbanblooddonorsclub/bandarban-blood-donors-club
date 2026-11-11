'use strict';

/**
 * নতুন সদস্যদের স্বাগত বার্তা ব্যবস্থা।
 * মেসেঞ্জার প্ল্যাটফর্মে ১:১(msg) কথোপকথনে първиবার মেসেজ পাওয়া গেলে স্বাগত বার্তা পাঠানো হয়।
 * গ্রুপে নতুন সদস্যের স্বাগত officiellement মেসেঞ্জার বটের জন্য সীমিতভাবে উপলব্ধ (দেখুন README.md এর সীমাবদ্ধতা বিভাগ)।
 */

const { t } = require('../utils/language');
const { saveUser } = require('../database');
const { info } = require('../utils/logger');

/**
 * প্রথমবার মেসেজ পাঠানো ব্যবহারকারীকে স্বাগত জানায়।
 * @param {string} senderId — ব্যবহারকারীর আইডি
 * @param {string} lang — ভাষা
 * @returns {string}
 */
function welcomeMessage(senderId, lang = 'bn') {
  if (senderId) {
    try {
      saveUser({ id: senderId, language: lang, joinedAt: new Date().toISOString() });
    } catch (e) {}
  }
  info(`স্বাগত বার্তা পাঠানো হলো: ${senderId || 'অজানা'}`);
  return t(lang, 'welcome');
}

module.exports = { welcomeMessage };
