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
  accessCodeEmail: {
    type: String,
    lowercase: true,
    trim: true,
  },
  accessCodeClassId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  accessCodeValidFrom: Date,
  accessCodeValidUntil: Date,
  trustedDeviceFingerprints: [{
    type: String,
    trim: true,
  }],
  
  // Payment information
  numberOfDays: Number,
  startDate: Date,
  endDate: Date,
  accessTimezone: String,
  
  // Auto-renewal
  autoRenewal: {
    type: Boolean,
    default: false,
  },
  
  // Payment history (for continuation pricing)
  paymentChain: [{
    _id: false,
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      min: 0,
      required: true,
    },
    days: {
      type: Number,
      min: 1,
      required: true,
    },
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

subscriptionSchema.index({ userId: 1, classId: 1, status: 1 });

export default mongoose.model('Subscription', subscriptionSchema);
