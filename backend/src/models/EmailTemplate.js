import mongoose from 'mongoose';

/**
 * Email Template Schema
 * Stores reusable email templates with variable placeholders
 */
const emailTemplateSchema = new mongoose.Schema({
  // Identification
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
  },
  description: String,

  // Content
  subject: {
    type: String,
    required: true,
  },
  htmlContent: {
    type: String,
    required: true,
  },
  textContent: String, // Plain text version

  // Variables that can be interpolated
  variables: [
    {
      name: String, // e.g., "studentName", "certificateUrl"
      description: String,
      defaultValue: String,
    },
  ],

  // Template usage
  category: {
    type: String,
    enum: [
      'certificate',
      'achievement',
      'progress',
      'enrollment',
      'class',
      'payment',
      'admin',
      'system',
    ],
    index: true,
  },

  // Creator and organization
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },

  // Settings
  isActive: {
    type: Boolean,
    default: true,
  },
  isSystem: {
    type: Boolean,
    default: false,
  },
  canEdit: {
    type: Boolean,
    default: true,
  },

  // Usage tracking
  usageCount: {
    type: Number,
    default: 0,
  },
  lastUsed: Date,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update updatedAt
emailTemplateSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('EmailTemplate', emailTemplateSchema);
