const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ['question', 'answer'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Ensures a user can only vote/like a given question or answer ONCE
voteSchema.index({ userId: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
