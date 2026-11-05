const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware verifying JWT Bearer token.
 * Attaches authenticated user object to req.user.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'অনুমোদন প্রয়োজন। অনুগ্রহ করে লগইন করুন।'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    // Fetch user to verify account status and banned flag
    const user = await User.findById(decoded.id).select('_id alias role isBanned');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে।'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'অবৈধ বা মেয়াদোত্তীর্ণ টোকেন।'
    });
  }
};

/**
 * Optional authentication middleware for public endpoints where user ID can enhance response
 * (e.g., highlighting whether current user liked the item or not)
 */
const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.id).select('_id alias role isBanned');
    if (user && !user.isBanned) {
      req.user = user;
    }
  } catch {
    req.user = null;
  }
  next();
};

/**
 * Admin-only authorization guard
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'শুধুমাত্র অ্যাডমিন এই এক্সেস করতে পারেন।'
    });
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireAdmin
};
