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
  // A checkout can contain several class line items. These fields make the
  // gateway intent and the resulting ledger records idempotently traceable.
  checkoutId: String,
  checkoutItems: [{
    _id: false,
    classId: mongoose.Schema.Types.ObjectId,
    days: Number,
    amount: Number,
  }],
  
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

  // Payout ledger and holdback rules
  payoutStatus: {
    type: String,
    enum: ['pending', 'hold', 'available', 'released'],
    default: 'pending',
  },
  holdbackAmount: Number,
  holdbackRate: {
    type: Number,
    default: 0.125,
  },
  holdbackDays: {
    type: Number,
    default: 30,
  },
  payoutAmount: Number,
  payoutReleasedAt: Date,
  
  // Stripe details
  stripePaymentIntentId: String,
  stripeChargeId: String,
  gateway: {
    type: String,
    enum: ['stripe', 'paystack'],
  },
  gatewayReference: String,
  gatewayEventId: String,
  webhookProcessedAt: Date,
  activationSource: {
    type: String,
    enum: ['confirm', 'webhook'],
  },
  activatedAt: Date,
  
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
  refundStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'processed', 'rejected'],
    default: 'none',
  },
  refundAmount: Number,
  refundReason: String,
  refundInitiatedAt: Date,
  refundProcessedAt: Date,
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
