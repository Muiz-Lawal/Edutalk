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
  dateOfBirth: Date,
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
  if (this.isAdmin) {
    this.isStudent = false;
    this.isHost = false;
    this.isSuperAdmin = this.adminRole === 'superadmin' || this.isSuperAdmin;

    if (!this.adminRole) {
      this.adminRole = 'admin';
    }
  }

  if (this.isHost && !this.dateOfBirth) {
    const error = new Error('Date of birth is required for host registration.');
    return next(error);
  }

  if (this.isAdmin && (this.isStudent || this.isHost)) {
    const error = new Error('Admin accounts cannot also be student or host accounts.');
    return next(error);
  }

  next();
});

export default mongoose.model('User', userSchema);
