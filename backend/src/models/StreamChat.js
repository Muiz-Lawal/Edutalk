import mongoose from 'mongoose';

const streamChatSchema = new mongoose.Schema({
  // References
  liveStreamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveStream',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,              // null for anonymous
  },
  viewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StreamViewer',
  },

  // Message Content
  message: {
    type: String,
    required: true,
    maxlength: 500,
  },
  messageType: {
    type: String,
    enum: ['text', 'emoji', 'system'],
    default: 'text',
  },

  // Metadata
  senderName: String,
  senderAvatar: String,
  senderEmail: String,

  // Moderation Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'blocked', 'deleted'],
    default: 'pending',
  },
  moderationResult: {
    approved: Boolean,
    action: String,             // 'approved', 'blocked', 'flagged'
    categories: [String],       // moderation categories
    confidence: Number,         // 0-100
    reason: String,
  },

  // Moderation Actions
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  deletedAt: Date,
  deletionReason: String,

  // Pinning (Moderator Actions)
  isPinned: {
    type: Boolean,
    default: false,
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  pinnedAt: Date,

  // Reactions
  reactions: [
    {
      emoji: String,
      count: Number,
      users: [mongoose.Schema.Types.ObjectId],
    },
  ],

  // Reply Threading
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StreamChat',
  },
  replies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StreamChat',
    },
  ],

  // User Engagement
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Indexes for performance
streamChatSchema.index({ liveStreamId: 1, timestamp: -1 });
streamChatSchema.index({ liveStreamId: 1, status: 1 });
streamChatSchema.index({ userId: 1, liveStreamId: 1 });
streamChatSchema.index({ timestamp: -1 });

export default mongoose.model('StreamChat', streamChatSchema);
