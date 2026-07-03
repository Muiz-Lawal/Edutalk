import Discount from '../models/Discount.js';
import User from '../models/User.js';
import DiscountUsage from '../models/DiscountUsage.js';
import Payment from '../models/Payment.js';
import DiscountService from '../services/discountService.js';

// Create a new discount code
export const createDiscount = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      conditions,
      applicableTo,
      specificItems
    } = req.body;

    const createdBy = req.user.id;

    // Verify user is admin or host (for now, allow all authenticated users)
    const user = await User.findById(createdBy);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Validate discount code format
    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      return res.status(400).json({
        message: 'Discount code must be 3-20 characters, letters and numbers only'
      });
    }

    // Check if code already exists
    const existingDiscount = await Discount.findOne({ code: code.toUpperCase() });
    if (existingDiscount) {
      return res.status(400).json({ message: 'Discount code already exists' });
    }

    // Prepare discount data
    const discountData = {
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      conditions: {
        minPurchase: conditions?.minPurchase || 0,
        maxUses: conditions?.maxUses,
        validFrom: conditions?.validFrom ? new Date(conditions.validFrom) : new Date(),
        validUntil: conditions?.validUntil ? new Date(conditions.validUntil) : null,
        applicableTo: applicableTo || 'all',
        specificItems: specificItems || [],
        userRestrictions: {
          firstTimeOnly: conditions?.userRestrictions?.firstTimeOnly || false,
          maxUsesPerUser: conditions?.userRestrictions?.maxUsesPerUser
        }
      },
      createdBy
    };

    // Set specific item type if applicable
    if (applicableTo === 'specific' && specificItems?.length > 0) {
      // Assume first item determines type (would need validation)
      discountData.conditions.specificItemType = 'Class'; // or 'Bundle'
    }

    const discount = new Discount(discountData);
    await discount.save();

    res.status(201).json({
      message: 'Discount code created successfully',
      discount
    });
  } catch (error) {
    console.error('Create discount error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Discount code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all discount codes (admin/host view)
export const getDiscounts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'all', page = 1, limit = 20 } = req.query;

    let query = { createdBy: userId };

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query['conditions.validUntil'] = { $lt: new Date() };
    }

    const discounts = await Discount.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Discount.countDocuments(query);

    res.json({
      discounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get discounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get discount by ID
export const getDiscountById = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.discountId);

    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Verify ownership
    if (discount.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this discount' });
    }

    res.json(discount);
  } catch (error) {
    console.error('Get discount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update discount
export const updateDiscount = async (req, res) => {
  try {
    const discountId = req.params.discountId;
    const updates = req.body;
    const userId = req.user.id;

    const discount = await Discount.findById(discountId);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Verify ownership
    if (discount.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this discount' });
    }

    // Prevent updating code if it has been used
    if (updates.code && updates.code !== discount.code && discount.conditions.usageCount > 0) {
      return res.status(400).json({
        message: 'Cannot change discount code that has been used'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'description', 'value', 'isActive',
      'conditions.minPurchase', 'conditions.maxUses',
      'conditions.validUntil', 'conditions.applicableTo',
      'conditions.specificItems', 'conditions.userRestrictions'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        const fieldPath = field.split('.');
        if (fieldPath.length === 1) {
          discount[field] = updates[field];
        } else if (fieldPath.length === 2) {
          discount[fieldPath[0]][fieldPath[1]] = updates[field];
        } else if (fieldPath.length === 3) {
          discount[fieldPath[0]][fieldPath[1]][fieldPath[2]] = updates[field];
        }
      }
    });

    await discount.save();

    res.json({
      message: 'Discount updated successfully',
      discount
    });
  } catch (error) {
    console.error('Update discount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete discount
export const deleteDiscount = async (req, res) => {
  try {
    const discountId = req.params.discountId;
    const userId = req.user.id;

    const discount = await Discount.findById(discountId);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Verify ownership
    if (discount.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this discount' });
    }

    // Prevent deleting used discounts
    if (discount.conditions.usageCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete discount code that has been used'
      });
    }

    await Discount.findByIdAndDelete(discountId);

    res.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Delete discount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validate and apply discount code
export const validateDiscount = async (req, res) => {
  try {
    const { code, itemId, itemType, purchaseAmount } = req.body;
    const userId = req.user.id;

    const discount = await DiscountService.getDiscountByCode(code);
    if (!discount) {
      return res.status(404).json({ message: 'Invalid discount code' });
    }

    const validation = await DiscountService.validateDiscountCode(
      discount,
      userId,
      itemId,
      itemType,
      purchaseAmount
    );

    if (!validation.valid) {
      return res.status(400).json({ message: validation.reason });
    }

    const discountResult = await DiscountService.calculateDiscount(discount, purchaseAmount);

    res.json({
      valid: true,
      discount: {
        id: discount._id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        ...discountResult,
        remainingTotalUses: validation.remainingTotalUses,
        userUses: validation.userUses,
        remainingUserUses: validation.remainingUserUses
      }
    });
  } catch (error) {
    console.error('Validate discount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get discount analytics
export const getDiscountAnalytics = async (req, res) => {
  try {
    const discountId = req.params.discountId;
    const userId = req.user.id;
    const { period = 'daily', days = 30 } = req.query;

    const discount = await Discount.findById(discountId);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Verify ownership
    if (discount.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view analytics' });
    }

    // Get usage records
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const usageRecords = await DiscountUsage.find({
      discountId,
      createdAt: { $gte: startDate }
    }).populate('userId', 'firstName lastName').populate('paymentId');

    // Calculate usage trends
    const usageTrend = calculateUsageTrend(usageRecords, period, days);

    // Get unique users
    const uniqueUsers = new Set(usageRecords.map(u => u.userId._id.toString())).size;

    // Calculate performance metrics
    const totalRevenue = usageRecords.reduce((sum, u) => sum + (u.paymentId?.amount || 0), 0);
    const totalDiscountAmount = usageRecords.reduce((sum, u) => sum + u.amount, 0);
    const averageOrderValue = usageRecords.length > 0
      ? totalRevenue / usageRecords.length
      : 0;

    // Calculate conversion rate (usage vs potential views - approximated by total payments)
    const totalPayments = await Payment.countDocuments({
      createdAt: { $gte: startDate },
      classId: { $in: usageRecords.map(u => u.itemId) }
    });
    const conversionRate = totalPayments > 0 ? (usageRecords.length / totalPayments) * 100 : 0;

    // Calculate ROI (Revenue generated vs discount given)
    const roi = totalDiscountAmount > 0 ? ((totalRevenue - totalDiscountAmount) / totalDiscountAmount) * 100 : 0;

    // Get top items by usage
    const itemUsage = {};
    usageRecords.forEach(usage => {
      const itemKey = `${usage.itemType}:${usage.itemId}`;
      if (!itemUsage[itemKey]) {
        itemUsage[itemKey] = { count: 0, revenue: 0, discount: 0 };
      }
      itemUsage[itemKey].count++;
      itemUsage[itemKey].revenue += usage.paymentId?.amount || 0;
      itemUsage[itemKey].discount += usage.amount;
    });

    const topItems = Object.entries(itemUsage)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([itemKey, stats]) => ({
        item: itemKey,
        usageCount: stats.count,
        revenue: stats.revenue,
        discountAmount: stats.discount
      }));

    const analytics = {
      discount: {
        id: discount._id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        usageCount: discount.conditions.usageCount,
        totalDiscount: discount.analytics.totalDiscount,
        revenueImpact: discount.analytics.revenueImpact,
        isActive: discount.isActive,
        isExpired: discount.isExpired,
        isAvailable: discount.isAvailable,
        conditions: discount.conditions
      },
      summary: {
        totalUses: usageRecords.length,
        uniqueUsers,
        totalRevenue,
        totalDiscountAmount,
        averageOrderValue,
        conversionRate,
        roi,
        period: `${days} days`
      },
      usageTrend,
      topItems,
      recentUsage: usageRecords.slice(0, 10).map(usage => ({
        user: `${usage.userId.firstName} ${usage.userId.lastName}`,
        amount: usage.amount,
        revenue: usage.paymentId?.amount || 0,
        itemType: usage.itemType,
        createdAt: usage.createdAt
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get discount analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to calculate usage trends
function calculateUsageTrend(usageRecords, period, days) {
  const trend = {};
  const now = new Date();

  usageRecords.forEach(usage => {
    const date = new Date(usage.createdAt);
    let key;

    if (period === 'daily') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (period === 'monthly') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!trend[key]) {
      trend[key] = { uses: 0, revenue: 0, discount: 0 };
    }
    trend[key].uses++;
    trend[key].revenue += usage.paymentId?.amount || 0;
    trend[key].discount += usage.amount;
  });

  // Fill in missing dates with zero values
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    if (period === 'daily') {
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      result.push({
        date: key,
        uses: trend[key]?.uses || 0,
        revenue: trend[key]?.revenue || 0,
        discount: trend[key]?.discount || 0
      });
    } else if (period === 'weekly') {
      date.setDate(date.getDate() - (i * 7));
      const key = date.toISOString().split('T')[0];
      result.push({
        date: key,
        uses: trend[key]?.uses || 0,
        revenue: trend[key]?.revenue || 0,
        discount: trend[key]?.discount || 0
      });
    } else if (period === 'monthly') {
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        date: key,
        uses: trend[key]?.uses || 0,
        revenue: trend[key]?.revenue || 0,
        discount: trend[key]?.discount || 0
      });
    }
  }

  return result;
}

// Get overall discount analytics for a user
export const getOverallDiscountAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'daily', days = 30 } = req.query;

    // Get all discounts created by this user
    const discounts = await Discount.find({ createdBy: userId });

    if (discounts.length === 0) {
      return res.json({
        summary: {
          totalDiscounts: 0,
          activeDiscounts: 0,
          totalUses: 0,
          uniqueUsers: 0,
          totalRevenue: 0,
          totalDiscountAmount: 0,
          averageOrderValue: 0,
          conversionRate: 0,
          roi: 0,
          averageRoi: 0,
          period: `${days} days`
        },
        usageTrend: [],
        topPerforming: [],
        recentUsage: []
      });
    }

    const discountIds = discounts.map(d => d._id);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get usage records for all discounts
    const usageRecords = await DiscountUsage.find({
      discountId: { $in: discountIds },
      createdAt: { $gte: startDate }
    }).populate('userId', 'firstName lastName').populate('paymentId').populate('discountId', 'code name type value');

    // Calculate overall metrics
    const totalUses = usageRecords.length;
    const uniqueUsers = new Set(usageRecords.map(u => u.userId._id.toString())).size;
    const totalRevenue = usageRecords.reduce((sum, u) => sum + (u.paymentId?.amount || 0), 0);
    const totalDiscountAmount = usageRecords.reduce((sum, u) => sum + u.amount, 0);
    const averageOrderValue = totalUses > 0 ? totalRevenue / totalUses : 0;
    const roi = totalDiscountAmount > 0 ? ((totalRevenue - totalDiscountAmount) / totalDiscountAmount) * 100 : 0;

    // Calculate estimated conversion rate across the user's discounts
    const discountCodes = discounts.map((d) => d.code);
    const totalPayments = await Payment.countDocuments({
      discountCode: { $in: discountCodes },
      createdAt: { $gte: startDate }
    });
    const conversionRate = totalPayments > 0 ? (totalUses / totalPayments) * 100 : 0;

    // Calculate usage trends
    const usageTrend = calculateUsageTrend(usageRecords, period, days);

    // Get top performing discounts
    const discountPerformance = {};
    usageRecords.forEach(usage => {
      const discountId = usage.discountId._id.toString();
      if (!discountPerformance[discountId]) {
        discountPerformance[discountId] = {
          code: usage.discountId.code,
          name: usage.discountId.name,
          type: usage.discountId.type,
          value: usage.discountId.value,
          uses: 0,
          revenue: 0,
          discount: 0
        };
      }
      discountPerformance[discountId].uses++;
      discountPerformance[discountId].revenue += usage.paymentId?.amount || 0;
      discountPerformance[discountId].discount += usage.amount;
    });

    const topPerforming = Object.values(discountPerformance)
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 5)
      .map(d => ({
        ...d,
        roi: d.discount > 0 ? ((d.revenue - d.discount) / d.discount) * 100 : 0
      }));

    const analytics = {
      summary: {
        totalDiscounts: discounts.length,
        activeDiscounts: discounts.filter(d => d.isActive && !d.isExpired).length,
        totalUses,
        uniqueUsers,
        totalRevenue,
        totalDiscountAmount,
        averageOrderValue,
        conversionRate,
        roi,
        averageRoi: roi,
        period: `${days} days`
      },
      usageTrend,
      topPerforming,
      recentUsage: usageRecords.slice(0, 10).map(usage => ({
        discountCode: usage.discountId.code,
        discountName: usage.discountId.name,
        user: `${usage.userId.firstName} ${usage.userId.lastName}`,
        amount: usage.amount,
        revenue: usage.paymentId?.amount || 0,
        itemType: usage.itemType,
        createdAt: usage.createdAt
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get overall discount analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
