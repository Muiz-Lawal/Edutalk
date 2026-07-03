import mongoose from 'mongoose';

const adminActivitySchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminEmail: String,
  adminRole: String,
  action: {
    type: String,
    enum: [
      'login', 'logout',
      'user_deleted', 'user_suspended', 'user_unsuspended',
      'admin_created', 'admin_deleted', 'admin_updated',
      'password_changed', 'permission_updated',
      'refund_processed', 'payment_verified',
      'content_approved', 'content_rejected',
      '2fa_enabled', '2fa_disabled',
      'session_logout', 'inactivity_logout',
      'failed_login', 'password_reset',
      'role_changed', 'team_assigned'
    ],
    required: true,
  },
  targetType: String, // User, Admin, Payment, Content, etc.
  targetId: mongoose.Schema.Types.ObjectId,
  targetEmail: String,
  description: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure', 'partial'],
    default: 'success',
  },
  details: mongoose.Schema.Types.Mixed,
  flagged: {
    type: Boolean,
    default: false,
  },
  flagReason: String,
  reviewedBy: mongoose.Schema.Types.ObjectId,
  reviewedAt: Date,
}, { timestamps: true });

// Indexes for efficient querying
adminActivitySchema.index({ adminId: 1, createdAt: -1 });
adminActivitySchema.index({ action: 1, createdAt: -1 });
adminActivitySchema.index({ targetId: 1, createdAt: -1 });
adminActivitySchema.index({ flagged: 1, createdAt: -1 });
adminActivitySchema.index({ severity: 1, createdAt: -1 });

export default mongoose.model('AdminActivity', adminActivitySchema);
