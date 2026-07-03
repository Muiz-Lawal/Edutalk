import mongoose from 'mongoose';

const superAdminApprovalSchema = new mongoose.Schema({
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  applicantEmail: String,
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending',
  },
  approvals: [{
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approverEmail: String,
    approvedAt: Date,
    comment: String,
  }],
  requiredApprovals: {
    type: Number,
    default: 2,
  },
  currentApprovals: {
    type: Number,
    default: 0,
  },
  rejections: [{
    rejectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectorEmail: String,
    rejectedAt: Date,
    reason: String,
  }],
  expiresAt: Date,
  completedAt: Date,
}, { timestamps: true });

// Index for pending approvals
superAdminApprovalSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('SuperAdminApproval', superAdminApprovalSchema);
