import Bundle from '../models/Bundle.js';

class DynamicPricingService {
  // Analyze bundle performance and suggest optimal pricing
  static async analyzeBundlePerformance(bundleId) {
    const bundle = await Bundle.findById(bundleId);
    if (!bundle) throw new Error('Bundle not found');

    const analysis = {
      bundleId: bundle._id,
      currentEnrollment: bundle.settings.enrollmentCount,
      maxEnrollments: bundle.settings.maxEnrollments,
      enrollmentRate: bundle.settings.maxEnrollments > 0
        ? (bundle.settings.enrollmentCount / bundle.settings.maxEnrollments) * 100
        : 0,
      currentPrice: bundle.pricing.totalBundlePrice,
      originalPrice: bundle.pricing.totalOriginalPrice,
      currentDiscount: bundle.pricing.discountPercentage,
      revenue: bundle.analytics.totalRevenue,
      recommendations: []
    };

    // Generate recommendations based on performance
    if (analysis.enrollmentRate < 30) {
      analysis.recommendations.push({
        type: 'increase_discount',
        suggestion: 'Increase discount by 10-15% to boost enrollment',
        expectedImpact: 'high'
      });
    } else if (analysis.enrollmentRate > 80) {
      analysis.recommendations.push({
        type: 'implement_demand_pricing',
        suggestion: 'Enable demand-based pricing to maximize revenue',
        expectedImpact: 'high'
      });
    }

    if (bundle.analytics.totalEnrollments > 0) {
      const avgRevenuePerEnrollment = bundle.analytics.totalRevenue / bundle.analytics.totalEnrollments;
      if (avgRevenuePerEnrollment < bundle.pricing.totalBundlePrice * 0.8) {
        analysis.recommendations.push({
          type: 'price_optimization',
          suggestion: 'Consider adjusting base price or discount strategy',
          expectedImpact: 'medium'
        });
      }
    }

    return analysis;
  }

  // Apply optimal pricing strategy based on analysis
  static async optimizeBundlePricing(bundleId) {
    const analysis = await this.analyzeBundlePerformance(bundleId);
    const bundle = await Bundle.findById(bundleId);

    const optimizations = {
      applied: [],
      recommendations: analysis.recommendations
    };

    // Auto-apply optimizations based on analysis
    for (const rec of analysis.recommendations) {
      if (rec.expectedImpact === 'high') {
        switch (rec.type) {
          case 'increase_discount':
            if (bundle.pricing.discountPercentage < 50) {
              const newDiscount = Math.min(bundle.pricing.discountPercentage + 10, 50);
              bundle.pricing.discountPercentage = newDiscount;
              bundle.pricing.totalBundlePrice = bundle.pricing.totalOriginalPrice * (1 - newDiscount / 100);
              optimizations.applied.push('Increased discount by 10%');
            }
            break;

          case 'implement_demand_pricing':
            if (!bundle.pricing.dynamicRules.demandBasedPricing.enabled) {
              bundle.pricing.dynamicRules.demandBasedPricing.enabled = true;
              bundle.pricing.dynamicRules.demandBasedPricing.priceIncreaseThresholds = [
                { enrollmentPercentage: 50, priceMultiplier: 1.1 },
                { enrollmentPercentage: 75, priceMultiplier: 1.2 },
                { enrollmentPercentage: 90, priceMultiplier: 1.3 }
              ];
              optimizations.applied.push('Enabled demand-based pricing');
            }
            break;
        }
      }
    }

    if (optimizations.applied.length > 0) {
      bundle.pricing.lastPriceUpdate = new Date();
      await bundle.save();
    }

    return optimizations;
  }

  // Create flash sale pricing
  static async createFlashSale(bundleId, discountPercent, durationHours = 24) {
    const bundle = await Bundle.findById(bundleId);
    if (!bundle) throw new Error('Bundle not found');

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

    const flashSale = {
      startDate,
      endDate,
      discountType: 'percentage',
      discountValue: discountPercent,
      name: `Flash Sale ${discountPercent}% OFF`,
      isActive: true
    };

    if (!bundle.pricing.dynamicRules.timeBasedDiscounts) {
      bundle.pricing.dynamicRules.timeBasedDiscounts = [];
    }

    bundle.pricing.dynamicRules.timeBasedDiscounts.push(flashSale);
    bundle.pricing.lastPriceUpdate = new Date();

    await bundle.save();
    return flashSale;
  }

