import mongoose from 'mongoose';

const adminTeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  type: {
    type: String,
    enum: ['moderation', 'support', 'payments', 'users', 'system', 'compliance'],
    required: true,
  },
  members: [{
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: String,
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    permissions: [String],
  }],
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  permissions: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

export default mongoose.model('AdminTeam', adminTeamSchema);
