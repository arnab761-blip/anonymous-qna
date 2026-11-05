/**
 * Centralized Global Error Handler
 * Gracefully handles operational and unexpected errors without exposing stack traces.
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error caught by global handler]:', err);

  // Mongoose duplicate key error (e.g. unique index violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const message = field === 'identifier'
      ? 'এই ইমেইল বা ফোন নম্বরটি ইতিমধ্যে নিবন্ধিত।'
      : field === 'alias'
      ? 'অ্যানোনিমাস আইডিতে কনফ্লিক্ট হয়েছে, আবার চেষ্টা করুন।'
      : 'ডুপ্লিকেট এন্ট্রি শনাক্ত হয়েছে।';

    return res.status(409).json({
      success: false,
      message
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'ডাটা ভ্যালিডেশন ব্যর্থ হয়েছে।'
    });
  }

  // Mongoose bad ObjectId CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'অবৈধ আইডি ফরম্যাট।'
    });
  }

  // JSON parse error in body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'অনুরোধের JSON ডাটাটি ত্রুটিপূর্ণ।'
    });
  }

  // Default internal server error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message && process.env.NODE_ENV !== 'production'
      ? err.message
      : 'সার্ভারে সাময়িক সমস্যা দেখা দিয়েছে। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন।'
  });
};

module.exports = errorHandler;
