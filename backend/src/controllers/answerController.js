const mongoose = require('mongoose');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const feedCache = require('../config/cache');

// @desc    Post an answer/comment to a question
// @route   POST /questions/:id/answers
const createAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, imageUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'অবৈধ প্রশ্ন আইডি।'
      });
    }

    // Verify question exists
    const question = await Question.findById(id).select('_id');
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'যে প্রশ্নে উত্তর দিতে চাচ্ছেন তা পাওয়া যায়নি।'
      });
    }

    // 1. Create the answer document
    const answer = await Answer.create({
      questionId: id,
      authorId: req.user._id,
      alias: req.user.alias,
      text,
      imageUrl: imageUrl || null
    });

    // 2. Atomically increment answerCount on the parent Question document
    await Question.findByIdAndUpdate(id, {
      $inc: { answerCount: 1 }
    });

    // Invalidate feed cache so the updated answerCount is reflected
    feedCache.clear();

    res.status(201).json({
      success: true,
      message: 'উত্তর সফলভাবে প্রকাশিত হয়েছে।',
      answer: {
        _id: answer._id,
        questionId: answer.questionId,
        alias: answer.alias,
        text: answer.text,
        imageUrl: answer.imageUrl,
        likeCount: answer.likeCount,
        createdAt: answer.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAnswer
};
