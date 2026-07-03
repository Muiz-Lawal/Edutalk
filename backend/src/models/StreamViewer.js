import mongoose from 'mongoose';

const streamViewerSchema = new mongoose.Schema({
  // References
  liveStreamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveStream',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,              // null for anonymous viewers
  },

  // Session Tracking
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },

  // Timing
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leftAt: Date,
  totalWatchTime: Number,       // minutes

  // Quality Preference
  qualitySelected: {
    type: String,
    enum: ['1080p', '720p', '480p', 'auto'],
    default: 'auto',
  },
  qualityAdaptationCount: {
    type: Number,
    default: 0,
  },

  // Engagement Metrics
  chatMessages: {
    type: Number,
    default: 0,
  },
  engagementScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  messagesSent: [
    {
      timestamp: Date,
      length: Number,
    },
  ],

  // Device Information
  deviceInfo: {
    browser: String,
    os: String,
    osVersion: String,
    screenWidth: Number,
    screenHeight: Number,
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
    },
  },

  // Network Quality
  networkQuality: {
    averageLatency: Number,     // ms
    bufferingCount: Number,
    bufferingDuration: Number,  // seconds
    packetsLost: Number,
    jitter: Number,             // ms
  },

  // Viewing Pattern
  joinReason: String,           // 'notification', 'link', 'discovery'
  interactionLevel: {
    type: String,
    enum: ['passive', 'active', 'very-active'],
    default: 'passive',
  },

  // Location (if provided)
  location: {
    country: String,
    region: String,
    city: String,
  },

  // Analytics
  playbackStartTime: Date,
  pauseCount: Number,
  seekCount: Number,
  lastActiveTime: Date,

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
streamViewerSchema.index({ liveStreamId: 1, joinedAt: -1 });
streamViewerSchema.index({ userId: 1, liveStreamId: 1 });
streamViewerSchema.index({ sessionId: 1 });
streamViewerSchema.index({ liveStreamId: 1, engagementScore: -1 });

export default mongoose.model('StreamViewer', streamViewerSchema);
