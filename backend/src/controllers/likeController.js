const mongoose = require('mongoose');
const Vote = require('../models/Vote');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const feedCache = require('../config/cache');

// @desc    Toggle helpful like (Upvote) on Question or Answer
// @route   POST /like/:targetType/:targetId
const toggleLike = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.user._id;

    const TargetModel = targetType === 'question' ? Question : Answer;

    // Verify target exists
    const targetDoc = await TargetModel.findById(targetId).select('_id likeCount');
    if (!targetDoc) {
      return res.status(404).json({
        success: false,
        message: 'আইটেমটি খুঁজে পাওয়া যায়নি।'
      });
    }

    // 1. Try to find and remove existing vote (Unlike)
    const existingVote = await Vote.findOneAndDelete({
      userId,
      targetId
    });

    if (existingVote) {
      // User is unliking: decrement likeCount ($inc: -1)
      const updated = await TargetModel.findByIdAndUpdate(
        targetId,
        { $inc: { likeCount: -1 } },
        { new: true, select: 'likeCount' }
      );

      if (targetType === 'question') {
        feedCache.clear();
      }

      return res.status(200).json({
        success: true,
        liked: false,
        likeCount: Math.max(0, updated ? updated.likeCount : 0),
        message: 'লাইক প্রত্যাহার করা হয়েছে।'
      });
    }

    // 2. User is liking: create vote document and increment likeCount ($inc: 1)
    try {
      await Vote.create({
        userId,
        targetId,
        targetType
      });

      const updated = await TargetModel.findByIdAndUpdate(
        targetId,
        { $inc: { likeCount: 1 } },
        { new: true, select: 'likeCount' }
      );

      if (targetType === 'question') {
        feedCache.clear();
      }

      return res.status(200).json({
        success: true,
        liked: true,
        likeCount: updated ? updated.likeCount : 1,
        message: 'সহায়ক হিসেবে লাইক যোগ করা হয়েছে।'
      });
    } catch (err) {
      // Handle unique compound index collision if rapid double-clicks occur
      if (err.code === 11000) {
        return res.status(200).json({
          success: true,
          liked: true,
          likeCount: targetDoc.likeCount,
          message: 'ইতিমধ্যে লাইক দেওয়া আছে।'
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleLike
};
