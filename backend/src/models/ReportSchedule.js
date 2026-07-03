import mongoose from 'mongoose';

const reportScheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveStream',
      required: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      // 0 = Sunday, 6 = Saturday (required for weekly)
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      // required for monthly
    },
    hour: {
      type: Number,
      min: 0,
      max: 23,
      required: true,
    },
    minute: {
      type: Number,
      min: 0,
      max: 59,
      default: 0,
    },
    timezone: {
      type: String,
      default: 'America/New_York',
    },
    recipients: [
      {
        type: String,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
      },
    ],
    subject: {
      type: String,
      default: 'Analytics Report',
    },
    includeAttachment: {
      type: Boolean,
      default: true,
    },
    includeMetrics: [String],
    reportType: {
      type: String,
      enum: ['summary', 'detailed'],
      default: 'summary',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSentAt: Date,
    nextSendAt: {
      type: Date,
      index: true,
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

// Composite indexes for efficient queries
reportScheduleSchema.index({ userId: 1, isActive: 1 });
reportScheduleSchema.index({ hostId: 1, frequency: 1 });
reportScheduleSchema.index({ nextSendAt: 1, isActive: 1 });

export default mongoose.model('ReportSchedule', reportScheduleSchema);
