const mongoose = require('mongoose');

const StreamScheduleSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Schedule Timing
    scheduledStartTime: {
      type: Date,
      required: true,
    },
    scheduledEndTime: {
      type: Date,
      required: true,
    },

    // Recurrence
    recurrence: {
      type: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'monthly'],
        default: 'once',
      },
      endDate: Date,
      daysOfWeek: [Number],
      monthDay: Number,
    },
    recurrenceRule: String,

    // Status
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    actualStartTime: Date,
    actualEndTime: Date,

    // Notifications
    reminderTimes: {
      type: [Number],
      default: [-15, -60, -1440],
    },
    notificationsSent: [Date],

    // Description
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    thumbnail: String,

    // Attendance
    expectedAttendees: Number,
    actualAttendees: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
StreamScheduleSchema.index({ classId: 1 });
StreamScheduleSchema.index({ hostId: 1 });
StreamScheduleSchema.index({ scheduledStartTime: 1 });
StreamScheduleSchema.index({ status: 1 });
StreamScheduleSchema.index({ 'recurrence.type': 1 });

module.exports = mongoose.model('StreamSchedule', StreamScheduleSchema);
