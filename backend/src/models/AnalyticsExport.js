import mongoose from 'mongoose';

const analyticsExportSchema = new mongoose.Schema(
  {
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveStream',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    exportType: {
      type: String,
      enum: ['csv', 'pdf', 'email'],
      required: true,
    },
    format: {
      type: String,
      enum: ['detailed', 'summary'],
      default: 'detailed',
    },
    includedMetrics: [String],
    downloadUrl: String,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    fileSize: Number,
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Composite index for efficient queries
analyticsExportSchema.index({ streamId: 1, createdAt: -1 });
analyticsExportSchema.index({ userId: 1, createdAt: -1 });

// TTL index to auto-delete expired exports after 30 days
analyticsExportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('AnalyticsExport', analyticsExportSchema);
