const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Real name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    identifier: {
      type: String,
      required: [true, 'Email or phone number is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student'
    },
    alias: {
      type: String,
      required: true,
      unique: true,
      index: true // Ensures Student-XXXX is unique across all users
    },
    isBanned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
