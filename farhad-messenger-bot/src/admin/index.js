'use strict';

/**
 * এডমিন সিস্টেম — বটের নিয়ন্ত্রণ ব্যবস্থা।
 * শুধুমাত্র তালিকাভুক্ত এডমিন ব্যবহারকারী estos কমান্ড ব্যবহার করতে পারবেন।
 */

const { settings } = require('../database');
const { t } = require('../utils/language');
const { info, warn } = require('../utils/logger');

/**
 * এডমিন আইডি তালিকা পায় (.env থেকে এবং ডাটাবেজ থেকে)
 * @returns {Set<string>}
 */
function getAdminIds() {
  const admins = new Set();
  const envAdmins = process.env.ADMIN_USER_IDS;
  if (envAdmins) {
    envAdmins.split(',').forEach((id) => {
      const trimmed = id.trim();
      if (trimmed) admins.add(trimmed);
    });
  }
  return admins;
}

/**
 * যাচাই করে একজন ইউজার এডমিন কিনা।
 * @param {string} userId
 * @returns {boolean}
 */
function isAdmin(userId) {
  if (!userId) return false;
  return getAdminIds().has(String(userId));
}

/**
 * বট চালু/বন্ধের অবস্থা পরিবর্তন করে (শুধুমাত্র এডমিন)
 * @param {string} userId — অনুরোধকারী এডমিন
 * @param {boolean} enable — true = চালু, false = বন্ধ
 * @returns {Promise<{ok:boolean, message:string, lang:string}>}
 */
function setBotEnabled(userId, enable, lang = 'bn') {
  if (!isAdmin(userId)) {
    return { ok: false, message: t(lang, 'notAdmin'), lang };
  }
  settings({ botEnabled: enable });
  info(`এডমিন ${userId} বটের অবস্থা পরিবর্তন করলেন: ${enable ? 'চালু' : 'বন্ধ'}`);
  return {
    ok: true,
    message: enable ? t(lang, 'botEnabled') : t(lang, 'botDisabledMsg'),
    lang
  };
}

/**
 * বর্তমান বট स्थिति রিটার্ন করে।
 * @returns {boolean}
 */
function isBotEnabled() {
  return settings().botEnabled !== false;
}

/**
 * ব্রডকাস্ট-message প্রস্তুত করে (শুধুমাত্র এডমিন)
 * @param {string} userId — অনুরোধকারী এডমিন
 * @param {string} message — ব্রডকাস্ট বার্তা
 * @param {string} lang
 * @returns {Promise<{ok:boolean, message:string, broadcastMessage:string|null, lang:string}>}
 */
function prepareBroadcast(userId, message, lang = 'bn') {
  if (!isAdmin(userId)) {
    return { ok: false, message: t(lang, 'notAdmin'), lang };
  }
  if (!message || message.trim().length === 0) {
    return { ok: false, message: 'ব্রডকাস্ট বার্তাটি খালি হতে পারবে না।', lang };
  }
  info(`এডমিন ${userId} ব্রডকাস্ট প্রস্তুত করলেন`);
  return {
    ok: true,
    message: t(lang, 'broadcastSent'),
    broadcastMessage: message.trim(),
    lang
  };
}

module.exports = { getAdminIds, isAdmin, setBotEnabled, isBotEnabled, prepareBroadcast };