  // Set seasonal pricing
  static async setSeasonalPricing(bundleId, seasonConfig) {
    const bundle = await Bundle.findById(bundleId);
    if (!bundle) throw new Error('Bundle not found');

    bundle.pricing.dynamicRules.seasonalPricing.enabled = true;
    bundle.pricing.dynamicRules.seasonalPricing.seasonalMultipliers = seasonConfig;
    bundle.pricing.lastPriceUpdate = new Date();

    await bundle.save();
    return bundle.pricing.dynamicRules.seasonalPricing;
  }

  // Calculate personalized pricing for a user
  static async getPersonalizedPrice(bundleId, userId, userHistory = {}) {
    const bundle = await Bundle.findById(bundleId);
    if (!bundle) throw new Error('Bundle not found');

    let personalizedPrice = bundle.pricing.totalBundlePrice;

    // Apply loyalty discounts based on user's purchase history
    if (userHistory.totalPurchases > 5) {
      personalizedPrice *= 0.95; // 5% loyalty discount
    } else if (userHistory.totalPurchases > 2) {
      personalizedPrice *= 0.97; // 3% loyalty discount
    }

    // Apply first-time buyer discount
    if (userHistory.totalPurchases === 0) {
      personalizedPrice *= 0.9; // 10% first-time discount
    }

    // Apply referral discount
    if (userHistory.hasActiveReferral) {
      personalizedPrice *= 0.95; // 5% referral discount
    }

    return {
      originalPrice: bundle.pricing.totalBundlePrice,
      personalizedPrice: Math.round(personalizedPrice * 100) / 100,
      savings: Math.round((bundle.pricing.totalBundlePrice - personalizedPrice) * 100) / 100,
      appliedDiscounts: this.getAppliedDiscounts(userHistory)
    };
  }

  // Helper to get applied discounts
  static getAppliedDiscounts(userHistory) {
    const discounts = [];

    if (userHistory.totalPurchases === 0) {
      discounts.push({ type: 'first_time', discount: '10% off' });
    }
    if (userHistory.totalPurchases > 2) {
      discounts.push({ type: 'loyalty', discount: userHistory.totalPurchases > 5 ? '5% off' : '3% off' });
    }
    if (userHistory.hasActiveReferral) {
      discounts.push({ type: 'referral', discount: '5% off' });
    }

    return discounts;
  }

  // A/B testing for pricing strategies
  static async runPricingABTest(bundleId, testConfig) {
    const bundle = await Bundle.findById(bundleId);
    if (!bundle) throw new Error('Bundle not found');

    // Create test variants
    const variants = testConfig.variants.map(variant => ({
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: variant.name,
      discountType: variant.discountType,
      discountValue: variant.discountValue,
      trafficPercentage: variant.trafficPercentage,
      metrics: {
        impressions: 0,
        conversions: 0,
        revenue: 0
      }
    }));

    // Store test configuration (you might want to create a separate collection for this)
    bundle.pricing.abTest = {
      testId: `ab_test_${Date.now()}`,
      startDate: new Date(),
      endDate: new Date(Date.now() + testConfig.durationDays * 24 * 60 * 60 * 1000),
      variants,
      status: 'active'
    };

    await bundle.save();
    return bundle.pricing.abTest;
  }

  // Get optimal price for A/B test variant
  static getABTestPrice(bundle, userId) {
    if (!bundle.pricing.abTest || bundle.pricing.abTest.status !== 'active') {
      return bundle.pricing.totalBundlePrice;
    }

    // Simple user-based variant assignment (in production, use proper randomization)
    const userHash = this.hashString(userId);
    const totalTraffic = bundle.pricing.abTest.variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
    const normalizedHash = userHash % totalTraffic;

    let cumulativeTraffic = 0;
    for (const variant of bundle.pricing.abTest.variants) {
      cumulativeTraffic += variant.trafficPercentage;
      if (normalizedHash < cumulativeTraffic) {
        let testPrice = bundle.pricing.totalBundlePrice;
        if (variant.discountType === 'percentage') {
          testPrice *= (1 - variant.discountValue / 100);
        } else {
          testPrice = Math.max(0, testPrice - variant.discountValue);
        }
        return Math.round(testPrice * 100) / 100;
      }
    }

    return bundle.pricing.totalBundlePrice;
  }

  // Simple string hashing for A/B test assignment
  static hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export default DynamicPricingService;