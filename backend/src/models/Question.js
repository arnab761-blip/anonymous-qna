const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    alias: {
      type: String,
      required: true
      // Snapshot stored to avoid joins on feed
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 50
    },
    chapter: {
      type: String,
      required: [true, 'Chapter is required'],
      trim: true,
      maxlength: 50
    },
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [10, 'Question text must be at least 10 characters'],
      maxlength: [2000, 'Question text cannot exceed 2000 characters']
    },
    imageUrl: {
      type: String,
      default: null
    },
    answerCount: {
      type: Number,
      default: 0
    },
    likeCount: {
      type: Number,
      default: 0
    },
    isVerifiedByTeacher: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound index for filtered cursor pagination:
// e.g. /questions?subject=Physics&chapter=Vector&cursor=...
questionSchema.index({ subject: 1, chapter: 1, _id: -1 });
questionSchema.index({ subject: 1, _id: -1 });

// Full-text index for duplicate search in Bengali and English
questionSchema.index(
  { subject: 'text', text: 'text' },
  { default_language: 'none', weights: { text: 10, subject: 5 } }
);

module.exports = mongoose.model('Question', questionSchema);
