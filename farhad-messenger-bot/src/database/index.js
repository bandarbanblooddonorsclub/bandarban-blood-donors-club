'use strict';

/**
 * ডাটাবেজ মডিউল — JSON ফাইল ভিত্তিক সরল ও পোর্টেবল ডাটাবেজ।
 * ব্যবহারকারীর তথ্য, গ্রুপের তথ্য এবং বটের সেটিংস এখানে সংরক্ষিত হয়।
 * টারমুক্স এবং লিনাক্স সার্ভার میں কোনো নেটিভ কম্পাইলেশন ছাড়াই চলবে।
 */

const fs = require('fs');
const path = require('path');
const { info, error } = require('../utils/logger');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  error('ডাটাবেজ ফোল্ডার তৈরি করতে সমস্যা হয়েছে', err);
}

/**
 * JSON ফাইল থেকে ডাটা পড়ে। ফাইল না থাকলে ডিফল্ট ভ্যালু রিটার্ন করে।
 * @param {string} filePath
 * @param {any} defaultValue
 * @returns {any}
 */
function _readJson(filePath, defaultValue = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw.trim() === '' ? defaultValue : JSON.parse(raw);
  } catch (err) {
    error(`ডাটা ফাইল পড়তে সমস্যা: ${filePath}`, err);
    return defaultValue;
  }
}

/**
 * ডাটা JSON ফাইলে লিখে সেভ করে।
 * @param {string} filePath
 * @param {any} data
 */
function _writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    error(`ডাটা ফাইলে লেখায় সমস্যা: ${filePath}`, err);
  }
}

/**
 * ব্যবহারকারীর প্রোফাইল সংরক্ষণ/আপডেট করে।
 * @param {object} user — { id, firstName, lastName, profilePic, language, ... }
 */
function saveUser(user) {
  if (!user || !user.id) {
    throw new Error('ব্যবrugতকারী আইডি ছাড়া ব্যবহারকারী সেভ করা যাবে না');
  }
  const users = _readJson(USERS_FILE, {});
  const existing = users[user.id] || {
    id: user.id,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    language: 'bn',
    joinedAt: new Date().toISOString(),
    messageCount: 0,
    lastSeen: null,
    isBlocked: false
  };
  // আপডেট করুন Existing ক্ষেত্রগুলো
  users[user.id] = {
    ...existing,
    ...user,
    id: user.id,
    joinedAt: existing.joinedAt,
    messageCount: (existing.messageCount || 0) + 1,
    lastSeen: new Date().toISOString()
  };
  _writeJson(USERS_FILE, users);
  return users[user.id];
}

/**
 * ব্যবহারকারীর তথ্য পড়ে।
 * @param {string} userId
 * @returns {object|null}
 */
function getUser(userId) {
  const users = _readJson(USERS_FILE, {});
  return users[userId] || null;
}

/**
 * সমস্ত ব্যবহারকারী পায়।
 * @returns {object}
 */
function getAllUsers() {
  return _readJson(USERS_FILE, {});
}

/**
 * গ্রুপের তথ্য সংরক্ষণ/আপডেট করে।
 * মনে রাখবেন: ফেসবুকের অফিসিয়াল মেসেঞ্জার প্ল্যাটফর্ম গ্রুপ থ্রেডের সম্পূর্ণ তথ্য (সদস্য তালিকা ইত্যাদি) বটের জন্য সীমিতভাবে উপলব্ধ করে।
 * @param {object} group — { id, name, memberCount, ... }
 */
function saveGroup(group) {
  if (!group || !group.id) {
    throw new Error('গ্রুপ আইডি ছাড়া গ্রুপ সেভ করা যাবে না');
  }
  const groups = _readJson(GROUPS_FILE, {});
  groups[group.id] = {
    ...(groups[group.id] || {}),
    ...group,
    id: group.id,
    updatedAt: new Date().toISOString()
  };
  _writeJson(GROUPS_FILE, groups);
  return groups[group.id];
}

/**
 * গ্রুপের তথ্য পড়ে।
 * @param {string} groupId
 * @returns {object|null}
 */
function getGroup(groupId) {
  const groups = _readJson(GROUPS_FILE, {});
  return groups[groupId] || null;
}

/**
 * সমস্ত গ্রুপ পায়।
 * @returns {object}
 */
function getAllGroups() {
  return _readJson(GROUPS_FILE, {});
}

/**
 * বটের সেটিংস পায়/লিখে।
 * @param {object|null} updates — সেট করা valeها। null হলে বর্তমান সেটিংস রিটার্ন করে।
 * @returns {object}
 */
function settings(updates = null) {
  const current = _readJson(SETTINGS_FILE, {
    botEnabled: true,
    commandPrefix: '!',
    aiProvider: 'rule-based',
    spamLimit: 5,
    spamWindowSeconds: 10,
    welcomeMessage: 'নতুন ਸਦৃশ্য, আপনাকে স্বাগতম! আমি ফরহাদ মেসেঞ্জার এআই বট।'
  });
  if (updates) {
    const merged = { ...current, ...updates, updatedAt: new Date().toISOString() };
    _writeJson(SETTINGS_FILE, merged);
    return merged;
  }
  return current;
}

/**
 * স্প্যাম কাউন্টার রিসেট করে (টাইম-ভিত্তিক এবংয়ে ব্যবহৃত হয়)
 */
function clearSpamWindow() {
  // ইউজার-ভিত্তিক স্প্যাম কাউন্টার 메모리에 রাখা হয় (src/features/spamControl.js দেখুন)
  return true;
}

module.exports = {
  saveUser,
  getUser,
  getAllUsers,
  saveGroup,
  getGroup,
  getAllGroups,
  settings,
  clearSpamWindow
};
