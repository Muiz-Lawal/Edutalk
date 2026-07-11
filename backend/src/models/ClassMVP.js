import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  // Basic Info
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  category: {
    type: String,
    required: true,
    enum: ['Math', 'Science', 'Language', 'Technology', 'Arts', 'Business', 'Health', 'Other'],
  },
  
  // Pricing (monthly base price)
  monthlyPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  
  // Capacity
  minStudents: {
    type: Number,
    default: 1,
    min: 1,
  },
  maxStudents: {
    type: Number,
    default: 100,
    min: 1,
  },
  
  // Schedule - recurring sessions
  schedule: [
    {
      dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6, // 0 = Sunday, 6 = Saturday
      },
      startTime: {
        type: String, // "HH:MM" format
        required: true,
      },
      endTime: {
        type: String, // "HH:MM" format
        required: true,
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
    },
  ],
  
  // Media
  thumbnail: {
    type: String,
    default: null,
  },
  coverImage: {
    type: String,
    default: null,
  },
  
  // Status & Visibility
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'completed'],
    default: 'draft',
  },
  isPaid: {
    type: Boolean,
    default: true,
  },
  isFree: {
    type: Boolean,
    default: false,
  },
  
  // Analytics & Engagement
  enrolledStudents: {
    type: Number,
    default: 0,
  },
  totalSessions: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviews: {
    type: Number,
    default: 0,
  },
  engagement: {
    type: Number,
    default: 0,
  },
  
  // Host Plan Tier (for pricing multipliers)
  planTier: {
    type: String,
    enum: ['starter', 'growth', 'pro', 'elite'],
    default: 'starter',
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster queries
classSchema.index({ hostId: 1 });
classSchema.index({ category: 1 });
classSchema.index({ status: 1 });
classSchema.index({ createdAt: -1 });

export default mongoose.model('ClassMVP', classSchema);
