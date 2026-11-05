const express = require('express');
const router = express.Router();
const {
  getQuestionsFeed,
  searchQuestions,
  getQuestionById,
  createQuestion
} = require('../controllers/questionController');
const { createAnswer } = require('../controllers/answerController');
const { authenticate, optionalAuthenticate } = require('../middlewares/auth');
const { postQuestionLimiter, postAnswerLimiter } = require('../middlewares/rateLimiter');
const { validateQuestion, validateAnswer } = require('../middlewares/validator');
const { profanityFilter } = require('../middlewares/profanityFilter');

// Search endpoint for duplicate checks (placed BEFORE /:id to avoid path conflicts)
router.get('/search', searchQuestions);

// Feed endpoint with cursor pagination (in-memory cached for 15s)
router.get('/', optionalAuthenticate, getQuestionsFeed);

// Single question details with paginated answers
router.get('/:id', optionalAuthenticate, getQuestionById);

// Post new question (max 2 per min per user)
router.post(
  '/',
  authenticate,
  postQuestionLimiter,
  validateQuestion,
  profanityFilter,
  createQuestion
);

// Post answer to a question (max 5 per min per user)
router.post(
  '/:id/answers',
  authenticate,
  postAnswerLimiter,
  validateAnswer,
  profanityFilter,
  createAnswer
);

module.exports = router;
