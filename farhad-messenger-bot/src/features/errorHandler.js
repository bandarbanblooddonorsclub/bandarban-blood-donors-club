'use strict';

/**
 * ভুল বার্তা ও ত্রুটি শনাক্ত করার ব্যবস্থা।
 * বটের অপ্রত্যাশিত ত্রুটি লগ করে এবং ব্যবহারকারীকে বন্ধুভাবপূর্ণ বার্তা পাঠায়।
 */

const { t } = require('../utils/language');
const { error } = require('../utils/logger');

/**
 * একটি Async ফাংশন_wrapper যা ত্রুটি ধরে ফেলে এবং নিরাপদ উত্তর রিটার্ন করে।
 * @param {Function} fn
 * @returns {Function}
 */
function safeAsync(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      error('অপ্রত্যাশিত ত্রুটি ধরা পড়ল', err);
      const lang = args[args.length - 1] && typeof args[args.length - 1] === 'string'
        ? args[args.length - 1]
        : 'bn';
      return t(lang, 'error');
    }
  };
}

/**
 * একটি ব্যবহারকারী ইনপুট যাচাই করে যা খালি অথবা শুধুemicoji/space হলে true রিটার্ন করে।
 * @param {string} text
 * @returns {boolean}
 */
function isEmptyOrOnlyEmoji(text) {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  // ইমোজি চিহ্ন পরিষ্কার করে যাচাই
  const withoutEmoji = trimmed.replace(/[\u{1F300}-\u{1F9FF}]|\u{200D}|\u{FE0F}/gu, '').trim();
  return withoutEmoji.length === 0;
}

module.exports = { safeAsync, isEmptyOrOnlyEmoji };
