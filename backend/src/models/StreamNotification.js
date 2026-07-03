const mongoose = require('mongoose');

const StreamNotificationSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StreamSchedule',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Notification Details
    type: {
      type: String,
      enum: ['email', 'in-app'],
      required: true,
    },
    reminderType: {
      type: String,
      enum: ['24h', '1h', '30m'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    sentAt: Date,
    error: String,

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
StreamNotificationSchema.index({ scheduleId: 1 });
StreamNotificationSchema.index({ userId: 1 });
StreamNotificationSchema.index({ status: 1 });
StreamNotificationSchema.index({ sentAt: 1 });
StreamNotificationSchema.index({ type: 1 });

module.exports = mongoose.model('StreamNotification', StreamNotificationSchema);
