const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    alias: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: [true, 'Answer text is required'],
      trim: true,
      minlength: [5, 'Answer must be at least 5 characters'],
      maxlength: [3000, 'Answer cannot exceed 3000 characters']
    },
    imageUrl: {
      type: String,
      default: null
    },
    likeCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fetching answers for a specific question with cursor pagination
answerSchema.index({ questionId: 1, _id: 1 });

module.exports = mongoose.model('Answer', answerSchema);
