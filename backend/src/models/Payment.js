import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
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
  
  // Amount and currency
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  
  // Days purchased
  daysPurchased: Number,
  
  // Commission breakdown
  platformCommission: Number,
  stripeProcessingFee: Number,
  hostEarnings: Number,
  
  // Stripe details
  stripePaymentIntentId: String,
  stripeChargeId: String,
  
  // Payment type
  paymentType: {
    type: String,
    enum: ['new', 'continuation', 'renewal', 'discounted'],
    default: 'new',
  },
  
  // Discount code if used
  discountCode: String,
  discountAmount: Number,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  
  // Refund information
  refundAmount: Number,
  refundReason: String,
  refundedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
