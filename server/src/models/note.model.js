const mongoose = require('mongoose');

const NOTE_CATEGORIES = ['general', 'meeting', 'idea', 'study', 'project'];

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 160,
    },
    content: {
      type: String,
      default: '',
      maxlength: 20000,
    },
    category: {
      type: String,
      enum: NOTE_CATEGORIES,
      default: 'general',
    },
    tags: {
      type: [String],
      default: [],
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

noteSchema.index({ userId: 1, updatedAt: -1 });
noteSchema.statics.CATEGORIES = NOTE_CATEGORIES;

module.exports = mongoose.model('Note', noteSchema);
