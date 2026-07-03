import mongoose from 'mongoose';
import crypto from 'crypto';

const certificateSchema = new mongoose.Schema({
  // References
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },

  // Certificate Data
  certificateNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    required: true
  },

  // Customization
  templateId: {
    type: String,
    default: 'default'
  },
  certificateData: {
    courseTitle: String,
    courseDescription: String,
    hoursCompleted: Number,
    finalScore: Number,
    instructorName: String,
    instructorTitle: String,
    certificateMessage: String
  },

  // Verification
  verificationCode: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  verificationUrl: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false
  },

  // Analytics
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  },
  sharedCount: {
    type: Number,
    default: 0
  },

  // Sharing
  socialShares: [{
    platform: {
      type: String,
      enum: ['linkedin', 'twitter', 'facebook', 'email'],
      required: true
    },
    sharedAt: Date,
    sharedUrl: String,
    success: Boolean
  }],

  // PDF Storage
  pdfUrl: {
    type: String
  },
  pdfStorageId: {
    type: String
  },
  pdfSize: {
    type: Number // in bytes
  },

  // Status
  status: {
    type: String,
    enum: ['issued', 'revoked', 'expired'],
    default: 'issued'
  },
  revokedAt: {
    type: Date
  },
  revokeReason: {
    type: String
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for frequent queries
certificateSchema.index({ studentId: 1, classId: 1 });
certificateSchema.index({ verificationCode: 1 });
certificateSchema.index({ issuedDate: -1 });

// Pre-save: Generate certificate number if not exists
certificateSchema.pre('save', function(next) {
  if (!this.certificateNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.certificateNumber = `CERT-${timestamp}-${randomStr}`;
  }

  if (!this.verificationCode) {
    this.verificationCode = crypto.randomBytes(16).toString('hex').toUpperCase();
  }

  if (!this.verificationUrl) {
    this.verificationUrl = `/verify-certificate/${this.verificationCode}`;
  }

  next();
});

// Method: Record download
certificateSchema.methods.recordDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Method: Record social share
certificateSchema.methods.recordShare = function(platform, shareUrl) {
  this.socialShares.push({
    platform,
    sharedAt: new Date(),
    sharedUrl: shareUrl,
    success: true
  });
  
  this.sharedCount += 1;
  this.updatedAt = new Date();
  
  return this.save();
};

// Method: Get share link
certificateSchema.methods.getShareLink = function(platform) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const certUrl = `${baseUrl}/verify-certificate/${this.verificationCode}`;
  
  const encodedUrl = encodeURIComponent(certUrl);
  const studentName = this.certificateData?.studentName || 'A Student';
  const courseTitle = this.certificateData?.courseTitle || 'a Course';
  
  const shareLinks = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just completed ${courseTitle}! Check my certificate:`)}+${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodeURIComponent(`${studentName} completed ${courseTitle}`)}&body=${encodeURIComponent(`${studentName} has completed ${courseTitle}. View certificate: ${certUrl}`)}`
  };
  
  return shareLinks[platform] || null;
};

// Method: Get certificate details
certificateSchema.methods.getCertificateDetails = function() {
  return {
    certificateNumber: this.certificateNumber,
    studentId: this.studentId,
    classId: this.classId,
    issuedDate: this.issuedDate,
    completionDate: this.completionDate,
    courseTitle: this.certificateData?.courseTitle,
    hoursCompleted: this.certificateData?.hoursCompleted,
    finalScore: this.certificateData?.finalScore,
    instructorName: this.certificateData?.instructorName,
    verificationCode: this.verificationCode,
    downloadCount: this.downloadCount,
    sharedCount: this.sharedCount,
    status: this.status
  };
};

// Method: Revoke certificate
certificateSchema.methods.revoke = function(reason) {
  this.status = 'revoked';
  this.revokedAt = new Date();
  this.revokeReason = reason;
  this.updatedAt = new Date();
  return this.save();
};

// Method: Verify certificate
certificateSchema.statics.verifyCertificate = async function(verificationCode) {
  const cert = await this.findOne({
    verificationCode,
    status: 'issued'
  });
  
  return cert ? cert.getCertificateDetails() : null;
};

// Virtual: Is downloadable
certificateSchema.virtual('isDownloadable').get(function() {
  return this.status === 'issued' && this.pdfUrl;
});

// Virtual: Days since issued
certificateSchema.virtual('daysSinceIssued').get(function() {
  const days = Math.floor((Date.now() - this.issuedDate) / (1000 * 60 * 60 * 24));
  return days;
});

export default mongoose.model('Certificate', certificateSchema);
