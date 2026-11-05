const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middlewares/validator');
const { authLimiter } = require('../middlewares/rateLimiter');
const { profanityFilter } = require('../middlewares/profanityFilter');

// Public auth endpoints protected by brute-force rate limiter
router.post('/register', authLimiter, validateRegister, profanityFilter, register);
router.post('/login', authLimiter, validateLogin, login);

module.exports = router;
