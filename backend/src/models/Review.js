import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
  },
  
  // Overall rating
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  
  // Category ratings
  teachingQuality: {
    type: Number,
    min: 1,
    max: 5,
  },
  contentRelevance: {
    type: Number,
    min: 1,
    max: 5,
  },
  engagement: {
    type: Number,
    min: 1,
    max: 5,
  },
  valueForMoney: {
    type: Number,
    min: 1,
    max: 5,
  },
  pace: {
    type: Number,
    min: 1,
    max: 5,
  },
  
  // Text review
  comment: String,
  
  // Moderation
  flagged: Boolean,
  flagReason: String,
  approved: {
    type: Boolean,
    default: true,
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

export default mongoose.model('Review', reviewSchema);
