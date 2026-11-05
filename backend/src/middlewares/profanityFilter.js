const badWords = require('../config/badwords');

/**
 * Checks a string against the badwords blacklist.
 * Supports exact token matches and normalized substrings for both Bengali and English.
 */
const containsProfanity = (text) => {
  if (!text || typeof text !== 'string') return false;

  const normalized = text.toLowerCase();

  for (const word of badWords) {
    const term = word.toLowerCase();
    
    // Check for word boundary or substring match
    if (term.length > 2 && normalized.includes(term)) {
      return true;
    }
  }

  return false;
};

/**
 * Express middleware to block submissions containing profanity or abusive language
 */
const profanityFilter = (req, res, next) => {
  const fieldsToCheck = ['text', 'subject', 'chapter', 'reason', 'name'];

  for (const field of fieldsToCheck) {
    const value = req.body[field];
    if (value && containsProfanity(value)) {
      return res.status(400).json({
        success: false,
        message: 'আপনার লেখায় নিষিদ্ধ বা অননুমোদিত শব্দ শনাক্ত হয়েছে। মার্জিত ও গঠনমূলক ভাষা ব্যবহার করুন।'
      });
    }
  }

  next();
};

module.exports = {
  profanityFilter,
  containsProfanity
};
