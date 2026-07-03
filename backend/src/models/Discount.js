import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0,
    max: 10000 // Will be validated in pre-save hook
  },
  conditions: {
    minPurchase: {
      type: Number,
      min: 0,
      default: 0
    },
    maxUses: {
      type: Number,
      min: 1,
      default: null // unlimited
    },
    usageCount: {
      type: Number,
      default: 0
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date,
      default: null // no expiration
    },
    applicableTo: {
      type: String,
      enum: ['all', 'classes', 'bundles', 'specific'],
      default: 'all'
    },
    specificItems: [{
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'specificItemType'
    }],
    specificItemType: {
      type: String,
      enum: ['Class', 'Bundle']
    },
    userRestrictions: {
      firstTimeOnly: {
        type: Boolean,
        default: false
      },
      maxUsesPerUser: {
        type: Number,
        min: 1,
        default: null // unlimited per user
      }
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  analytics: {
    totalUses: {
      type: Number,
      default: 0
    },
    totalDiscount: {
      type: Number,
      default: 0
    },
    revenueImpact: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
discountSchema.index({ code: 1 }, { unique: true });
discountSchema.index({ isActive: 1, 'conditions.validUntil': 1 });
discountSchema.index({ createdBy: 1 });
discountSchema.index({ 'conditions.applicableTo': 1 });

// Virtual for checking if discount is expired
discountSchema.virtual('isExpired').get(function() {
  return this.conditions.validUntil && new Date() > this.conditions.validUntil;
});

// Virtual for checking if discount is available
discountSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  const notExpired = !this.conditions.validUntil || now <= this.conditions.validUntil;
  const isStarted = !this.conditions.validFrom || now >= this.conditions.validFrom;
  const notMaxed = !this.conditions.maxUses || this.conditions.usageCount < this.conditions.maxUses;
  return this.isActive && isStarted && notExpired && notMaxed;
});

// Method to validate discount for user and item
discountSchema.methods.validateForUser = function(userId, itemId = null, itemType = null) {
  if (!this.isAvailable) {
    return { valid: false, reason: 'Discount is not available' };
  }

  // Check minimum purchase
  if (this.conditions.minPurchase > 0) {
    // This would be checked during application
  }

  // Check applicable items
  if (this.conditions.applicableTo === 'specific' && itemId) {
    const isApplicable = this.conditions.specificItems.some(id =>
      id.toString() === itemId.toString()
    );
    if (!isApplicable) {
      return { valid: false, reason: 'Discount not applicable to this item' };
    }
  }

  // Check user restrictions
  if (this.conditions.userRestrictions.firstTimeOnly) {
    // Would need to check user's purchase history
  }

  if (this.conditions.userRestrictions.maxUsesPerUser) {
    // Would need to check user's usage count
  }

  return { valid: true };
};

// Method to apply discount
discountSchema.methods.applyDiscount = function(originalPrice) {
  let discountAmount = 0;

  if (this.type === 'percentage') {
    discountAmount = Math.round((originalPrice * this.value) / 100);
  } else {
    discountAmount = Math.min(this.value, originalPrice);
  }

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return {
    originalPrice,
    discountAmount,
    finalPrice,
    discountType: this.type,
    discountValue: this.value
  };
};

// Method to record usage
discountSchema.methods.recordUsage = function(amount = 0) {
  this.conditions.usageCount += 1;
  this.analytics.totalUses += 1;
  this.analytics.totalDiscount += amount;
  this.analytics.revenueImpact += amount;
};

// Static method to find active discounts
discountSchema.statics.findActive = function() {
  return this.find({
    isActive: true,
    $or: [
      { 'conditions.validUntil': { $exists: false } },
      { 'conditions.validUntil': { $gt: new Date() } }
    ],
    $or: [
      { 'conditions.maxUses': { $exists: false } },
      { $expr: { $lt: ['$conditions.usageCount', '$conditions.maxUses'] } }
    ]
  });
};

// Pre-save hook to validate discount value based on type
discountSchema.pre('save', function(next) {
  if (this.type === 'percentage' && this.value > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }
  if (this.type === 'fixed' && this.value > 10000) {
    return next(new Error('Fixed discount cannot exceed $10,000'));
  }
  next();
});

// Static method to find discount by code
discountSchema.statics.findByCode = function(code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true
  });
};

export default mongoose.model('Discount', discountSchema);
