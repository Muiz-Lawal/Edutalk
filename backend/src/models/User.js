import mongoose from 'mongoose';
import { resolveHostPlanTier } from '../utils/hostPlans.js';

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
  dateOfBirth: Date,
  profileImage: String,
  bio: String,
  interests: { type: [String], default: [] },
  phoneVerified: { type: Boolean, default: false },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  
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
  activeRole: {
    type: String,
    enum: ['student', 'host', 'admin'],
    default: 'student',
  },
  adminRole: {
    type: String,
    enum: {
      values: [null, 'support', 'moderator', 'admin', 'finance_admin', 'superadmin'],
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
  recordingTranscriptionUsage: {
    date: String,
    minutes: { type: Number, default: 0 },
  },
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

userSchema.pre('save', function(next) {
if (this.adminRole && !this.isAdmin) {
  this.isAdmin = true;
}

if (this.isAdmin && !this.adminRole) {
  this.adminRole = 'admin';
}

this.isSuperAdmin = this.adminRole === 'superadmin' || this.isSuperAdmin;

  if (this.isHost && !this.dateOfBirth) {
    const error = new Error('Date of birth is required for host registration.');
    return next(error);
  }

if (!this.isStudent && !this.isHost && !this.isAdmin) {
  this.isStudent = true;
}

if (this.isHost) {
  this.planTier = resolveHostPlanTier({
    totalActiveStudents: this.totalActiveStudents || 0,
    averageRating: this.averageRating || 0,
    currentTier: this.planTier || 'starter',
  });
}

if (this.activeRole) {
  const allowedRoles = ['student', 'host', 'admin'];
  if (!allowedRoles.includes(this.activeRole)) {
    this.activeRole = 'student';
  }
} else if (this.isAdmin) {
  this.activeRole = 'admin';
} else if (this.isHost) {
  this.activeRole = 'host';
} else {
  this.activeRole = 'student';
}

next();
});

export default mongoose.model('User', userSchema);
