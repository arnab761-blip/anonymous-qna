require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const identifier = process.argv[2];

if (!identifier) {
  console.log('ব্যবহারবিধি: node scripts/makeAdmin.js <email_or_phone>');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ identifier: identifier.trim().toLowerCase() });

    if (!user) {
      console.log(`[Error] '${identifier}' দিয়ে কোনো ইউজার খুঁজে পাওয়া যায়নি।`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`\n🎉 অভিনন্দন! ${user.name} (${user.alias})-কে সফলভাবে 'admin' (শিক্ষক) রোল দেওয়া হয়েছে।`);
    console.log(`এখন লগইন করলে টপ নেভবারে "প্যানেল" বাটনটি দেখতে পাবেন।\n`);
    process.exit(0);
  } catch (err) {
    console.error('ত্রুটি:', err.message);
    process.exit(1);
  }
};

run();
