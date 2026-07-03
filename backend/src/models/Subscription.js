import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
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
  
  // Access details
  accessCode: {
    type: String,
    unique: true,
    required: true,
  },
  
  // Payment information
  numberOfDays: Number,
  startDate: Date,
  endDate: Date,
  
  // Auto-renewal
  autoRenewal: {
    type: Boolean,
    default: false,
  },
  
  // Payment history (for continuation pricing)
  paymentChain: [{
    paymentId: mongoose.Schema.Types.ObjectId,
    date: Date,
    amount: Number,
    days: Number,
  }],
  totalDaysPurchased: {
    type: Number,
    default: 0,
  },
  totalAmountPaid: {
    type: Number,
    default: 0,
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  },
  
  // Progress tracking
  sessionsAttended: [{
    sessionId: mongoose.Schema.Types.ObjectId,
    attendedAt: Date,
    duration: Number,
  }],
  completionPercentage: {
    type: Number,
    default: 0,
  },
  hasReview: {
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

export default mongoose.model('Subscription', subscriptionSchema);
