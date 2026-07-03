import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: String,
  lastName: String,
  profileImage: String,
  bio: String,
  
  // Role flags
  isStudent: {
    type: Boolean,
    default: true,
  },
  isHost: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
  adminRole: {
    type: String,
    enum: {
      values: [null, 'moderator', 'support', 'admin', 'superadmin'],
      message: '{VALUE} is not a valid admin role',
    },
    default: null,
  },
  
  // Admin/suspension fields
  suspendedAt: Date,
  suspendReason: String,
  bannedAt: Date,
  banReason: String,
  
  // Host-specific fields
  hostBio: String,
  stripeConnectId: String,
  hostVerified: {
    type: Boolean,
    default: false,
  },
  hostVerificationDocument: String,
  
  // Plan information (for hosts)
  planTier: {
    type: String,
    enum: ['starter', 'growth', 'pro', 'elite'],
    default: 'starter',
  },
  totalActiveStudents: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
  },
  
  // Preferences
  preferredCurrency: {
    type: String,
    default: 'USD',
  },
  preferredLanguage: {
    type: String,
    default: 'en',
  },
  timezone: String,
  // Email preferences
  emailPreferences: {
    paymentConfirmations: { type: Boolean, default: true },
    sessionReminders: { type: Boolean, default: true },
    subscriptionExpiry: { type: Boolean, default: true },
    achievementNotifications: { type: Boolean, default: true },
    classAnnouncements: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
    adminActivityAlerts: { type: Boolean, default: true },
    suspiciousActivityAlerts: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
  },
  
  // Two-Factor Authentication (2FA)
  twoFAEnabled: {
    type: Boolean,
    default: false,
  },
  twoFASecret: String,
  twoFABackupCodes: [String],
  twoFAVerifiedAt: Date,
  
  // Password security
  passwordChangedAt: Date,
  passwordExpiresAt: Date,
  lastFailedLoginAttempts: [{
    timestamp: Date,
    ipAddress: String,
  }],
  failedLoginCount: {
    type: Number,
    default: 0,
  },
  isLockedUntil: Date,
  
  // Admin permissions
  customPermissions: [String],
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminTeam',
  },
  
  // Activity tracking
  lastLoginAt: Date,
  lastLoginIp: String,
  lastActivityAt: Date,
  inactivityWarningAt: Date,
  
  // Free admission slots (calculated dynamically)
  freeAdmissionSlots: {
    type: Number,
    default: 0,
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

export default mongoose.model('User', userSchema);
