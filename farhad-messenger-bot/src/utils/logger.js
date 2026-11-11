'use strict';

/**
 * লগার মডিউল — বটের সব ইভেন্ট কনসোলে এবং লগ ফাইলে রেকর্ড করে।
 * লেখা: বাংলা মন্তব্য সহ।
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');

try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (err) {
  // লগ ফোল্ডার তৈরি না হলে কনসোল লগে ফলব্যাক করবে
}

const LOG_FILE = path.join(LOG_DIR, 'bot.log');

/**
 * টাইমস্ট্যাম্পসহ লগ লাইন ফরম্যাট করে।
 * @param {string} level — লগের লেভেল (info, warn, error)
 * @param {string} message — লগ বার্তা
 * @returns {string}
 */
function _format(level, message) {
  const now = new Date();
  const timestamp = now.toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

/**
 * তথ್ಯ লগ করে।
 * @param {string} message
 */
function info(message) {
  const line = _format('info', message);
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) {}
}

/**
 * সতর্কতা লগ করে।
 * @param {string} message
 */
function warn(message) {
  const line = _format('warn', message);
  console.warn(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) {}
}

/**
 * ত্রুটি লগ করে। এ রর ოಬজেক্ট পেলে স্ট্যাক ট্রেসও লগ করে।
 * @param {string} message
 * @param {Error|any} [err]
 */
function error(message, err) {
  let line = _format('error', message);
  if (err) {
    line += `\n  Stack: ${err.stack || err.message || String(err)}`;
  }
  console.error(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) {}
}

module.exports = { info, warn, error };
