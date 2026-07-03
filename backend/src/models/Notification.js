import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Notification details
  type: {
    type: String,
    enum: [
      'payment_confirmation',
      'session_reminder',
      'subscription_expiry',
      'auto_renewal',
      'renewal_failed',
      'host_no_show',
      'refund_confirmation',
      'class_cancellation',
      'plan_upgrade',
      'referral_reward',
      'waitlist_available',
      'new_review',
      'class_announcement',
      'recording_ready',
      'achievement_unlocked',
      ],
  },
  
  title: String,
  message: String,
  
  // Additional data
  relatedClassId: mongoose.Schema.Types.ObjectId,
  relatedUserId: mongoose.Schema.Types.ObjectId,
  relatedPaymentId: mongoose.Schema.Types.ObjectId,
  metadata: mongoose.Schema.Types.Mixed,
  
  // Status
  read: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  
  // Delivery
  emailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAt: Date,
  pushNotificationSent: {
    type: Boolean,
    default: false,
  },
  
  // Retention
  dismissedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
