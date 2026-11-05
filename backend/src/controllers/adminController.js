const mongoose = require('mongoose');
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Report = require('../models/Report');
const Vote = require('../models/Vote');
const feedCache = require('../config/cache');

// @desc    Get system statistics (Users, Questions, Today's Posts, Database Size)
// @route   GET /admin/stats
const getSystemStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalAnswers = await Answer.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    // Today's midnight timestamp
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayQuestions = await Question.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    // Database size stats from MongoDB
    let storageSizeMB = '0.00';
    let dataSizeMB = '0.00';
    try {
      const stats = await mongoose.connection.db.stats();
      storageSizeMB = (stats.storageSize / (1024 * 1024)).toFixed(2);
      dataSizeMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
    } catch {
      // In case stats command is restricted on some cloud proxy configurations
      storageSizeMB = 'N/A';
    }

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalQuestions,
        totalAnswers,
        todayQuestions,
        pendingReports,
        storageSizeMB,
        dataSizeMB
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get questions list with author's real identity (Name + Phone/Email)
// @route   GET /admin/questions?page=1&limit=20
const getQuestionsWithRealIdentity = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const questions = await Question.find()
      .populate('authorId', 'name identifier role isBanned')
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Question.countDocuments();

    res.status(200).json({
      success: true,
      questions,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get answers for a question with authors' real identities
// @route   GET /admin/questions/:id/answers
const getAnswersWithRealIdentity = async (req, res, next) => {
  try {
    const { id } = req.params;

    const answers = await Answer.find({ questionId: id })
      .populate('authorId', 'name identifier role isBanned')
      .sort({ _id: 1 })
      .lean();

    res.status(200).json({
      success: true,
      answers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Teacher Verified badge on a question
// @route   PATCH /admin/questions/:id/verify
const toggleTeacherVerify = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'প্রশ্নটি পাওয়া যায়নি।'
      });
    }

    question.isVerifiedByTeacher = !question.isVerifiedByTeacher;
    await question.save();

    // Invalidate public feed cache
    feedCache.clear();

    res.status(200).json({
      success: true,
      isVerifiedByTeacher: question.isVerifiedByTeacher,
      message: question.isVerifiedByTeacher
        ? 'প্রশ্নটি শিক্ষক কর্তৃক যাচাইকৃত হিসেবে চিহ্নিত করা হয়েছে।'
        : 'যাচাইকৃত স্ট্যাটাস প্রত্যাহার করা হয়েছে।'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a question and cascade cleanup
// @route   DELETE /admin/questions/:id
const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'প্রশ্নটি পাওয়া যায়নি।'
      });
    }

    await Question.findByIdAndDelete(id);

    // Cascade delete: answers, votes on this question, and reports
    await Answer.deleteMany({ questionId: id });
    await Vote.deleteMany({ targetId: id });
    await Report.deleteMany({ targetId: id });

    feedCache.clear();

    res.status(200).json({
      success: true,
      message: 'প্রশ্ন এবং এর সকল উত্তর সফলভাবে মুছে ফেলা হয়েছে।'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an answer and decrement question's answerCount
// @route   DELETE /admin/answers/:id
const deleteAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'উত্তরটি পাওয়া যায়নি।'
      });
    }

    await Answer.findByIdAndDelete(id);

    // Atomically decrement parent question's answerCount
    await Question.findByIdAndUpdate(answer.questionId, {
      $inc: { answerCount: -1 }
    });

    await Vote.deleteMany({ targetId: id });
    await Report.deleteMany({ targetId: id });

    feedCache.clear();

    res.status(200).json({
      success: true,
      message: 'উত্তরটি সফলভাবে মুছে ফেলা হয়েছে।'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of reports with details
// @route   GET /admin/reports?status=pending
const getReports = async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';

    const reports = await Report.find(status === 'all' ? {} : { status })
      .populate('reporterId', 'name identifier alias')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Populate target content & author details manually
    const detailedReports = await Promise.all(
      reports.map(async (rep) => {
        let targetDoc = null;
        if (rep.targetType === 'question') {
          targetDoc = await Question.findById(rep.targetId)
            .populate('authorId', 'name identifier alias isBanned')
            .select('text subject chapter alias imageUrl authorId')
            .lean();
        } else if (rep.targetType === 'answer') {
          targetDoc = await Answer.findById(rep.targetId)
            .populate('authorId', 'name identifier alias isBanned')
            .select('text alias imageUrl authorId questionId')
            .lean();
        }
        return {
          ...rep,
          targetContent: targetDoc
        };
      })
    );

    res.status(200).json({
      success: true,
      reports: detailedReports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve or dismiss a report
// @route   PATCH /admin/reports/:id
const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'resolved' or 'dismissed'

    if (!['resolved', 'dismissed', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'অবৈধ স্ট্যাটাস।'
      });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'রিপোর্ট স্ট্যাটাস আপডেট করা হয়েছে।',
      report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all students / users with search
// @route   GET /admin/users?q=
const getUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = {};

    if (q && q.trim()) {
      const search = q.trim();
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { identifier: { $regex: search, $options: 'i' } },
        { alias: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('name identifier alias role isBanned createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle student ban / unban
// @route   PATCH /admin/users/:id/ban
const toggleBanUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from banning themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'অ্যাডমিন নিজের অ্যাকাউন্ট ব্যান করতে পারবেন না।'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ইউজার খুঁজে পাওয়া যায়নি।'
      });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      success: true,
      isBanned: user.isBanned,
      message: user.isBanned
        ? `${user.name} (${user.alias})-কে সাময়িকভাবে ব্যান করা হয়েছে।`
        : `${user.name} (${user.alias})-এর ব্যান প্রত্যাহার করা হয়েছে।`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemStats,
  getQuestionsWithRealIdentity,
  getAnswersWithRealIdentity,
  toggleTeacherVerify,
  deleteQuestion,
  deleteAnswer,
  getReports,
  updateReportStatus,
  getUsers,
  toggleBanUser
};
