const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      required: true,
    },
    minutes: {
      type: Number,
      required: true,
      min: 1,
      max: 240,
    },
    completed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

focusSessionSchema.index({ userId: 1, startedAt: -1 });

module.exports = mongoose.model('FocusSession', focusSessionSchema);
