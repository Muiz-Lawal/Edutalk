import mongoose from 'mongoose';

const liveStreamSchema = new mongoose.Schema({
  // References
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

  // Stream Metadata
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  thumbnailUrl: String,

  // Status & Timing
  status: {
    type: String,
    enum: ['scheduled', 'preview', 'live', 'ended', 'archived'],
    default: 'scheduled',
  },
  startedAt: Date,
  endedAt: Date,
  scheduledStartTime: Date,    // For scheduled streams
  duration: Number,             // Expected duration in minutes

  // Streaming Configuration
  streamKey: {
    type: String,
    unique: true,
    sparse: true,
  },
  playbackUrl: String,          // HLS manifest URL
  cloudflareStreamId: String,   // Cloudflare Stream UID
  recordingId: String,          // Link to Recording model

  // Quality Settings
  quality: {
    bitrates: [
      {
        level: String,          // '1080p', '720p', '480p'
        bitrate: Number,        // kbps
        resolution: String,     // '1920x1080', etc
      },
    ],
    targetFps: {
      type: Number,
      default: 30,
    },
    enableAdaptive: {
      type: Boolean,
      default: true,
    },
  },

  // Viewer Tracking
  peakViewers: {
    type: Number,
    default: 0,
  },
  totalViewers: {
    type: Number,
    default: 0,
  },
  currentViewers: {
    type: Number,
    default: 0,
  },
  viewerHistory: [
    {
      timestamp: Date,
      count: Number,
    },
  ],
  avgWatchTime: Number,         // minutes

  // Chat Settings
  chatEnabled: {
    type: Boolean,
    default: true,
  },
  chatModerated: {
    type: Boolean,
    default: true,
  },
  totalMessages: {
    type: Number,
    default: 0,
  },
  blockedMessages: {
    type: Number,
    default: 0,
  },

  // Stream Health Metrics
  stats: {
    encodingLatency: Number,     // ms
    bitrate: Number,             // kbps (current)
    framerate: Number,
    droppedFrames: Number,
    health: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'excellent',
    },
    lastUpdated: Date,
  },

  // Notifications
  notificationsEnabled: {
    type: Boolean,
    default: true,
  },
  notificationsSent: {
    type: Boolean,
    default: false,
  },

  // Visibility
  isPublic: {
    type: Boolean,
    default: true,
  },
  isRecorded: {
    type: Boolean,
    default: true,
  },

  // Metadata
  tags: [String],
  category: String,

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
liveStreamSchema.index({ classId: 1, startedAt: -1 });
liveStreamSchema.index({ hostId: 1, status: 1 });
liveStreamSchema.index({ status: 1, startedAt: -1 });
liveStreamSchema.index({ streamKey: 1 });
liveStreamSchema.index({ createdAt: -1 });

export default mongoose.model('LiveStream', liveStreamSchema);
