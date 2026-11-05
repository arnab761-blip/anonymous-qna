/**
 * Configurable blacklist of profanity and abusive terms (Bengali & English).
 * You can easily add more words to this list at any time.
 */
const badWords = [
  // English common abusive words
  'fuck',
  'shit',
  'bitch',
  'bastard',
  'asshole',
  'dick',
  'slut',
  'whore',
  'cunt',
  'pussy',
  'idiot',
  'stupid',

  // Bengali common abusive/slang words (Unicode & Phonetic/Banglish)
  'কুত্তা',
  'শুয়োর',
  'হারামি',
  'খানকি',
  'মাগি',
  'বেশ্যা',
  'শালা',
  'মাদারচোদ',
  'বাইনচোদ',
  'চোদা',
  'চুদা',
  'শুয়োরের বাচ্চা',
  'খানকির পোলা',
  
  // Banglish / Romanized
  'harami',
  'khanki',
  'magi',
  'madarchod',
  'bainchod',
  'shala',
  'kutta',
  'choda',
  'shuaor'
];

module.exports = badWords;
