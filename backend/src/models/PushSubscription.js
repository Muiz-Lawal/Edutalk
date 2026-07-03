import mongoose from 'mongoose';

const PushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscription: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userAgent: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastDelivered: {
      type: Date,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      index: true,
    },
  },
  { timestamps: true }
);

// Clean up expired subscriptions
PushSubscriptionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Prevent duplicate subscriptions per user endpoint
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

export default mongoose.model('PushSubscription', PushSubscriptionSchema);
