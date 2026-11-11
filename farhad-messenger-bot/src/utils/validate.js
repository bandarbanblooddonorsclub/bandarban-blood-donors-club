'use strict';

/**
 * যাচাইকরণ মডিউল — ব্যবহারকারীর ইনপুট এবং ডাটা যাচাই করে।
 */

const validate = {
  /**
   * ফেসবুক পেজ-সPacific IDs যাচাই (কেবল সংখ্যার স্ট্রিং)
   * @param {string} id
   * @returns {boolean}
 */
  isFacebookId(id) {
    return typeof id === 'string' && /^\d+$/.test(id) && id.length > 0;
  },

  /**
   * 언어 কোড যাচাই (bn অথবা eng)
   * @param {string} lang
   * @returns {boolean}
   */
  isLanguage(lang) {
    return lang === 'bn' || lang === 'eng';
  },

  /**
   * নন-খালি স্ট্রিং যাচাই
   * @param {any} value
   * @returns {boolean}
   */
  isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  },

  /**
   * ইমেইল যাচাই (সরল)
   * @param {string} email
   * @returns {boolean}
   */
  isEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

module.exports = validate;
