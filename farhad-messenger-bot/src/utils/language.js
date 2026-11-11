'use strict';

/**
 * ভাষা মডিউল — বাংলা ও ইংরেজি ইন্টারফেস স্ট্রিং।
 * বটের উত্তর এবং ইন্টারফেসের ছোট ছোট বার্তাগুলো এখানে রাখা হয়।
 */

const LANGUAGES = {
  bn: {
    welcome: 'নতুন ընկեր/বন্ধু, আপনাকে স্বাগতম! আমি ফরহাদ মেসেঞ্জার এআই বট। আমি আপনার সাহায্যে প্রস্তুত।',
    help: 'সহায়তার জন্য এই কমান্ডগুলো ব্যবহার করতে পারেন:\n!ping — বট সক্রিয় আছে কি না যাচাই\n!info — আপনার তথ্য দেখুন\n!lang bn/eng — ভাষা পরিবর্তন\n!admin — এডমিন কমান্ডের তালিকা\n!broadcast — সব}y përdlostar에게 বার্তা পাঠানো (শুধুমাত্র এডমিন)',
    ping: 'পং! বট সক্রিয় এবং চলমান। 🟢',
    info: 'আপনার ইউজার আইডি: {userId}\nভাষা: {lang}\nনিবন্ধিত된 সময়: {joinedAt}',
    unknownCommand: 'আমি এই কমান্ডটি বুঝতে পারিনি। সাহায্যের জন্য !help টাইপ করুন।',
    botDisabled: 'বট বর্তমানে বন্ধ আছে। এডমিনের অনুমতি ছাড়া এটি চালু করা যাবে না।',
    adminOnly: 'এই কমান্ডটি শুধুমাত্র এডমিনদের জন্য।',
    notAdmin: 'আপনি এডমিন নন। এই কমান্ড ব্যবহার করার অনুমতি নেই।',
    broadcastSent: 'ব্রডকাস্ট বার্তাটি পাঠানো হয়েছে।',
    languageSet: 'ভাষা সেট করা হয়েছে: {lang}',
    invalidLang: 'অবৈধ ভাষা। ব্যবহার করুন: bn অথবা eng',
    spamWarning: 'আপনি খুব দ্রুত বার্তা পাঠাচ্ছেন। থেমে অপেক্ষা করুন, তারপর আবার চেষ্টা করুন।',
    groupInfo: 'গ্রুপের নাম: {groupName}\nগ্রুপ আইডি: {groupId}\nসদস্য সংখ্যা: {memberCount}',
    memberSaved: 'আপনার তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।',
    error: 'দুঃখিত, একটি ত্রুটি ঘটেছে। অনুগ্রব করে পরে আবার চেষ্টা করুন।',
    botEnabled: 'বট এখন চালু করা হয়েছে।',
    botDisabledMsg: 'বট এখন বন্ধ করা হয়েছে।'
  },
  eng: {
    welcome: 'Welcome new friend! I am Farhad Messenger AI Bot. I am ready to help you.',
    help: 'You can use these commands:\n!ping — check if bot is active\n!info — view your information\n!lang bn/eng — change language\n!admin — list admin commands\n!broadcast — send message to all users (admin only)',
    ping: 'Pong! Bot is active and running. 🟢',
    info: 'Your User ID: {userId}\nLanguage: {lang}\nJoined at: {joinedAt}',
    unknownCommand: "I didn't understand this command. Type !help for help.",
    botDisabled: 'Bot is currently disabled. Cannot enable without admin permission.',
    adminOnly: 'This command is for admins only.',
    notAdmin: 'You are not an admin. You do not have permission to use this command.',
    broadcastSent: 'Broadcast message has been sent.',
    languageSet: 'Language set to: {lang}',
    invalidLang: 'Invalid language. Use: bn or eng',
    spamWarning: 'You are sending messages too fast. Please wait and try again.',
    groupInfo: 'Group name: {groupName}\nGroup ID: {groupId}\nMember count: {memberCount}',
    memberSaved: 'Your information has been saved successfully.',
    error: 'Sorry, an error occurred. Please try again later.',
    botEnabled: 'Bot is now enabled.',
    botDisabledMsg: 'Bot is now disabled.'
  }
};

/**
 * নির্দিষ্ট ভাষার একটি স্ট্রিং রিটার্ন করে, প্লেসহোল্ডার পরিবর্তনসহ।
 * @param {string} lang — 'bn' অথবা 'eng'
 * @param {string} key — স্ট্রিং কী
 * @param {object} [params] — প্লেসহোল্ডার প্যারামিটার
 * @returns {string}
 */
function t(lang, key, params = {}) {
  const dict = LANGUAGES[lang] || LANGUAGES.eng;
  let text = dict[key] || key;
  Object.keys(params).forEach((k) => {
    text = text.replace(new RegExp(`{${k}}`, 'g'), String(params[k]));
  });
  return text;
}

module.exports = { LANGUAGES, t };
