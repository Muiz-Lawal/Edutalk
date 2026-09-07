import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: String,
    enum: ['Technology', 'Music', 'Business', 'Design', 'Languages', 'Fitness', 'Science', 'Arts', 'Cooking', 'Photography'],
  },
  tags: [String],
  
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Pricing
  monthlyPrice: {
    type: Number,
    required: true,
  },
  lastPriceChangeAt: Date,
  priceChangeAudit: [{
    changedAt: Date,
    previousPrice: Number,
    newPrice: Number,
    changedBy: mongoose.Schema.Types.ObjectId,
  }],
  minPurchaseDays: {
    type: Number,
    default: 1,
    enum: [1, 2, 3, 5, 7],
  },
  
  // Class structure
  durationType: {
    type: String,
    enum: ['fixed', 'ongoing'],
    default: 'ongoing',
  },
  startDate: Date,
  endDate: Date,
  totalDays: Number,
  timezone: {
    type: String,
    default: 'UTC',
  },
  
  // Schedule
  schedule: [{
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6, // 0 = Sunday, 6 = Saturday
    },
    startTime: String, // HH:mm format
    duration: Number, // legacy duration in minutes
    durationMinutes: Number,
    timezone: String,
  }],
  
  // Video mode
  videoMode: {
    type: String,
    enum: ['builtin', 'external'],
    default: 'external',
  },
  externalVideoLink: String,
  
  // Content
  thumbnailImage: String,
  introVideoUrl: String,
  introVideoTranscript: String,
  appearance: {
    thumbnailImage: String,
    bannerImage: String,
    bannerLqip: String,
    gallery: [{
      url: String,
      caption: { type: String, maxlength: 80 },
    }],
    accentColor: String,
    hostLogo: String,
    slug: String,
  },
  
  // Capacity and visibility
  maxStudents: Number,
  isPublic: {
    type: Boolean,
    default: true,
  },
  vacationMode: {
    active: { type: Boolean, default: false },
    startDate: Date,
    endDate: Date,
  },
  vacationHistory: [{
    startedAt: Date,
    endedAt: Date,
    pausedDays: Number,
  }],
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'active', 'paused', 'cancelled', 'completed', 'archived'],
    default: 'active',
  },
  
  // Analytics
  totalEnrolled: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  
  // Recording settings
  autoRecord: {
    type: Boolean,
    default: false,
  },
  recordingAvailability: {
    type: String,
    enum: ['immediate', 'after24hours'],
    default: 'immediate',
  },
  recordingAutoDelete: {
    type: String,
    enum: ['30days', '90days', 'never'],
    default: 'never',
  },
  watermarkEnabled: {
    type: Boolean,
    default: true,
  },
  recordingSettings: {
    mode: { type: String, enum: ['auto', 'manual'], default: 'auto' },
    releasePolicy: { type: String, enum: ['immediate', '24h'], default: 'immediate' },
    retentionDays: { type: Number, enum: [30, 90, null], default: 30 },
    watermarkOverlayEnabled: { type: Boolean, default: true },
  },
  
  // Dates
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Class', classSchema);
