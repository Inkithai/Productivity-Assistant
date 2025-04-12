const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 80,
    },
    targetPerWeek: {
      type: Number,
      min: 1,
      max: 7,
      default: 5,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

habitSchema.index({ userId: 1, name: 1 }, { unique: true });

const habitLogSchema = new mongoose.Schema(
  {
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    day: {
      type: String, // YYYY-MM-DD, one log per habit per day
      required: true,
    },
  },
  { timestamps: true }
);

habitLogSchema.index({ habitId: 1, day: 1 }, { unique: true });

module.exports = { Habit: mongoose.model('Habit', habitSchema), HabitLog: mongoose.model('HabitLog', habitLogSchema) };
