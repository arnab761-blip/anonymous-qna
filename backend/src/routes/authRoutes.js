const express = require('express');
const router = express.Router();
const { register, login, getStudentDashboard } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middlewares/validator');
const { authLimiter } = require('../middlewares/rateLimiter');
const { profanityFilter } = require('../middlewares/profanityFilter');
const { authenticate } = require('../middlewares/auth');

// Public auth endpoints protected by brute-force rate limiter
router.post('/register', authLimiter, validateRegister, profanityFilter, register);
router.post('/login', authLimiter, validateLogin, login);

// Authenticated student dashboard
router.get('/dashboard', authenticate, getStudentDashboard);

module.exports = router;
