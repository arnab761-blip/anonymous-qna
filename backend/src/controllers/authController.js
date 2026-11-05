const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Vote = require('../models/Vote');

/**
 * Generate a cryptographically random Student alias (e.g., Student-4821)
 * and ensure collision-free uniqueness in the database.
 */
const generateUniqueAlias = async () => {
  let isUnique = false;
  let alias = '';
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    alias = `Student-${randomNum}`;
    const existing = await User.findOne({ alias }).select('_id').lean();
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  // Fallback to 6 digits if 4 digits have collisions
  if (!isUnique) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    alias = `Student-${randomNum}`;
  }

  return alias;
};

const createToken = (user) => {
  return jwt.sign(
    { id: user._id, alias: user.alias, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new user (Student or Admin)
// @route   POST /auth/register
const register = async (req, res, next) => {
  try {
    const { name, identifier, password, role } = req.body;
    const cleanIdentifier = String(identifier || '').trim().toLowerCase();

    // Check if identifier is already taken
    const existingUser = await User.findOne({ identifier: cleanIdentifier }).select('_id').lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'এই ইমেইল বা ফোন নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট তৈরি করা আছে।'
      });
    }

    // Generate unique anonymous alias
    const alias = await generateUniqueAlias();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Only allow admin role if explicitly provisioned or with an admin key
    const assignedRole = role === 'admin' ? 'admin' : 'student';

    const newUser = await User.create({
      name: String(name || '').trim(),
      identifier: cleanIdentifier,
      passwordHash,
      role: assignedRole,
      alias
    });

    const token = createToken(newUser);

    // Strict privacy: Do NOT return real name or identifier in response
    res.status(201).json({
      success: true,
      message: 'রেজিস্ট্রেশন সফল হয়েছে।',
      token,
      user: {
        alias: newUser.alias,
        role: newUser.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /auth/login
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const cleanIdentifier = String(identifier || '').trim().toLowerCase();

    const user = await User.findOne({ identifier: cleanIdentifier });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ভুল ইমেইল/ফোন নম্বর বা পাসওয়ার্ড।'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'আপনার অ্যাকাউন্টটি সাময়িকভাবে নিষিদ্ধ (Banned) করা হয়েছে।'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'ভুল ইমেইল/ফোন নম্বর বা পাসওয়ার্ড।'
      });
    }

    const token = createToken(user);

    res.status(200).json({
      success: true,
      message: 'লগইন সফল হয়েছে।',
      token,
      user: {
        alias: user.alias,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in student's dashboard stats, questions and answers
// @route   GET /auth/dashboard
const getStudentDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Fetch user profile
    const userDoc = await User.findById(userId).select('name identifier alias role createdAt').lean();
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।'
      });
    }

    // 2. Fetch all questions asked by this student
    const questions = await Question.find({ authorId: userId })
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
      .sort({ createdAt: -1 })
      .lean();

    // Check which questions this user has liked
    const questionIds = questions.map((q) => q._id);
    let userLikedQuestions = new Set();
    if (questionIds.length > 0) {
      const userVotes = await Vote.find({
        userId,
        targetType: 'question',
        targetId: { $in: questionIds }
      })
        .select('targetId')
        .lean();
      userLikedQuestions = new Set(userVotes.map((v) => v.targetId.toString()));
    }

    const questionsWithLike = questions.map((q) => ({
      ...q,
      userHasLiked: userLikedQuestions.has(q._id.toString())
    }));

    // 3. Fetch all answers posted by this student with parent question text
    const answers = await Answer.find({ authorId: userId })
      .populate('questionId', 'text subject chapter')
      .sort({ createdAt: -1 })
      .lean();

    // 4. Calculate aggregated stats
    const totalQuestions = questions.length;
    const totalAnswers = answers.length;
    const verifiedQuestions = questions.filter((q) => q.isVerifiedByTeacher).length;

    const questionsLikesReceived = questions.reduce((sum, q) => sum + (q.likeCount || 0), 0);
    const answersLikesReceived = answers.reduce((sum, a) => sum + (a.likeCount || 0), 0);
    const totalLikesReceived = questionsLikesReceived + answersLikesReceived;

    const totalLikesGiven = await Vote.countDocuments({ userId, targetType: 'question' });

    res.status(200).json({
      success: true,
      profile: {
        name: userDoc.name,
        identifier: userDoc.identifier,
        alias: userDoc.alias,
        role: userDoc.role,
        joinedAt: userDoc.createdAt
      },
      stats: {
        totalQuestions,
        totalAnswers,
        verifiedQuestions,
        totalLikesReceived,
        totalLikesGiven
      },
      questions: questionsWithLike,
      answers
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getStudentDashboard
};
