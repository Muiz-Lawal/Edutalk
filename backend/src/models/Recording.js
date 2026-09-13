import mongoose from 'mongoose';

const recordingSchema = new mongoose.Schema({
  // Core references
  liveStreamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveStream',
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Tier captured when the recording is created.  Playback must not change
  // when a host later changes plans.
  hostPlanTier: {
    type: String,
    enum: ['starter', 'growth', 'pro', 'elite'],
    default: 'starter',
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  
  // Legacy references (kept for backward compatibility)
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
  },
  videoRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoRoom',
  },
  
  // Recording details
  title: {
    type: String,
    required: true,
  },
  description: String,
  thumbnail: String, // Thumbnail URL
  
  // Storage
  // These provider/storage identifiers are server-only. Never serialize them to clients.
  streamUid: String,
  storageUrl: String,
  videoUrl: String,
  hlsUrl: String,
  dashUrl: String,
  duration: Number,
  durationSeconds: Number,
  fileSize: Number,
  fileSizeBytes: Number,
  
  // Video quality
  resolution: String, // e.g., "1920x1080"
  bitrate: Number,    // kbps
  
  // Processing
  status: {
    type: String,
    enum: ['recording', 'processing', 'review_hold', 'ready', 'failed', 'expired'],
    default: 'recording',
  },
  processingProgress: {
    type: Number,
    default: 0, // 0-100
  },
  
  // AI Processing
  transcript: String,
  summary: String,
  keyTakeaways: [String],
  chapters: [{
    timestamp: Number,
    title: String,
    summary: String,
  }],
  detectedLanguages: [String],
  transcriptSegments: [{ start: Number, end: Number, text: String }],
  aiSummary: String,
  aiTimestamps: [{ t: Number, label: String }],
  aiKeyTakeaways: [String],
  aiModel: String,
  aiPromptVersion: String,
  
  // Access control
  accessLevel: {
    type: String,
    enum: ['public', 'subscribed', 'private'],
    default: 'subscribed',
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  allowDownload: {
    type: Boolean,
    default: false,
    immutable: true,
  },
  
  // Watermark
  watermarkText: String,
  watermarkOverlayEnabled: {
    type: Boolean,
    default: true,
  },
  isVisible: {
    type: Boolean,
    default: false,
  },
  releaseAt: Date,
  reviewHoldUntil: Date,
  reviewHoldReason: String,
  autoDeleteEnabled: { type: Boolean, default: false },
  autoDeleteDays: { type: Number, enum: [30, 90, null], default: null },
  processedEventIds: { type: [String], default: [] },
  processingError: String,
  retryCount: { type: Number, default: 0 },
  
  // Engagement metrics
  viewCount: {
    type: Number,
    default: 0,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  
  // Availability settings
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  autoDeleteAt: Date,
  isArchived: Boolean,
  isDeleted: {
    type: Boolean,
    default: false,
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

// Indexes for better query performance
recordingSchema.index({ liveStreamId: 1 });
recordingSchema.index({ hostId: 1 });
recordingSchema.index({ classId: 1 });
recordingSchema.index({ uploadedAt: -1 });
recordingSchema.index({ isPublic: 1, isDeleted: 1 });

export default mongoose.model('Recording', recordingSchema);
