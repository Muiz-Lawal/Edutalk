import mongoose from 'mongoose';

const StreamMetricsSchema = new mongoose.Schema(
  {
    liveStreamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveStream',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },

    // Viewer Metrics
    viewerCount: {
      type: Number,
      default: 0,
    },
    peakViewerCount: {
      type: Number,
      default: 0,
    },
    totalUniqueViewers: {
      type: Number,
      default: 0,
    },
    averageWatchTime: {
      type: Number,
      default: 0,
    },

    // Quality Metrics
    qualityDistribution: {
      '1080p': {
        type: Number,
        default: 0,
      },
      '720p': {
        type: Number,
        default: 0,
      },
      '480p': {
        type: Number,
        default: 0,
      },
      auto: {
        type: Number,
        default: 0,
      },
    },
    averageBitrate: {
      type: Number,
      default: 0,
    },

    // Engagement Metrics
    chatMessages: {
      type: Number,
      default: 0,
    },
    chatEngagement: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    averageEngagementScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // System Health
    dropRate: {
      type: Number,
      default: 0,
    },
    averageLatency: {
      type: Number,
      default: 0,
    },
    bufferingEvents: {
      type: Number,
      default: 0,
    },

    // Retention Data
    viewersAt: {
      '5min': { type: Number, default: 0 },
      '10min': { type: Number, default: 0 },
      '15min': { type: Number, default: 0 },
      '30min': { type: Number, default: 0 },
      '60min': { type: Number, default: 0 },
    },

    // Demographics
    browsers: {
      Chrome: { type: Number, default: 0 },
      Firefox: { type: Number, default: 0 },
      Safari: { type: Number, default: 0 },
      Edge: { type: Number, default: 0 },
      Other: { type: Number, default: 0 },
    },
    operatingSystems: {
      Windows: { type: Number, default: 0 },
      MacOS: { type: Number, default: 0 },
      Linux: { type: Number, default: 0 },
      iOS: { type: Number, default: 0 },
      Android: { type: Number, default: 0 },
    },
    deviceTypes: {
      Desktop: { type: Number, default: 0 },
      Tablet: { type: Number, default: 0 },
      Mobile: { type: Number, default: 0 },
    },

    createdAt: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
    updatedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

// Index for efficient queries
StreamMetricsSchema.index({ liveStreamId: 1, timestamp: -1 });
StreamMetricsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // Auto-delete after 1 year

export default mongoose.model('StreamMetrics', StreamMetricsSchema);
