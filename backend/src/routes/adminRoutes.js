const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// All routes in this router strictly require authentication and admin role
router.use(authenticate, requireAdmin);

// Dashboard Statistics
router.get('/stats', getSystemStats);

// Questions and Answers Inspection (with Real Identity)
router.get('/questions', getQuestionsWithRealIdentity);
router.get('/questions/:id/answers', getAnswersWithRealIdentity);
router.patch('/questions/:id/verify', toggleTeacherVerify);
router.delete('/questions/:id', deleteQuestion);
router.delete('/answers/:id', deleteAnswer);

// Moderation Reports
router.get('/reports', getReports);
router.patch('/reports/:id', updateReportStatus);

// Student Management
router.get('/users', getUsers);
router.patch('/users/:id/ban', toggleBanUser);

module.exports = router;
