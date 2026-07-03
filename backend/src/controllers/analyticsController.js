import mongoose from 'mongoose';
import Analytics from '../models/Analytics.js';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import Class from '../models/Class.js';
import Review from '../models/Review.js';
import Event from '../models/Event.js';

export const getHostAnalytics = async (req, res) => {
  try {
    const { classId, period = 'monthly' } = req.query;

    let filter = { hostId: req.user.userId };
    if (classId) {
      filter.classId = classId;
    }

    const analytics = await Analytics.find(filter)
      .sort({ date: -1 })
      .limit(12); // Last 12 periods

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClassAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;

    // Get class details
    const classData = await Class.findById(classId);

    if (!classData || classData.hostId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Calculate metrics
    const subscriptions = await Subscription.find({ classId });
    const payments = await Payment.find({ classId, status: 'completed' });
    const reviews = await Review.find({ classId, approved: true });

    const metrics = {
      totalEnrollments: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      averageOrderValue: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0,
      totalReviews: reviews.length,
      averageRating: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
        : 0,
    };

    // Calculate growth
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSubscriptions = subscriptions.filter(s => s.createdAt > thirtyDaysAgo);
    const recentRevenue = payments
      .filter(p => p.createdAt > thirtyDaysAgo)
      .reduce((sum, p) => sum + p.amount, 0);

    metrics.recentEnrollments = recentSubscriptions.length;
    metrics.recentRevenue = recentRevenue;

    res.json({
      class: classData,
      metrics,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = 'monthly', months = 12 } = req.query;

    const payments = await Payment.find({
      createdAt: {
        $gte: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000),
      },
      status: 'completed',
    }).populate('classId', 'hostId');

    // Group by date
    const grouped = {};
    payments.forEach(payment => {
      const date = new Date(payment.createdAt);
      const key = period === 'monthly' 
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : date.toISOString().split('T')[0];

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, transactions: 0, earnings: 0 };
      }
      grouped[key].revenue += payment.amount;
      grouped[key].earnings += payment.hostEarnings;
      grouped[key].transactions += 1;
    });

    res.json({
      period,
      data: Object.entries(grouped).map(([date, stats]) => ({
        date,
        ...stats,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentAnalytics = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      userId: req.user.userId,
    }).populate('classId');

    const analytics = subscriptions.map(sub => ({
      class: sub.classId?.title,
      classId: sub.classId?._id,
      startDate: sub.startDate,
      endDate: sub.endDate,
      daysRemaining: Math.max(0, Math.ceil((sub.endDate - Date.now()) / (24 * 60 * 60 * 1000))),
      sessionsAttended: sub.sessionsAttended.length,
      completionPercentage: sub.completionPercentage,
      status: sub.status,
    }));

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecommendationMetrics = async (req, res) => {
  try {
    const { classId, start, end } = req.query;
    const hostClasses = await Class.find({ hostId: req.user.userId }).select('_id title averageRating totalEnrolled');
    const validClassIds = hostClasses.map((cls) => cls._id);
    const classFilterId = classId && mongoose.Types.ObjectId.isValid(classId)
      ? new mongoose.Types.ObjectId(classId)
      : null;

    if (classId && (!classFilterId || !validClassIds.some((id) => id.equals(classFilterId)))) {
      return res.status(403).json({ message: 'Not authorized to access recommendation metrics for this class' });
    }

    const classFilterIds = classFilterId ? [classFilterId] : validClassIds;
    const match = {
      action: { $in: ['click_recommendation_card'] },
      targetType: 'class',
      targetId: { $in: classFilterIds },
    };

    if (start || end) {
      match.createdAt = {};
      if (start) match.createdAt.$gte = new Date(start);
      if (end) match.createdAt.$lt = new Date(end);
    }

    const clickAggregation = await Event.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$targetId',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const topClasses = clickAggregation.map((item) => {
      const classData = hostClasses.find((cls) => cls._id.toString() === item._id.toString());
      return {
        classId: item._id,
        title: classData?.title || 'Unknown Class',
        averageRating: classData?.averageRating || 0,
        totalEnrolled: classData?.totalEnrolled || 0,
        clicks: item.count,
      };
    });

    const totalRecommendationClicks = clickAggregation.reduce((sum, item) => sum + item.count, 0);

    const viewMatch = { action: 'view_recommendation_section' };
    if (start || end) {
      viewMatch.createdAt = {};
      if (start) viewMatch.createdAt.$gte = new Date(start);
      if (end) viewMatch.createdAt.$lt = new Date(end);
    }
    const recommendationViews = await Event.countDocuments(viewMatch);

    const clickThroughRate = recommendationViews > 0
      ? Math.round((totalRecommendationClicks / recommendationViews) * 1000) / 10
      : 0;

    res.json({
      totalRecommendationClicks,
      recommendationViews,
      clickThroughRate,
      topClasses,
      classMetrics: topClasses,
      hostClassCount: validClassIds.length,
    });
  } catch (error) {
    console.error('getRecommendationMetrics error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const generateAnalyticsReport = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId);

    if (!classData || classData.hostId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const subscriptions = await Subscription.find({ classId });
    const payments = await Payment.find({ classId, status: 'completed' });
    const reviews = await Review.find({ classId });

    const report = {
      className: classData.title,
      period: {
        start: classData.createdAt,
        end: new Date(),
      },
      enrollment: {
        total: subscriptions.length,
        active: subscriptions.filter(s => s.status === 'active').length,
        expired: subscriptions.filter(s => s.status === 'expired').length,
        cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
      },
      revenue: {
        total: payments.reduce((sum, p) => sum + p.amount, 0),
        platformCommission: payments.reduce((sum, p) => sum + p.platformCommission, 0),
        hostEarnings: payments.reduce((sum, p) => sum + p.hostEarnings, 0),
        stripeProcessingFees: payments.reduce((sum, p) => sum + p.stripeProcessingFee, 0),
        averageOrderValue: payments.length > 0
          ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length
          : 0,
      },
      reviews: {
        total: reviews.length,
        averageRating: reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
          : 0,
        byRating: {
          five: reviews.filter(r => r.overallRating === 5).length,
          four: reviews.filter(r => r.overallRating === 4).length,
          three: reviews.filter(r => r.overallRating === 3).length,
          two: reviews.filter(r => r.overallRating === 2).length,
          one: reviews.filter(r => r.overallRating === 1).length,
        },
      },
      recommendations: generateRecommendations(subscriptions, payments, reviews),
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function generateRecommendations(subscriptions, payments, reviews) {
  const recommendations = [];

  const churnRate = subscriptions.filter(s => s.status === 'cancelled').length / subscriptions.length;
  if (churnRate > 0.3) {
    recommendations.push('High churn rate detected. Consider improving class content or engagement.');
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
    : 0;
  if (avgRating < 3) {
    recommendations.push('Average rating is low. Review student feedback and consider improvements.');
  }

  if (subscriptions.filter(s => s.status === 'active').length === 0) {
    recommendations.push('No active subscriptions. Promote your class and consider adjusting pricing.');
  }

  if (reviews.length === 0) {
    recommendations.push('No reviews yet. Encourage students to leave feedback.');
  }

  return recommendations;
}

// Raw event analytics endpoint
export const getEngagement = async (req, res) => {
  try {
    const { start, end, classId } = req.query;
    const match = {};

    if (start) {
      match.createdAt = { $gte: new Date(start) };
    }
    if (end) {
      match.createdAt = match.createdAt || {};
      match.createdAt.$lt = new Date(end);
    }

    if (classId) {
      match.targetType = 'class';
      match.targetId = classId;
    }

    // Aggregate raw events as fallback
    const pipeline = [
      { $match: match },
      { $group: { _id: '$action', count: { $sum: 1 }, users: { $addToSet: '$userId' } } },
      { $project: { action: '$_id', count: 1, uniqueUsers: { $size: '$users' } } }
    ];

    const results = await Event.aggregate(pipeline).allowDiskUse(true);

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('getEngagement error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Simple endpoint returning aggregated Analytics documents if available
export const getAnalyticsDocuments = async (req, res) => {
  try {
    const { start, end, classId, period = 'daily' } = req.query;
    const q = { period };
    if (classId) q.classId = classId;
    if (start || end) q.date = {};
    if (start) q.date.$gte = new Date(start);
    if (end) q.date.$lt = new Date(end);

    const docs = await Analytics.find(q).sort({ date: -1 }).limit(100);
    res.json({ success: true, data: docs });
  } catch (err) {
    console.error('getAnalyticsDocuments error:', err);
    res.status(500).json({ message: err.message });
  }
};
