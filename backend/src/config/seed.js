const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

const seedInitialData = async () => {
  const userCount = await User.countDocuments();
  if (userCount > 0) return; // Already seeded

  console.log('[Seed] Seeding initial demo data for instant preview...');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Create Teacher/Admin user
  const teacher = await User.create({
    name: 'মোঃ রফিকুল ইসলাম (শিক্ষক)',
    identifier: 'teacher@school.edu',
    passwordHash,
    role: 'admin',
    alias: 'Student-1001'
  });

  // 2. Create sample student users
  const student1 = await User.create({
    name: 'তানভীর আহমেদ',
    identifier: '01711223344',
    passwordHash,
    role: 'student',
    alias: 'Student-4821'
  });

  const student2 = await User.create({
    name: 'সাদিয়া জাহান',
    identifier: '01899887766',
    passwordHash,
    role: 'student',
    alias: 'Student-7392'
  });

  // 3. Create Sample Questions
  const q1 = await Question.create({
    authorId: student1._id,
    alias: student1.alias,
    subject: 'পদার্থবিজ্ঞান (Physics)',
    chapter: 'ভেক্টর',
    text: 'নদী ও নৌকার ক্ষেত্রে সর্বনিম্ন সময়ে নদী পার হওয়ার শর্ত কী এবং কোণ কত হবে?',
    answerCount: 2,
    likeCount: 5,
    isVerifiedByTeacher: true
  });

  const q2 = await Question.create({
    authorId: student2._id,
    alias: student2.alias,
    subject: 'উচ্চতর গণিত (Math)',
    chapter: 'দ্বিপদী বিস্তৃতি',
    text: 'দ্বিপদী বিস্তৃতির r-তম পদ নির্ণয়ের সূত্র এবং সাধারণ পদ বের করার সহজ নিয়ম কী?',
    answerCount: 1,
    likeCount: 3,
    isVerifiedByTeacher: false
  });

  const q3 = await Question.create({
    authorId: student1._id,
    alias: student1.alias,
    subject: 'রসায়ন (Chemistry)',
    chapter: 'পর্যায় সারণী',
    text: 'পর্যায় সারণীর ৩য় পর্যায়ের মৌলগুলোর অক্সাইডের প্রকৃতি বাম থেকে ডানে কীভাবে পরিবর্তিত হয়?',
    answerCount: 0,
    likeCount: 1,
    isVerifiedByTeacher: false
  });

  // 4. Create Sample Answers
  await Answer.create({
    questionId: q1._id,
    authorId: teacher._id,
    alias: teacher.alias,
    text: 'সর্বনিম্ন সময়ে নদী পার হতে হলে নৌকাকে ঠিক ৯০° কোণে বা নদীর প্রস্থ বরাবর সোজা চালাতে হবে। এক্ষেত্রে বেগ v এবং নদীর প্রস্থ d হলে সময় t = d / v হবে।',
    likeCount: 4
  });

  await Answer.create({
    questionId: q1._id,
    authorId: student2._id,
    alias: student2.alias,
    text: 'জি, আর যদি সর্বনিম্ন দূরত্বের কথা বলা হয় তবে কোণ হতে হবে ৯০ ডিগ্রির চেয়ে বেশি (স্থূলকোণ)।',
    likeCount: 2
  });

  await Answer.create({
    questionId: q2._id,
    authorId: teacher._id,
    alias: teacher.alias,
    text: 'দ্বিপদী উপপাদ্য (a+x)^n এর (r+1) তম পদ T_(r+1) = nCr * a^(n-r) * x^r। এখানে r এর মান সর্বদা পদ সংখ্যার চেয়ে ১ কম হবে।',
    likeCount: 2
  });

  console.log('[Seed] Demo data seeded successfully!');
  console.log('   Admin Login: teacher@school.edu / password123');
  console.log('   Student Login: 01711223344 / password123');
};

module.exports = seedInitialData;
