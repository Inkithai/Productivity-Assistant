const mongoose = require('mongoose');

const EVENT_TYPES = ['meeting', 'deadline', 'personal', 'other'];

const eventSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: EVENT_TYPES,
      default: 'personal',
    },
    start: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    end: {
      type: Date,
      default: null,
      validate: {
        validator: function isValidEnd(value) {
          return !value || value >= this.start;
        },
        message: 'End must be after start',
      },
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
  },
  { timestamps: true }
);

eventSchema.index({ userId: 1, start: 1 });
eventSchema.statics.TYPES = EVENT_TYPES;

module.exports = mongoose.model('Event', eventSchema);
