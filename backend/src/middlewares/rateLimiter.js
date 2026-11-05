const rateLimit = require('express-rate-limit');

const isRateLimitDisabled = () => process.env.DISABLE_RATE_LIMIT === 'true';

/**
 * Key generator: If user is authenticated, use userId; otherwise fallback to client IP.
 */
const keyGenerator = (req) => {
  return req.user && req.user._id ? req.user._id.toString() : req.ip;
};

// Post question limiter: max 2 requests per 1 minute
const postQuestionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isRateLimitDisabled,
  keyGenerator,
  message: {
    success: false,
    message: 'আপনি খুব ঘন ঘন প্রশ্ন করছেন। প্রতি মিনিটে সর্বোচ্চ ২টি প্রশ্ন পোস্ট করা যাবে। দয়া করে কিছুক্ষণ অপেক্ষা করুন।'
  }
});

// Post answer / comment limiter: max 5 requests per 1 minute
const postAnswerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isRateLimitDisabled,
  keyGenerator,
  message: {
    success: false,
    message: 'আপনি খুব ঘন ঘন উত্তর দিচ্ছেন। প্রতি মিনিটে সর্বোচ্চ ৫টি উত্তর পোস্ট করা যাবে।'
  }
});

// Like limiter: max 20 requests per 1 minute
const likeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isRateLimitDisabled,
  keyGenerator,
  message: {
    success: false,
    message: 'খুব দ্রুত লাইক দেওয়া হচ্ছে। প্রতি মিনিটে সর্বোচ্চ ২০টি লাইক টগল করা যাবে।'
  }
});

// Auth endpoints limiter (brute-force defense): 10 per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isRateLimitDisabled,
  message: {
    success: false,
    message: 'অতিরিক্ত লগইন বা রেজিস্ট্রেশন চেষ্টার কারণে সাময়িক স্থগিত। ১৫ মিনিট পর আবার চেষ্টা করুন।'
  }
});

// Upload signature limiter: max 5 upload signatures per 1 minute
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isRateLimitDisabled,
  keyGenerator,
  message: {
    success: false,
    message: 'খুব ঘন ঘন ছবি আপলোড করার চেষ্টা করা হচ্ছে। প্রতি মিনিটে সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে।'
  }
});

module.exports = {
  postQuestionLimiter,
  postAnswerLimiter,
  likeLimiter,
  authLimiter,
  uploadLimiter
};
