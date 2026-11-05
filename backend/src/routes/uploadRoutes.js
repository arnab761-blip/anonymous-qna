const express = require('express');
const router = express.Router();
const { getUploadSignature } = require('../controllers/uploadController');
const { authenticate } = require('../middlewares/auth');
const { uploadLimiter } = require('../middlewares/rateLimiter');

// Get direct-upload signature for Cloudinary (max 5 per min per student)
router.get('/signature', authenticate, uploadLimiter, getUploadSignature);

module.exports = router;
