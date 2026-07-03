import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  suspendUser,
  unsuspendUser,
  deleteUser,
  getAdminLogs,
  getAdminSettings,
  updateAdminSetting,
  getAllAdmins,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  changeAdminPassword,
  getUserGrowthTrend,
  getRevenueTrend,
  getTopHosts,
  getTopClasses,
  getEngagementMetrics,
  getPlatformStats,
  getUserActivity,
  sendAdminMessage,
  getAdminMessages,
  getModerationQueue,
  getModerationDetails,
  approveModerationItem,
  rejectModerationItem,
  removeClass,
  suspendClass,
  getModerationHistory,
  getModerationStats,
  getTransactions,
  getTransactionDetails,
  getRevenueByHost,
  getRevenueTrends,
  getPaymentSummary,
  getCommissionSettings,
  updateCommissionSettings,
  exportTransactions,
  getAllHosts,
  getPendingHosts,
  getHostDetails,
  getHostPerformance,
  getTopPerformers,
  getAtRiskHosts,
  approveHost,
  rejectHost,
  suspendHost,
  unsuspendHost,
  getSuspensionHistory,
  updateCommissionRate,
  getEmailTemplates,
  updateEmailTemplate,
  getFeatureFlags,
  toggleFeatureFlag,
  getAuditLogs,
  exportAuditLogs,
} from '../controllers/adminController.js';
import { runBadgeEngine, listEmailJobs, retryEmailJob, retryAllFailedEmailJobs, getEmailJobDetails, sendEmailJobNow } from '../controllers/adminController_additions.js';
import { adminAuth, superAdminAuth } from '../middleware/adminAuth.js';
import { exportModerationLogs } from '../controllers/moderationController.js';
import bulkEmailService from '../services/bulkEmailService.js';
import User from '../models/User.js';

const router = express.Router();

// All admin routes require admin authentication
router.use(adminAuth);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Users management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.post('/users/:userId/suspend', suspendUser);
router.post('/users/:userId/unsuspend', unsuspendUser);
router.delete('/users/:userId', deleteUser);
router.get('/users/:userId/activity', getUserActivity);
router.post('/users/:userId/message', sendAdminMessage);
router.get('/users/:userId/messages', getAdminMessages);

// Admin logs
router.get('/logs', getAdminLogs);

// Settings
router.get('/settings', getAdminSettings);
router.put('/settings/:key', updateAdminSetting);

// Admin Management (SuperAdmin Only)
router.get('/admins', superAdminAuth, getAllAdmins);
router.post('/admins/create', superAdminAuth, createAdminUser);
router.put('/admins/:adminId', superAdminAuth, updateAdminUser);
router.delete('/admins/:adminId', superAdminAuth, deleteAdminUser);
router.post('/admins/:adminId/change-password', superAdminAuth, changeAdminPassword);

// Analytics endpoints
router.get('/analytics/user-growth', getUserGrowthTrend);
router.get('/analytics/revenue-trend', getRevenueTrend);
router.get('/analytics/top-hosts', getTopHosts);
router.get('/analytics/top-classes', getTopClasses);
router.get('/analytics/engagement', getEngagementMetrics);
router.get('/analytics/platform-stats', getPlatformStats);

// Moderation endpoints (Phase 5D)
router.get('/moderation/queue', getModerationQueue);
router.get('/moderation/queue/:contentId', getModerationDetails);
router.post('/moderation/approve/:contentId', approveModerationItem);
router.post('/moderation/reject/:contentId', rejectModerationItem);
router.post('/moderation/remove-class/:contentId', removeClass);
router.post('/moderation/suspend-class/:contentId', suspendClass);
router.get('/moderation/history', getModerationHistory);
router.get('/moderation/stats', getModerationStats);
// Admin export for moderation logs (CSV/JSON)
router.get('/moderation/export', superAdminAuth, exportModerationLogs);

// Payment & Payouts endpoints (Phase 5E)
router.get('/payments/transactions', getTransactions);
router.get('/payments/transactions/:transactionId', getTransactionDetails);
router.get('/payments/revenue-by-host', getRevenueByHost);
router.get('/payments/revenue-trends', getRevenueTrends);
router.get('/payments/summary', getPaymentSummary);
router.get('/payments/commission-settings', getCommissionSettings);
router.put('/payments/commission-settings', updateCommissionSettings);
router.get('/payments/export', exportTransactions);

// Host Management endpoints (Phase 5F)
router.get('/hosts', getAllHosts);
router.get('/hosts/pending', getPendingHosts);
router.get('/hosts/performance/top-performers', getTopPerformers);
router.get('/hosts/performance/at-risk', getAtRiskHosts);
router.get('/hosts/:hostId', getHostDetails);
router.get('/hosts/:hostId/performance', getHostPerformance);
router.get('/hosts/:hostId/suspension-history', getSuspensionHistory);
router.post('/hosts/:hostId/approve', approveHost);
router.post('/hosts/:hostId/reject', rejectHost);
router.post('/hosts/:hostId/suspend', suspendHost);
router.post('/hosts/:hostId/unsuspend', unsuspendHost);

// Legacy email routes (for backward compatibility)
router.post('/bulk-email/all', async (req, res) => {
  try {
    const { subject, content, userType, excludeUnverified, forceSend } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ message: 'Subject and content are required' });
    }

    const results = await bulkEmailService.sendToAllUsers(subject, content, {
      userType: userType || 'all',
      excludeUnverified: excludeUnverified !== false,
      forceSend: forceSend || false,
    });

    res.json({
      message: 'Bulk email sent successfully',
      results,
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Settings & Configuration endpoints (Phase 5G)
router.get('/settings/commission', getCommissionSettings);
router.put('/settings/commission', updateCommissionRate);
router.get('/settings/email-templates', getEmailTemplates);
router.put('/settings/email-templates/:templateId', updateEmailTemplate);
router.get('/settings/feature-flags', getFeatureFlags);
router.put('/settings/feature-flags/:featureId', toggleFeatureFlag);
router.get('/settings/audit-logs', getAuditLogs);
router.post('/settings/audit-logs/export', exportAuditLogs);

// Utilities
router.post('/utilities/run-badges', superAdminAuth, runBadgeEngine);
router.get('/utilities/email-jobs', adminAuth, listEmailJobs);
router.get('/utilities/email-jobs/:jobId', adminAuth, getEmailJobDetails);
router.post('/utilities/email-jobs/:jobId/retry', superAdminAuth, retryEmailJob);
router.post('/utilities/email-jobs/:jobId/send', superAdminAuth, sendEmailJobNow);
router.post('/utilities/email-jobs/retry-all', superAdminAuth, retryAllFailedEmailJobs);

export default router;