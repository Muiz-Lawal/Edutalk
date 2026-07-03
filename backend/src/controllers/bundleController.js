import Bundle from '../models/Bundle.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import DynamicPricingService from '../services/DynamicPricingService.js';

// Create a new bundle
export const createBundle = async (req, res) => {
  try {
    const { title, description, classIds, category, settings, pricing = {} } = req.body;
    const hostId = req.user.id;

    // Verify user is a host
    const user = await User.findById(hostId);
    if (!user || !user.isHost) {
      return res.status(403).json({ message: 'Only hosts can create bundles' });
    }

    // Verify all classes exist and belong to the host
    const classes = await Class.find({
      _id: { $in: classIds },
      hostId: hostId
    });

    if (classes.length !== (classIds || []).length) {
      return res.status(400).json({
        message: 'Some classes not found or do not belong to you'
      });
    }

    const totalOriginalPrice = classes.reduce((sum, cls) => sum + (cls.monthlyPrice || 0), 0);
    let totalBundlePrice = pricing.totalBundlePrice ?? totalOriginalPrice;

    if (pricing.discountPercentage !== undefined && pricing.discountPercentage !== null) {
      totalBundlePrice = totalOriginalPrice * (1 - pricing.discountPercentage / 100);
    } else if (pricing.discountType === 'percentage') {
      totalBundlePrice = totalOriginalPrice * (1 - pricing.discountValue / 100);
    } else if (pricing.discountType === 'fixed') {
      totalBundlePrice = Math.max(0, totalOriginalPrice - pricing.discountValue);
    }

    totalBundlePrice = Math.round(totalBundlePrice * 100) / 100;
    const bundlePriceRatio = totalOriginalPrice > 0 ? totalBundlePrice / totalOriginalPrice : 1;

    const bundleData = {
      title,
      description,
      host: hostId,
      classes: classes.map(cls => ({
        classId: cls._id,
        title: cls.title,
        category: cls.category,
        originalPrice: cls.monthlyPrice || 0,
        bundlePrice: Math.round((cls.monthlyPrice || 0) * bundlePriceRatio * 100) / 100
      })),
      pricing: {
        totalOriginalPrice,
        totalBundlePrice,
        discountPercentage: pricing.discountPercentage ??
          (totalOriginalPrice > 0
            ? Math.round(((totalOriginalPrice - totalBundlePrice) / totalOriginalPrice) * 100)
            : 0),
        savings: Math.round((totalOriginalPrice - totalBundlePrice) * 100) / 100,
        dynamicRules: pricing.dynamicRules || {
          timeBasedDiscounts: [],
          demandBasedPricing: {
            enabled: false,
            priceIncreaseThresholds: []
          },
          seasonalPricing: {
            enabled: false,
            seasonalMultipliers: []
          },
          lastPriceUpdate: new Date()
        }
      },
      settings: {
        isActive: settings?.isActive ?? true,
        maxEnrollments: settings?.maxEnrollments,
        validFrom: settings?.validFrom ? new Date(settings.validFrom) : new Date(),
        validUntil: settings?.validUntil ? new Date(settings.validUntil) : null,
        tags: settings?.tags || [],
        category
      }
    };

    const bundle = new Bundle(bundleData);
    bundle.calculatePricing();

    await bundle.save();

    res.status(201).json({
      message: 'Bundle created successfully',
      bundle
    });
  } catch (error) {
    console.error('Create bundle error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bundle title already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all bundles (with filtering)
export const getBundles = async (req, res) => {
  try {
    const {
      category,
      host,
      search,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    const query = { 'settings.isActive': true };

    // Add filters
    if (category && category !== 'all') {
      query['settings.category'] = category;
    }

    if (host) {
      query.host = host;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'settings.tags': { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Add availability filter
    query.$and = [
      ...(query.$and || []),
      {
        $or: [
          { 'settings.validUntil': { $exists: false } },
          { 'settings.validUntil': { $gt: new Date() } }
        ]
      },
      {
        $or: [
          { 'settings.maxEnrollments': { $exists: false } },
          { $expr: { $lt: ['$settings.enrollmentCount', '$settings.maxEnrollments'] } }
        ]
      }
    ];

    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    const bundles = await Bundle.find(query)
      .populate('host', 'firstName lastName profilePicture averageRating')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Bundle.countDocuments(query);

    res.json({
      bundles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get bundles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get bundle by ID
export const getBundleById = async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.bundleId)
      .populate('host', 'firstName lastName profilePicture averageRating')
      .populate('classes.classId', 'title description category pricing schedule');

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Increment view count
    await Bundle.findByIdAndUpdate(req.params.bundleId, {
      $inc: { 'analytics.viewCount': 1 }
    });

    res.json(bundle);
  } catch (error) {
    console.error('Get bundle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update bundle
export const updateBundle = async (req, res) => {
  try {
    const bundleId = req.params.bundleId;
    const updates = req.body;
    const userId = req.user.id;

    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Verify ownership
    if (bundle.host.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this bundle' });
    }

    // Update fields
    const allowedUpdates = [
      'title', 'description', 'category', 'classes',
      'settings.isActive', 'settings.maxEnrollments',
      'settings.validUntil', 'settings.tags'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        const fieldPath = field.split('.');
        if (fieldPath.length === 1) {
          bundle[field] = updates[field];
        } else {
          bundle[fieldPath[0]][fieldPath[1]] = updates[field];
        }
      }
    });

    // Recalculate pricing if classes changed
    if (updates.classes) {
      bundle.calculatePricing();
    }

    await bundle.save();

    res.json({
      message: 'Bundle updated successfully',
      bundle
    });
  } catch (error) {
    console.error('Update bundle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete bundle
export const deleteBundle = async (req, res) => {
  try {
    const bundleId = req.params.bundleId;
    const userId = req.user.id;

    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Verify ownership
    if (bundle.host.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this bundle' });
    }

    // Check if bundle has enrollments
    if (bundle.settings.enrollmentCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete bundle with existing enrollments'
      });
    }

    await Bundle.findByIdAndDelete(bundleId);

    res.json({ message: 'Bundle deleted successfully' });
  } catch (error) {
    console.error('Delete bundle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get host's bundles
export const getHostBundles = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { status = 'all' } = req.query;

    let query = { host: hostId };

    if (status === 'active') {
      query['settings.isActive'] = true;
    } else if (status === 'inactive') {
      query['settings.isActive'] = false;
    }

    const bundles = await Bundle.find(query)
      .sort({ createdAt: -1 })
      .populate('classes.classId', 'title category pricing');

    res.json(bundles);
  } catch (error) {
    console.error('Get host bundles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get bundle analytics
export const getBundleAnalytics = async (req, res) => {
  try {
    const bundleId = req.params.bundleId;
    const userId = req.user.id;

    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Verify ownership
    if (bundle.host.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view analytics' });
    }

    // Get enrollment data over time (mock for now)
    const analytics = {
      bundle: {
        id: bundle._id,
        title: bundle.title,
        enrollmentCount: bundle.settings.enrollmentCount,
        totalRevenue: bundle.analytics.totalRevenue,
        averageRating: bundle.analytics.averageRating,
        viewCount: bundle.analytics.viewCount
      },
      enrollmentTrend: [], // Would be populated from enrollment records
      revenueTrend: [], // Would be populated from payment records
      classPerformance: bundle.classes.map(cls => ({
        classId: cls.classId,
        title: cls.title,
        originalPrice: cls.originalPrice,
        bundlePrice: cls.bundlePrice,
        savings: cls.originalPrice - cls.bundlePrice
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get bundle analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Analyze bundle performance and get pricing recommendations
export const analyzeBundlePricing = async (req, res) => {
  try {
    const bundleId = req.params.bundleId;
    const userId = req.user.id;

    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Verify ownership
    if (bundle.host.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to analyze this bundle' });
    }

    const analysis = await DynamicPricingService.analyzeBundlePerformance(bundleId);

    res.json(analysis);
  } catch (error) {
    console.error('Analyze bundle pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Optimize bundle pricing automatically
export const optimizeBundlePricing = async (req, res) => {
  try {
    const bundleId = req.params.bundleId;
    const userId = req.user.id;

    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Verify ownership
    if (bundle.host.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to optimize this bundle' });
    }

    const optimizations = await DynamicPricingService.optimizeBundlePricing(bundleId);

    res.json({
      message: 'Bundle pricing optimized successfully',
      optimizations
    });
  } catch (error) {
    console.error('Optimize bundle pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a flash sale for a bundle
export const createFlashSale = async (req, res) => {
  try {
    const bundleId = req.params.bundleId;
    const { discountPercent, durationHours = 24 } = req.body;
    const userId = req.user.id;

    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Verify ownership
    if (bundle.host.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to create flash sales for this bundle' });
    }

    const flashSale = await DynamicPricingService.createFlashSale(bundleId, discountPercent, durationHours);

    res.json({
      message: 'Flash sale created successfully',
      flashSale
    });
  } catch (error) {
    console.error('Create flash sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set seasonal pricing for a bundle
export const setSeasonalPricing = async (req, res) => {
  try {
    const bundleId = req.params.bundleId;
    const { seasonConfig } = req.body;
    const userId = req.user.id;

    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Verify ownership
    if (bundle.host.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to set seasonal pricing for this bundle' });
    }

    const seasonalPricing = await DynamicPricingService.setSeasonalPricing(bundleId, seasonConfig);

    res.json({
      message: 'Seasonal pricing set successfully',
      seasonalPricing
    });
  } catch (error) {
    console.error('Set seasonal pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get personalized pricing for a user
export const getPersonalizedPricing = async (req, res) => {
  try {
    const bundleId = req.params.bundleId;
    const userId = req.user.id;

    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Get user's purchase history (simplified - in production you'd query actual data)
    const userHistory = {
      totalPurchases: 0, // This would come from actual user data
      hasActiveReferral: false // This would come from referral system
    };

    const personalizedPricing = await DynamicPricingService.getPersonalizedPrice(bundleId, userId, userHistory);

    res.json(personalizedPricing);
  } catch (error) {
    console.error('Get personalized pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create A/B test for pricing
export const createPricingABTest = async (req, res) => {
  try {
    const bundleId = req.params.bundleId;
    const { testConfig } = req.body;
    const userId = req.user.id;

    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Verify ownership
    if (bundle.host.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to create A/B tests for this bundle' });
    }

    const abTest = await DynamicPricingService.runPricingABTest(bundleId, testConfig);

    res.json({
      message: 'A/B test created successfully',
      abTest
    });
  } catch (error) {
    console.error('Create pricing A/B test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current price for user (including A/B test variants)
export const getCurrentPrice = async (req, res) => {
  try {
    const bundleId = req.params.bundleId;
    const userId = req.user.id;

    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Recalculate pricing with current date
    bundle.calculatePricing(userId);

    // Apply A/B testing if active
    const finalPrice = DynamicPricingService.getABTestPrice(bundle, userId);

    res.json({
      bundleId: bundle._id,
      basePrice: bundle.pricing.totalBundlePrice,
      finalPrice,
      appliedDiscounts: bundle.pricing.dynamicPricing,
      abTestActive: bundle.pricing.abTest?.status === 'active'
    });
  } catch (error) {
    console.error('Get current price error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
