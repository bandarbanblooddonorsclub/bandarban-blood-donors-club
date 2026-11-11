'use strict';

/**
 * স্প্যাম নিয়ন্ত্রণ ব্যবস্থা — একই ব্যবহারকারীর খুব দ্রুত বার্তা পাঠানো নিয়ন্ত্রণ করে।
 * মেমোরিতে টাইম-ভিত্তিক উইন্ডো রয়ে রাখা হয়।
 */

const { t } = require('../utils/language');
const { settings } = require('../database');
const { warn } = require('../utils/logger');

// userid -> { count, resetAt }
const userWindows = new Map();

/**
 * স্প্যাম লিমিট যাচাই করে।
 * @param {string} userId — ব্যবহারকারীর আইডি
 * @param {string} lang — ভাষা
 * @returns { {allowed: boolean, reply: string|null, remainingSeconds: number} }
 */
function checkSpam(userId, lang = 'bn') {
  if (!userId) {
    return { allowed: true, reply: null, remainingSeconds: 0 };
  }

  const cfg = settings();
  const limit = Number(cfg.spamLimit) || 5;
  const windowSecs = Number(cfg.spamWindowSeconds) || 10;

  const now = Date.now();
  const window = userWindows.get(userId);

  if (!window || now > window.resetAt) {
    // নতুন উইন্ডো শুরু
    userWindows.set(userId, { count: 1, resetAt: now + windowSecs * 1000 });
    return { allowed: true, reply: null, remainingSeconds: 0 };
  }

  // একই উইন্ডোর ভেতর
  window.count += 1;
  if (window.count > limit) {
    const remaining = Math.ceil((window.resetAt - now) / 1000);
    warn(`স্প্যাম শনাক্ত: ব্যবহারকারী ${userId} ${window.count} বার্তা পাঠিয়েছে`);
    return {
      allowed: false,
      reply: t(lang, 'spamWarning'),
      remainingSeconds: remaining > 0 ? remaining : 0
    };
  }

  return { allowed: true, reply: null, remainingSeconds: 0 };
}

/**
 * একজন ব্যবহারকারীর স্প্যাম উইন্ডো রিসেট করে।
 * @param {string} userId
 */
function resetSpam(userId) {
  if (userId) userWindows.delete(userId);
}

module.exports = { checkSpam, resetSpam };
