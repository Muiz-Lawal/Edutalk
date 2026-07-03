import AdminActivity from '../models/AdminActivity.js';

// Log admin activity
export const logActivity = async (
  adminId,
  adminEmail,
  adminRole,
  action,
  targetType,
  targetId = null,
  targetEmail = null,
  description = '',
  severity = 'medium',
  ipAddress = null,
  userAgent = null
) => {
  try {
    const activity = await AdminActivity.create({
      adminId,
      adminEmail,
      adminRole,
      action,
      targetType,
      targetId,
      targetEmail,
      description,
      severity,
      ipAddress,
      userAgent,
      status: 'success',
    });

    return activity;
  } catch (error) {
    console.error('Error logging admin activity:', error);
  }
};

// Get activity trends for dashboard
export const getActivityTrends = async (days = 30) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const trends = await AdminActivity.aggregate([
    {
      $match: {
        createdAt: { $gte: fromDate },
      },
    },
    {
      $group: {
        _id: {
          action: '$action',
          date: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': -1 },
    },
  ]);

  return trends;
};

// Get suspicious activities (flagged)
export const getFlaggedActivities = async (limit = 50) => {
  return AdminActivity.find({ flagged: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('adminId', 'email firstName lastName');
};

// Flag suspicious activity
export const flagActivity = async (activityId, reason) => {
  return AdminActivity.findByIdAndUpdate(
    activityId,
    {
      flagged: true,
      flagReason: reason,
    },
    { new: true }
  );
};

// Get admin activity summary
export const getAdminActivitySummary = async (adminId, days = 30) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const activities = await AdminActivity.find({
    adminId,
    createdAt: { $gte: fromDate },
  }).sort({ createdAt: -1 });

  const summary = {
    totalActions: activities.length,
    actionsByType: {},
    actionsBySeverity: {},
    suspiciousActions: activities.filter(a => a.flagged).length,
  };

  activities.forEach(activity => {
    summary.actionsByType[activity.action] = (summary.actionsByType[activity.action] || 0) + 1;
    summary.actionsBySeverity[activity.severity] = (summary.actionsBySeverity[activity.severity] || 0) + 1;
  });

  return summary;
};

// Export activity logs for compliance
export const exportActivityLogs = async (filters = {}) => {
  const match = {};

  if (filters.adminId) match.adminId = filters.adminId;
  if (filters.action) match.action = filters.action;
  if (filters.severity) match.severity = filters.severity;
  if (filters.flagged) match.flagged = filters.flagged;
  if (filters.startDate || filters.endDate) {
    match.createdAt = {};
    if (filters.startDate) match.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) match.createdAt.$lte = new Date(filters.endDate);
  }

  return AdminActivity.find(match)
    .sort({ createdAt: -1 })
    .lean();
};
