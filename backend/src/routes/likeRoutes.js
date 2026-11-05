const express = require('express');
const router = express.Router();
const { toggleLike } = require('../controllers/likeController');
const { authenticate } = require('../middlewares/auth');
const { likeLimiter } = require('../middlewares/rateLimiter');
const { validateLike } = require('../middlewares/validator');

// Toggle like on question or answer (max 20 per min)
router.post(
  '/:targetType/:targetId',
  authenticate,
  likeLimiter,
  validateLike,
  toggleLike
);

module.exports = router;
