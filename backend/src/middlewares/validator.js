const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Email or Bangladeshi / generic phone regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;

const validateRegister = (req, res, next) => {
  const { name, identifier, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: 'সঠিক পূর্ণ নাম দিন (২ থেকে ১০০ অক্ষরের মধ্যে)।'
    });
  }

  if (!identifier || typeof identifier !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'বৈধ ইমেইল অথবা ফোন নম্বর দিন।'
    });
  }

  const cleanIdentifier = identifier.trim();
  const isEmail = emailRegex.test(cleanIdentifier);
  const isPhone = phoneRegex.test(cleanIdentifier);

  if (!isEmail && !isPhone) {
    return res.status(400).json({
      success: false,
      message: 'একটি সঠিক ইমেইল অথবা ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন।'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'পাসওয়ার্ড ন্যূনতম ৬ এবং সর্বোচ্চ ১০০ অক্ষরের হতে হবে।'
    });
  }

  req.body.name = name.trim();
  req.body.identifier = cleanIdentifier.toLowerCase();
  next();
};

const validateLogin = (req, res, next) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'ইমেইল/ফোন নম্বর এবং পাসওয়ার্ড উভয়ই প্রদান করুন।'
    });
  }

  req.body.identifier = identifier.trim().toLowerCase();
  next();
};

const validateQuestion = (req, res, next) => {
  const { subject, chapter, text, imageUrl } = req.body;

  if (!subject || typeof subject !== 'string' || subject.trim().length < 2 || subject.trim().length > 50) {
    return res.status(400).json({
      success: false,
      message: 'সাবজেক্ট বা বিষয় ২ থেকে ৫০ অক্ষরের মধ্যে হতে হবে।'
    });
  }

  if (!chapter || typeof chapter !== 'string' || chapter.trim().length < 2 || chapter.trim().length > 50) {
    return res.status(400).json({
      success: false,
      message: 'অধ্যায় বা চ্যাপ্টার ২ থেকে ৫০ অক্ষরের মধ্যে হতে হবে।'
    });
  }

  if (!text || typeof text !== 'string' || text.trim().length < 10 || text.trim().length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'প্রশ্নের বিবরণ ন্যূনতম ১০ এবং সর্বোচ্চ ২০০০ অক্ষরের হতে হবে।'
    });
  }

  if (imageUrl && typeof imageUrl !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'ছবির লিংকটি সঠিক নয়।'
    });
  }

  req.body.subject = subject.trim();
  req.body.chapter = chapter.trim();
  req.body.text = text.trim();
  next();
};

const validateAnswer = (req, res, next) => {
  const { text, imageUrl } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length < 5 || text.trim().length > 3000) {
    return res.status(400).json({
      success: false,
      message: 'উত্তরের বিবরণ ন্যূনতম ৫ এবং সর্বোচ্চ ৩০০০ অক্ষরের হতে হবে।'
    });
  }

  if (imageUrl && typeof imageUrl !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'ছবির লিংকটি সঠিক নয়।'
    });
  }

  req.body.text = text.trim();
  next();
};

const validateLike = (req, res, next) => {
  const { targetType, targetId } = req.params;

  if (!['question', 'answer'].includes(targetType)) {
    return res.status(400).json({
      success: false,
      message: 'targetType শুধুমাত্র "question" অথবা "answer" হতে পারবে।'
    });
  }

  if (!isValidObjectId(targetId)) {
    return res.status(400).json({
      success: false,
      message: 'অবৈধ টার্গেট আইডি।'
    });
  }

  next();
};

const validateReport = (req, res, next) => {
  const { targetType, targetId, reason } = req.body;

  if (!['question', 'answer'].includes(targetType)) {
    return res.status(400).json({
      success: false,
      message: 'targetType শুধুমাত্র "question" অথবা "answer" হতে পারে।'
    });
  }

  if (!isValidObjectId(targetId)) {
    return res.status(400).json({
      success: false,
      message: 'অবৈধ টার্গেট আইডি।'
    });
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5 || reason.trim().length > 500) {
    return res.status(400).json({
      success: false,
      message: 'রিপোর্টের কারণ ন্যূনতম ৫ এবং সর্বোচ্চ ৫০০ অক্ষরের হতে হবে।'
    });
  }

  req.body.reason = reason.trim();
  next();
};

module.exports = {
  isValidObjectId,
  validateRegister,
  validateLogin,
  validateQuestion,
  validateAnswer,
  validateLike,
  validateReport
};
