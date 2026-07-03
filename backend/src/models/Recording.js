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
  videoUrl: String,   // HLS manifest URL
  storageUrl: String, // Cloud storage URL
  hlsUrl: String,     // HLS stream URL
  dashUrl: String,    // DASH stream URL
  duration: Number,   // in seconds
  fileSize: Number,   // in bytes
  
  // Video quality
  resolution: String, // e.g., "1920x1080"
  bitrate: Number,    // kbps
  
  // Processing
  status: {
    type: String,
    enum: ['recording', 'processing', 'ready', 'failed'],
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
  },
  
  // Watermark
  watermarkText: String,
  
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
