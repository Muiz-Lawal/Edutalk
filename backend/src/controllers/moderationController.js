import ModerationLog from '../models/ModerationLog.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import aiModerationService from '../services/aiModerationService.js';
import { sendEmail } from '../utils/email.js';

// Get moderation queue for admin review
export const getModerationQueue = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending_review', contentType } = req.query;

    const query = { status };
    if (contentType) {
      query.contentType = contentType;
    }

    const logs = await ModerationLog.find(query)
      .populate('userId', 'firstName lastName email profileImage')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ModerationLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Process moderation decision
export const processModerationDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body;
    const adminId = req.user.id;

    if (!['approved', 'rejected', 'escalated'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }

    const log = await ModerationLog.findById(id);
    if (!log) {
      return res.status(404).json({ message: 'Moderation log not found' });
    }

    if (log.status !== 'pending_review') {
      return res.status(400).json({ message: 'Item has already been reviewed' });
    }

    // Update the moderation log
    log.status = decision === 'approved' ? 'reviewed_approved' : 'reviewed_rejected';
    log.reviewedBy = adminId;
    log.reviewedAt = new Date();
    log.reviewNotes = reason;
    log.action = decision;
    await log.save();

    // Handle the decision for the original content
    await handleModerationDecision(log, decision);

    // Send notification email for rejections
    if (decision === 'rejected') {
      try {
        const user = await User.findById(log.userId);
        if (user) {
          await sendEmail({
            to: user.email,
            subject: 'Content Review Decision',
            template: 'content_rejected',
            data: {
              userName: user.firstName,
              contentType: log.contentType.replace(/_/g, ' '),
              reason: reason || 'This content violates our community guidelines',
              categories: Object.keys(log.categories || {}).filter(k => log.categories[k]).join(', '),
            },
          });
        }
      } catch (emailError) {
        console.warn('Failed to send rejection email:', emailError.message);
      }
    }

    res.json({
      message: `Content ${decision} successfully`,
      log,
    });
  } catch (error) {
    console.error('Error processing moderation decision:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Bulk process multiple moderation decisions
export const bulkProcessModeration = async (req, res) => {
  try {
    const { decisions } = req.body; // Array of { id, decision, reason }
    const adminId = req.user.id;

    const results = [];

    for (const { id, decision, reason } of decisions) {
      try {
        const log = await ModerationLog.findById(id);
        if (!log || log.status !== 'pending_review') {
          results.push({ id, success: false, error: 'Invalid or already processed item' });
          continue;
        }

        log.status = decision === 'approved' ? 'reviewed_approved' : 'reviewed_rejected';
        log.reviewedBy = adminId;
        log.reviewedAt = new Date();
        log.reviewNotes = reason;
        log.action = decision;
        await log.save();

        await handleModerationDecision(log, decision);

        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    res.json({
      message: 'Bulk moderation processing completed',
      results,
    });
  } catch (error) {
    console.error('Error in bulk moderation processing:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get moderation statistics
export const getModerationStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query; // 1d, 7d, 30d

    const periodMap = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
    };

    const days = periodMap[period] || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await ModerationLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          flagged: { $sum: { $cond: ['$flagged', 1, 0] } },
          autoApproved: { $sum: { $cond: [{ $eq: ['$status', 'auto_approved'] }, 1, 0] } },
          autoBlocked: { $sum: { $cond: [{ $eq: ['$status', 'auto_blocked'] }, 1, 0] } },
          reviewedApproved: { $sum: { $cond: [{ $eq: ['$status', 'reviewed_approved'] }, 1, 0] } },
          reviewedRejected: { $sum: { $cond: [{ $eq: ['$status', 'reviewed_rejected'] }, 1, 0] } },
          pendingReview: { $sum: { $cond: [{ $eq: ['$status', 'pending_review'] }, 1, 0] } },
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      flagged: 0,
      autoApproved: 0,
      autoBlocked: 0,
      reviewedApproved: 0,
      reviewedRejected: 0,
      pendingReview: 0,
    };

    // Calculate rates
    const flaggedRate = result.total > 0 ? (result.flagged / result.total * 100).toFixed(1) : 0;
    const humanReviewRate = result.total > 0 ? ((result.reviewedApproved + result.reviewedRejected) / result.total * 100).toFixed(1) : 0;

    res.json({
      period,
      totalContent: result.total,
      flaggedContent: result.flagged,
      flaggedRate: `${flaggedRate}%`,
      humanReviewRate: `${humanReviewRate}%`,
      breakdown: {
        autoApproved: result.autoApproved,
        autoBlocked: result.autoBlocked,
        reviewedApproved: result.reviewedApproved,
        reviewedRejected: result.reviewedRejected,
        pendingReview: result.pendingReview,
      },
    });
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's moderation history (admin-facing)
export const getUserModerationHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const logs = await ModerationLog.find({ userId })
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ModerationLog.countDocuments({ userId });

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching user moderation history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user's rejected content eligible for appeal
export const getMyRejectedContent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const logs = await ModerationLog.find({ userId, status: 'reviewed_rejected' })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ModerationLog.countDocuments({ userId, status: 'reviewed_rejected' });

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching rejected content for user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Re-moderate content (for testing or re-evaluation)
export const reModerateContent = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await ModerationLog.findById(id);
    if (!log) {
      return res.status(404).json({ message: 'Moderation log not found' });
    }

    // Re-run moderation
    const moderationResult = await aiModerationService.moderateContent(
      log.content,
      {
        type: log.contentType.replace('_', ''),
        userId: log.userId,
      }
    );

    // Update the log
    log.flagged = moderationResult.isFlagged;
    log.categories = moderationResult.categories;
    log.confidence = moderationResult.confidence;
    log.moderationMethod = 'openai'; // Assuming re-moderation uses OpenAI
    log.updatedAt = new Date();

    // Determine new status
    if (moderationResult.isFlagged) {
      log.status = 'pending_review';
      log.action = moderationResult.recommendation;
    } else {
      log.status = 'auto_approved';
      log.action = 'approved';
    }

    await log.save();

    res.json({
      message: 'Content re-moderated successfully',
      log,
      newResult: moderationResult,
    });
  } catch (error) {
    console.error('Error re-moderating content:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to handle moderation decisions
async function handleModerationDecision(log, decision) {
  try {
    switch (log.contentType) {
      case 'review':
        await handleReviewDecision(log, decision);
        break;
      case 'chat_message':
        await handleChatDecision(log, decision);
        break;
      case 'profile':
        await handleProfileDecision(log, decision);
        break;
      default:
        console.log(`No specific handling for content type: ${log.contentType}`);
    }
  } catch (error) {
    console.error('Error handling moderation decision:', error);
  }
}

// Handle review moderation decisions
async function handleReviewDecision(log, decision) {
  const review = await Review.findOne({ userId: log.userId, classId: log.context.classId });

  if (review) {
    if (decision === 'rejected') {
      // Hide the review
      review.approved = false;
      review.flagged = true;
      review.flagReason = log.reviewNotes || 'Content policy violation';
    } else if (decision === 'approved') {
      // Approve the review
      review.approved = true;
      review.flagged = false;
      review.flagReason = null;
    }
    await review.save();
  }
}

// Handle chat message decisions
async function handleChatDecision(log, decision) {
  // For chat messages, we mainly log the decision
  // The message was already filtered at the socket level
  console.log(`Chat message ${decision}: ${log.contentId}`);
}

// Handle profile content decisions
async function handleProfileDecision(log, decision) {
  // Could implement profile content moderation here
  console.log(`Profile content ${decision}: ${log.contentId}`);
}

// Submit content appeal
export const submitContentAppeal = async (req, res) => {
  try {
    const { logId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const log = await ModerationLog.findById(logId);
    if (!log) {
      return res.status(404).json({ message: 'Moderation log not found' });
    }

    // Only the content creator can appeal
    if (log.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You can only appeal your own content' });
    }

    // Only rejected content can be appealed
    if (log.status !== 'reviewed_rejected') {
      return res.status(400).json({ message: 'Only rejected content can be appealed' });
    }

    // Prevent duplicate appeals
    if (log.appeal && log.appeal.status === 'pending') {
      return res.status(400).json({ message: 'An appeal is already pending for this content' });
    }

    // Submit appeal
    log.appeal = {
      status: 'pending',
      reason,
      submittedAt: new Date(),
    };

    await log.save();

    // Send appeal confirmation email
    try {
      const user = await User.findById(userId);
      if (user) {
        await sendEmail({
          to: user.email,
          subject: 'Appeal Received',
          template: 'appeal_confirmation',
          data: {
            userName: user.firstName,
            contentType: log.contentType.replace(/_/g, ' '),
            originalReason: log.reviewNotes,
          },
        });
      }
    } catch (emailError) {
      console.warn('Failed to send appeal confirmation email:', emailError.message);
    }

    res.json({
      message: 'Appeal submitted successfully',
      appeal: log.appeal,
    });
  } catch (error) {
    console.error('Error submitting appeal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's appeals
export const getUserAppeals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = {
      userId,
      'appeal.status': { $ne: 'none' },
    };

    if (status) {
      query['appeal.status'] = status;
    }

    const logs = await ModerationLog.find(query)
      .sort({ 'appeal.submittedAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ModerationLog.countDocuments(query);

    res.json({
      appeals: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching user appeals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Review user appeal (admin)
export const reviewAppeal = async (req, res) => {
  try {
    const { logId } = req.params;
    const { decision, notes } = req.body;
    const adminId = req.user.id;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }

    const log = await ModerationLog.findById(logId);
    if (!log || !log.appeal || log.appeal.status !== 'pending') {
      return res.status(404).json({ message: 'No pending appeal found' });
    }

    // Update appeal
    log.appeal.status = decision;
    log.appeal.reviewedBy = adminId;
    log.appeal.reviewedAt = new Date();
    log.appeal.appealNotes = notes;

    // If appeal approved, flip the original decision
    if (decision === 'approved') {
      log.status = 'reviewed_approved';
      log.action = 'approved';
    }

    await log.save();

    // Send appeal decision email
    try {
      const user = await User.findById(log.userId);
      if (user) {
        await sendEmail({
          to: user.email,
          subject: `Appeal ${decision === 'approved' ? 'Approved' : 'Denied'}`,
          template: 'appeal_decision',
          data: {
            userName: user.firstName,
            decision: decision === 'approved' ? 'approved' : 'denied',
            notes,
          },
        });
      }
    } catch (emailError) {
      console.warn('Failed to send appeal decision email:', emailError.message);
    }

    res.json({
      message: `Appeal ${decision} successfully`,
      appeal: log.appeal,
    });
  } catch (error) {
    console.error('Error reviewing appeal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get moderation queue with advanced filters
export const getModerationQueueAdvanced = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'pending_review',
      contentType,
      severity,
      dateFrom,
      dateTo,
      userId,
      appealStatus,
    } = req.query;

    const query = { status };

    if (contentType) {
      query.contentType = contentType;
    }

    if (severity) {
      query.severity = severity;
    }

    if (userId) {
      query.userId = userId;
    }

    if (appealStatus && appealStatus !== 'none') {
      query['appeal.status'] = appealStatus;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    const logs = await ModerationLog.find(query)
      .populate('userId', 'firstName lastName email profileImage')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ModerationLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching moderation queue with filters:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export moderation logs
export const exportModerationLogs = async (req, res) => {
  try {
    const {
      format = 'csv', // csv or json
      status,
      contentType,
      severity,
      dateFrom,
      dateTo,
      userId,
      appealStatus,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (contentType) query.contentType = contentType;
    if (severity) query.severity = severity;
    if (userId) query.userId = userId;
    if (appealStatus && appealStatus !== 'none') {
      query['appeal.status'] = appealStatus;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const logs = await ModerationLog.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName')
      .lean();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="moderation_logs.json"');
      res.json(logs);
    } else {
      // CSV format
      const csv = generateCSV(logs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="moderation_logs.csv"');
      res.send(csv);
    }
  } catch (error) {
    console.error('Error exporting moderation logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to generate CSV
function generateCSV(logs) {
  const headers = [
    'Content ID',
    'Content Type',
    'User',
    'Email',
    'Content',
    'Flagged',
    'Categories',
    'Severity',
    'Status',
    'Decision',
    'Reviewed By',
    'Reviewed At',
    'Notes',
    'Appeal Status',
    'Created At',
  ];

  const rows = logs.map(log => [
    log.contentId,
    log.contentType,
    log.userId?.firstName + ' ' + log.userId?.lastName || 'Unknown',
    log.userId?.email || 'N/A',
    `"${log.content.replace(/"/g, '""')}"`, // Escape quotes in content
    log.flagged ? 'Yes' : 'No',
    Object.keys(log.categories || {})
      .filter(k => log.categories[k])
      .join('; '),
    log.severity || 'N/A',
    log.status,
    log.action,
    log.reviewedBy?.firstName + ' ' + log.reviewedBy?.lastName || 'N/A',
    log.reviewedAt ? new Date(log.reviewedAt).toISOString() : 'N/A',
    `"${log.reviewNotes ? log.reviewNotes.replace(/"/g, '""') : ''}"`,
    log.appeal?.status || 'none',
    new Date(log.createdAt).toISOString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}