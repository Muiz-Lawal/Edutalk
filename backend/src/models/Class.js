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
  
  // Schedule
  schedule: [{
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6, // 0 = Sunday, 6 = Saturday
    },
    startTime: String, // HH:mm format
    duration: Number, // in minutes
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
  
  // Capacity and visibility
  maxStudents: Number,
  isPublic: {
    type: Boolean,
    default: true,
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'completed'],
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
