const mongoose = require('mongoose');

const REMINDER_STATUSES = ['scheduled', 'sent', 'cancelled'];

const reminderSchema = new mongoose.Schema(
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
      maxlength: 200,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    remindAt: {
      type: Date,
      required: [true, 'Reminder time is required'],
    },
    status: {
      type: String,
      enum: REMINDER_STATUSES,
      default: 'scheduled',
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

reminderSchema.index({ status: 1, remindAt: 1 });
reminderSchema.statics.STATUSES = REMINDER_STATUSES;

module.exports = mongoose.model('Reminder', reminderSchema);
