const express = require('express');
const router = express.Router();
const { createReport } = require('../controllers/reportController');
const { authenticate } = require('../middlewares/auth');
const { validateReport } = require('../middlewares/validator');
const { profanityFilter } = require('../middlewares/profanityFilter');

// Submit report
router.post(
  '/',
  authenticate,
  validateReport,
  profanityFilter,
  createReport
);

module.exports = router;
