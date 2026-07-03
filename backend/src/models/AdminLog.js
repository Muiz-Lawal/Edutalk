import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminEmail: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_suspended',
      'user_unsuspended',
      'user_deleted',
      'user_banned',
      'host_approved',
      'host_rejected',
      'host_suspended',
      'class_removed',
      'class_suspended',
      'content_moderated',
      'refund_processed',
      'commission_updated',
      'settings_updated',
      'user_messaged',
      'moderation_notes_added',
      'payout_processed',
      'feature_flag_toggled',
    ],
  },
  targetType: {
    type: String,
    required: true,
    enum: ['User', 'Host', 'Class', 'Content', 'Payment', 'Settings'],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  targetEmail: String,
  details: {
    reason: String,
    notes: String,
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for common queries
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ targetId: 1, createdAt: -1 });
adminLogSchema.index({ createdAt: -1 });

export default mongoose.model('AdminLog', adminLogSchema);
