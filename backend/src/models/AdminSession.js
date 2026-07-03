import mongoose from 'mongoose';

const adminSessionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminEmail: String,
  adminRole: String,
  token: String,
  ipAddress: String,
  userAgent: String,
  loginTime: {
    type: Date,
    default: Date.now,
  },
  lastActivityTime: {
    type: Date,
    default: Date.now,
  },
  logoutTime: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  twoFAVerified: {
    type: Boolean,
    default: false,
  },
  sessionDuration: Number, // in milliseconds
  browserInfo: {
    name: String,
    version: String,
    os: String,
  },
  location: {
    country: String,
    city: String,
    timezone: String,
  },
}, { timestamps: true });

// Auto-cleanup old sessions (30 days)
adminSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('AdminSession', adminSessionSchema);
