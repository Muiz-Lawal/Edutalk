import mongoose from 'mongoose';

const moderationLogSchema = new mongoose.Schema({
  contentId: {
    type: String,
    required: true,
    unique: true, // Prevent duplicate moderation logs
  },
  contentType: {
    type: String,
    enum: ['chat_message', 'review', 'profile', 'class_description', 'announcement'],
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Content details
  content: {
    type: String,
    required: true,
  },
  originalContent: String, // For edited content

  // Moderation results
  flagged: {
    type: Boolean,
    default: false,
  },
  categories: {
    hate: Boolean,
    harassment: Boolean,
    self_harm: Boolean,
    sexual: Boolean,
    violence: Boolean,
    illegal: Boolean,
    spam: Boolean,
    inappropriate: Boolean,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0,
  },
  moderationMethod: {
    type: String,
    enum: ['openai', 'custom', 'fallback'],
    default: 'openai',
  },

  // Action taken
  action: {
    type: String,
    enum: ['approved', 'flagged', 'blocked', 'warned', 'escalated'],
    default: 'approved',
  },
  actionReason: String,

  // Review process
  status: {
    type: String,
    enum: ['auto_approved', 'auto_blocked', 'pending_review', 'reviewed_approved', 'reviewed_rejected'],
    default: 'auto_approved',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: Date,
  reviewNotes: String,

  // Context information
  context: {
    sessionId: String,
    classId: mongoose.Schema.Types.ObjectId,
    roomId: String,
    rating: Number,
    timestamp: Date,
  },

  // User appeals
  appeal: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    reason: String,
    submittedAt: Date,
    reviewedBy: mongoose.Schema.Types.ObjectId,
    reviewedAt: Date,
    appealNotes: String,
  },

  // Severity level for filtering
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },

  // Metadata
  ipAddress: String,
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Indexes for efficient queries
moderationLogSchema.index({ userId: 1, createdAt: -1 });
moderationLogSchema.index({ contentType: 1, status: 1, createdAt: -1 });
moderationLogSchema.index({ flagged: 1, status: 1 });
moderationLogSchema.index({ createdAt: -1 });

export default mongoose.model('ModerationLog', moderationLogSchema);