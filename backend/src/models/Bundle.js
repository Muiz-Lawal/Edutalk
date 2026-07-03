import mongoose from 'mongoose';

const bundleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classes: [{
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    title: String,
    category: String,
    originalPrice: Number,
    bundlePrice: Number
  }],
  pricing: {
    totalOriginalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalBundlePrice: {
      type: Number,
      required: true,
      min: 0
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    savings: {
      type: Number,
      min: 0,
      default: 0
    },
    dynamicRules: {
      timeBasedDiscounts: [{
        startDate: Date,
        endDate: Date,
        discountType: {
          type: String,
          enum: ['percentage', 'fixed'],
          required: true
        },
        discountValue: {
          type: Number,
          required: true,
          min: 0
        },
        name: String,
        isActive: {
          type: Boolean,
          default: true
        }
      }],
      demandBasedPricing: {
        enabled: {
          type: Boolean,
          default: false
        },
        priceIncreaseThresholds: [{
          enrollmentPercentage: {
            type: Number,
            min: 0,
            max: 100
          },
          priceMultiplier: {
            type: Number,
            min: 1,
            default: 1
          }
        }]
      },
      seasonalPricing: {
        enabled: {
          type: Boolean,
          default: false
        },
        seasonalMultipliers: [{
          months: [Number], // 0-11 for Jan-Dec
          multiplier: {
            type: Number,
            min: 0.1,
            max: 5,
            default: 1
          },
          name: String
        }]
      },
      lastPriceUpdate: Date
    }
  },
  settings: {
    isActive: {
      type: Boolean,
      default: true
    },
    maxEnrollments: {
      type: Number,
      min: 1,
      default: null // unlimited
    },
    enrollmentCount: {
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
    tags: [String],
    category: {
      type: String,
      enum: ['programming', 'design', 'business', 'marketing', 'language', 'science', 'arts', 'other'],
      required: true
    }
  },
  analytics: {
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalEnrollments: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
bundleSchema.index({ host: 1, isActive: 1 });
bundleSchema.index({ category: 1, isActive: 1 });
bundleSchema.index({ 'settings.validUntil': 1 });
bundleSchema.index({ createdAt: -1 });

// Virtual for checking if bundle is expired
bundleSchema.virtual('isExpired').get(function() {
  return this.settings.validUntil && new Date() > this.settings.validUntil;
});

// Virtual for checking if bundle is full
bundleSchema.virtual('isFull').get(function() {
  return this.settings.maxEnrollments && this.settings.enrollmentCount >= this.settings.maxEnrollments;
});

// Virtual for checking if bundle is available
bundleSchema.virtual('isAvailable').get(function() {
  return this.settings.isActive && !this.isExpired && !this.isFull;
});

// Method to calculate pricing with dynamic rules
bundleSchema.methods.calculatePricing = function(userId = null, currentDate = new Date()) {
  let baseOriginalPrice = this.classes.reduce((sum, cls) => sum + cls.originalPrice, 0);
  let baseBundlePrice = this.classes.reduce((sum, cls) => sum + cls.bundlePrice, 0);

  // Apply time-based discounts
  const timeDiscount = this.getTimeBasedDiscount(currentDate);
  if (timeDiscount) {
    if (timeDiscount.discountType === 'percentage') {
      baseBundlePrice *= (1 - timeDiscount.discountValue / 100);
    } else {
      baseBundlePrice = Math.max(0, baseBundlePrice - timeDiscount.discountValue);
    }
  }

  // Apply demand-based pricing
  const demandMultiplier = this.getDemandMultiplier();
  baseBundlePrice *= demandMultiplier;

  // Apply seasonal pricing
  const seasonalMultiplier = this.getSeasonalMultiplier(currentDate);
  baseBundlePrice *= seasonalMultiplier;

  // Ensure minimum pricing (don't go below a reasonable floor)
  const minBundlePrice = Math.max(baseOriginalPrice * 0.1, 1); // At least 10% of original or $1
  baseBundlePrice = Math.max(baseBundlePrice, minBundlePrice);

  const savings = baseOriginalPrice - baseBundlePrice;
  const discountPercentage = baseOriginalPrice > 0 ? Math.round((savings / baseOriginalPrice) * 100) : 0;

  // Update pricing object
  this.pricing.totalOriginalPrice = baseOriginalPrice;
  this.pricing.totalBundlePrice = Math.round(baseBundlePrice * 100) / 100; // Round to 2 decimal places
  this.pricing.savings = Math.round(savings * 100) / 100;
  this.pricing.discountPercentage = discountPercentage;
  this.pricing.lastPriceUpdate = currentDate;

  // Add dynamic pricing info
  this.pricing.dynamicPricing = {
    timeBasedDiscount: timeDiscount,
    demandMultiplier: demandMultiplier,
    seasonalMultiplier: seasonalMultiplier,
    finalPrice: this.pricing.totalBundlePrice
  };

  return this.pricing;
};

// Helper method to get active time-based discount
bundleSchema.methods.getTimeBasedDiscount = function(currentDate = new Date()) {
  if (!this.pricing.dynamicRules?.timeBasedDiscounts) return null;

  const activeDiscount = this.pricing.dynamicRules.timeBasedDiscounts.find(discount => {
    return discount.isActive &&
           currentDate >= discount.startDate &&
           currentDate <= discount.endDate;
  });

  return activeDiscount || null;
};

// Helper method to calculate demand multiplier
bundleSchema.methods.getDemandMultiplier = function() {
  if (!this.pricing.dynamicRules?.demandBasedPricing?.enabled) return 1;

  const enrollmentPercentage = this.settings.maxEnrollments > 0
    ? (this.settings.enrollmentCount / this.settings.maxEnrollments) * 100
    : 0;

  const thresholds = this.pricing.dynamicRules.demandBasedPricing.priceIncreaseThresholds;
  const applicableThreshold = thresholds
    .filter(t => enrollmentPercentage >= t.enrollmentPercentage)
    .sort((a, b) => b.enrollmentPercentage - a.enrollmentPercentage)[0];

  return applicableThreshold ? applicableThreshold.priceMultiplier : 1;
};

// Helper method to get seasonal multiplier
bundleSchema.methods.getSeasonalMultiplier = function(currentDate = new Date()) {
  if (!this.pricing.dynamicRules?.seasonalPricing?.enabled) return 1;

  const currentMonth = currentDate.getMonth(); // 0-11

  const applicableSeasonal = this.pricing.dynamicRules.seasonalPricing.seasonalMultipliers
    .find(seasonal => seasonal.months.includes(currentMonth));

  return applicableSeasonal ? applicableSeasonal.multiplier : 1;
};

// Method to add enrollment
bundleSchema.methods.addEnrollment = function() {
  if (this.isAvailable) {
    this.settings.enrollmentCount += 1;
    this.analytics.totalEnrollments += 1;
    return true;
  }
  return false;
};

// Method to add revenue
bundleSchema.methods.addRevenue = function(amount) {
  this.analytics.totalRevenue += amount;
};

// Static method to find available bundles
bundleSchema.statics.findAvailable = function(query = {}) {
  return this.find({
    'settings.isActive': true,
    $or: [
      { 'settings.validUntil': { $exists: false } },
      { 'settings.validUntil': { $gt: new Date() } }
    ],
    $or: [
      { 'settings.maxEnrollments': { $exists: false } },
      { $expr: { $lt: ['$settings.enrollmentCount', '$settings.maxEnrollments'] } }
    ],
    ...query
  });
};

export default mongoose.model('Bundle', bundleSchema);
