'use strict';

/**
 * গ্রুপের তথ্য দেখানোর ব্যবস্থা।
 * ⚠️ গুরুত্বপূর্ণ সীমাবদ্ধতা: ফেসবুকের অফিসিয়াল মেসেঞ্জার প্ল্যাটফর্ম বটের জন্য গ্রুপ থ্রেডের পূর্ণ
 * সদস্য তালিকা এবং detailসহ তথ্য সরাসরি উপলব্ধ করneaux নয়। এই মডিউলটি ডাটাবেজে সংরক্ষিত
 * গ্রুপের মৌলিক তথ্য দিয়ে উত্তর দেয়, এবং_OFICIAL API-তে গ্রুপ তথ্য পাওয়া গেলে তা প্রদর্শন করে।
 * বিস্তারিত জন্য README.md এর "ফেসবুক এপিআই সীমাবদ্ধতা" বিভাগ দেখুন।
 */

const { t } = require('../utils/language');
const { saveGroup, getGroup } = require('../database');
const { info, warn } = require('../utils/logger');

/**
 * গ্রুপের তথ্য সংরক্ষণ বা আপডেট করে (Webhook থেকে llegó তথ্য ভিত্তিক)।
 * @param {object} group — { id, name, memberCount, ... }
 */
function recordGroup(group) {
  if (!group || !group.id) return null;
  try {
    return saveGroup(group);
  } catch (err) {
    warn('গ্রুপ তথ্য সংরক্ষণে সমস্যা', err);
    return null;
  }
}

/**
 * গ্রুপের তথ্য ফরম্যাট করে রিটার্ন করে।
 * @param {string} groupId
 * @param {string} lang
 * @returns {string}
 */
function getGroupInfo(groupId, lang = 'bn') {
  const group = getGroup(groupId);
  if (!group) {
    return t(lang, 'groupInfo', {
      groupName: 'অজানা',
      groupId: groupId || 'অজানা',
      memberCount: 'অজানা'
    });
  }
  info(`গ্রুপের তথ্য ফরম্যাট করা হলো: ${groupId}`);
  return t(lang, 'groupInfo', {
    groupName: group.name || 'অজানা',
    groupId: group.id,
    memberCount: group.memberCount || 'অজানা'
  });
}

module.exports = { recordGroup, getGroupInfo };
