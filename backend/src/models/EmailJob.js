import mongoose from 'mongoose';

const emailJobSchema = new mongoose.Schema({
  // Recipient
  to: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true,
  },
  cc: [{ type: String, lowercase: true, trim: true }],
  bcc: [{ type: String, lowercase: true, trim: true }],

  // Content
  subject: { 
    type: String, 
    required: true,
  },
  htmlBody: String,
  textBody: String,

  // Template reference
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate',
  },
  templateVariables: mongoose.Schema.Types.Mixed,

  // Recipient context
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },

  // Job status
  status: { 
    type: String, 
    enum: ['pending', 'queued', 'sending', 'sent', 'failed', 'bounced', 'unsubscribed'],
    default: 'pending',
    index: true,
  },

  // Retry logic
  attempts: { 
    type: Number, 
    default: 0,
    max: 5,
  },
  maxAttempts: {
    type: Number,
    default: 5,
  },
  lastError: String,
  nextRetryAt: Date,

  // Delivery tracking
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date,

  // Provider tracking
  providerId: String, // SendGrid message ID, etc.
  providerResponse: mongoose.Schema.Types.Mixed,

  // Scheduling
  scheduledFor: Date,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal',
    index: true,
  },

  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  tags: [String],

  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true,
  },
  updatedAt: Date,
}, { timestamps: true });

// Index for efficient querying
emailJobSchema.index({ status: 1, priority: 1, createdAt: -1 });
emailJobSchema.index({ userId: 1, status: 1 });
emailJobSchema.index({ classId: 1, status: 1 });
emailJobSchema.index({ scheduledFor: 1, status: 1 });
emailJobSchema.index({ nextRetryAt: 1, status: 1 });

// Static methods for job management
emailJobSchema.statics.getReadyForSend = async function () {
  return await this.find({
    $or: [
      { status: 'pending', scheduledFor: { $lte: new Date() } },
      { status: 'failed', nextRetryAt: { $lte: new Date() }, attempts: { $lt: this.schema.path('maxAttempts').options.default } },
    ],
  })
    .sort({ priority: -1, createdAt: 1 })
    .limit(100);
};

emailJobSchema.statics.retryFailed = async function () {
  return await this.updateMany(
    {
      status: 'failed',
      attempts: { $lt: 5 },
    },
    {
      $set: { status: 'pending', nextRetryAt: new Date(Date.now() + 60000) }, // Retry in 1 minute
    }
  );
};

export default mongoose.model('EmailJob', emailJobSchema);

