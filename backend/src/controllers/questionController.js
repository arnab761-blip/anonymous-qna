const mongoose = require('mongoose');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Vote = require('../models/Vote');
const feedCache = require('../config/cache');

const FEED_LIMIT = 10;
const SEARCH_LIMIT = 5;

// Lean projection for Feed items: strictly omits authorId and sensitive data
const FEED_PROJECTION = {
  subject: 1,
  chapter: 1,
  text: 1,
  imageUrl: 1,
  alias: 1,
  answerCount: 1,
  likeCount: 1,
  isVerifiedByTeacher: 1,
  createdAt: 1
};

// @desc    Get paginated questions feed (cursor-based, no skip())
// @route   GET /questions?cursor=&subject=&chapter=
const getQuestionsFeed = async (req, res, next) => {
  try {
    const { cursor, subject, chapter } = req.query;

    // Cache key based on filter criteria and pagination cursor
    const cacheKey = `feed_${subject || 'all'}_${chapter || 'all'}_${cursor || 'first'}`;
    const cachedData = feedCache.get(cacheKey);

    let baseQuestions;
    let nextCursor;
    let hasMore;
    let isCached = false;

    if (cachedData) {
      baseQuestions = cachedData.questions;
      nextCursor = cachedData.nextCursor;
      hasMore = cachedData.hasMore;
      isCached = true;
    } else {
      const filter = {};

      if (subject && typeof subject === 'string') {
        filter.subject = subject.trim();
      }

      if (chapter && typeof chapter === 'string') {
        filter.chapter = chapter.trim();
      }

      // Cursor pagination using indexed _id: { $lt: cursor }
      if (cursor) {
        if (!mongoose.Types.ObjectId.isValid(cursor)) {
          return res.status(400).json({
            success: false,
            message: 'অবৈধ পেজিনেশন কার্সার।'
          });
        }
        filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
      }

      // Query exactly FEED_LIMIT items sorted by _id descending
      baseQuestions = await Question.find(filter)
        .select(FEED_PROJECTION)
        .sort({ _id: -1 })
        .limit(FEED_LIMIT)
        .lean();

      hasMore = baseQuestions.length === FEED_LIMIT;
      nextCursor = hasMore ? baseQuestions[baseQuestions.length - 1]._id : null;

      // Store in-memory cache for 15 seconds (raw feed items without user-specific like state)
      feedCache.set(
        cacheKey,
        {
          questions: baseQuestions,
          nextCursor,
          hasMore
        },
        15
      );
    }

    // Check which questions current logged-in user has liked
    let userHasLikedMap = new Set();
    if (req.user && req.user._id && baseQuestions && baseQuestions.length > 0) {
      const questionIds = baseQuestions.map((q) => q._id);
      const userVotes = await Vote.find({
        userId: req.user._id,
        targetType: 'question',
        targetId: { $in: questionIds }
      })
        .select('targetId')
        .lean();

      userHasLikedMap = new Set(userVotes.map((v) => v.targetId.toString()));
    }

    const questions = baseQuestions.map((q) => ({
      ...q,
      userHasLiked: userHasLikedMap.has(q._id.toString())
    }));

    res.status(200).json({
      success: true,
      cached: isCached,
      questions,
      nextCursor,
      hasMore
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search questions for similarity / duplicate detection
// @route   GET /questions/search?q=
const searchQuestions = async (req, res, next) => {
  try {
    const { q, subject } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(200).json({
        success: true,
        results: []
      });
    }

    const queryText = q.trim();
    const filter = {};

    if (subject && typeof subject === 'string') {
      filter.subject = subject.trim();
    }

    // Use full-text search index if text length is >= 3
    if (queryText.length >= 3) {
      filter.$text = { $search: queryText };
    } else {
      // Fallback to case-insensitive prefix/substring match for very short keywords
      filter.text = { $regex: queryText, $options: 'i' };
    }

    const results = await Question.find(filter)
      .select({
        subject: 1,
        chapter: 1,
        text: 1,
        answerCount: 1,
        createdAt: 1
      })
      .limit(SEARCH_LIMIT)
      .lean();

    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single question details with cursor-paginated answers
// @route   GET /questions/:id?cursor=
const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cursor } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'অবৈধ প্রশ্ন আইডি।'
      });
    }

    // 1. Fetch Question details (omits authorId)
    const question = await Question.findById(id)
      .select({
        subject: 1,
        chapter: 1,
        text: 1,
        imageUrl: 1,
        alias: 1,
        answerCount: 1,
        likeCount: 1,
        isVerifiedByTeacher: 1,
        createdAt: 1
      })
      .lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'প্রশ্নটি খুঁজে পাওয়া যায়নি।'
      });
    }

    // 2. Fetch Answers with cursor pagination (limit: 10)
    const answerFilter = { questionId: id };
    if (cursor) {
      if (!mongoose.Types.ObjectId.isValid(cursor)) {
        return res.status(400).json({
          success: false,
          message: 'অবৈধ উত্তর কার্সার।'
        });
      }
      answerFilter._id = { $gt: new mongoose.Types.ObjectId(cursor) };
    }

    const answers = await Answer.find(answerFilter)
      .select({
        text: 1,
        imageUrl: 1,
        alias: 1,
        likeCount: 1,
        createdAt: 1
      })
      .sort({ _id: 1 }) // Chronological order
      .limit(FEED_LIMIT)
      .lean();

    const hasMoreAnswers = answers.length === FEED_LIMIT;
    const nextCursor = hasMoreAnswers ? answers[answers.length - 1]._id : null;

    // Check if current logged-in user has liked this question
    let userHasLiked = false;
    if (req.user && req.user._id) {
      const vote = await Vote.findOne({
        userId: req.user._id,
        targetId: id
      }).select('_id').lean();
      userHasLiked = !!vote;
    }

    res.status(200).json({
      success: true,
      question: {
        ...question,
        userHasLiked
      },
      answers,
      nextCursor,
      hasMore: hasMoreAnswers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Post a new question
// @route   POST /questions
const createQuestion = async (req, res, next) => {
  try {
    const { subject, chapter, text, imageUrl } = req.body;

    const question = await Question.create({
      authorId: req.user._id,
      alias: req.user.alias,
      subject,
      chapter,
      text,
      imageUrl: imageUrl || null
    });

    // Invalidate in-memory feed caches so the new question shows up
    feedCache.clear();

    res.status(201).json({
      success: true,
      message: 'প্রশ্ন সফলভাবে পোস্ট করা হয়েছে।',
      question: {
        _id: question._id,
        subject: question.subject,
        chapter: question.chapter,
        text: question.text,
        imageUrl: question.imageUrl,
        alias: question.alias,
        answerCount: question.answerCount,
        likeCount: question.likeCount,
        isVerifiedByTeacher: question.isVerifiedByTeacher,
        createdAt: question.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuestionsFeed,
  searchQuestions,
  getQuestionById,
  createQuestion
};
