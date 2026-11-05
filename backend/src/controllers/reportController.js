const Report = require('../models/Report');

// @desc    Submit a moderation report for a question or answer
// @route   POST /reports
const createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason } = req.body;

    const report = await Report.create({
      reporterId: req.user._id,
      targetId,
      targetType,
      reason
    });

    res.status(201).json({
      success: true,
      message: 'আপনার রিপোর্টটি সফলভাবে জমা হয়েছে। অ্যাডমিন এটি যাচাই করে প্রয়োজনীয় ব্যবস্থা নেবেন।',
      reportId: report._id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport
};
