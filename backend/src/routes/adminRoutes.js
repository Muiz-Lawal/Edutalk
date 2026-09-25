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
import { adminAuth, superAdminAuth, requireAdminRole } from '../middleware/adminAuth.js';
import { exportModerationLogs } from '../controllers/moderationController.js';
import bulkEmailService from '../services/bulkEmailService.js';
import User from '../models/User.js';
import { auditPrivilegedAction } from '../middleware/privilegedAudit.js';
import { getTelemetrySnapshot } from '../services/telemetryService.js';

const router = express.Router();

// All admin routes require admin authentication
router.use(adminAuth);
router.use(auditPrivilegedAction);
router.get('/telemetry', superAdminAuth, (req, res) => res.json(getTelemetrySnapshot()));

// Dashboard
router.get('/dashboard/stats', requireAdminRole('overview'), getDashboardStats);

// Users management
router.get('/users', requireAdminRole('users'), getAllUsers);
router.get('/users/:userId', requireAdminRole('users'), getUserDetails);
router.post('/users/:userId/suspend', requireAdminRole('users'), suspendUser);
router.post('/users/:userId/unsuspend', requireAdminRole('users'), unsuspendUser);
router.delete('/users/:userId', requireAdminRole('users'), deleteUser);
router.get('/users/:userId/activity', requireAdminRole('users'), getUserActivity);
router.post('/users/:userId/message', requireAdminRole('users'), sendAdminMessage);
router.get('/users/:userId/messages', requireAdminRole('users'), getAdminMessages);

// Admin logs
router.get('/logs', requireAdminRole('audit-logs'), getAdminLogs);

// Settings
router.get('/settings', requireAdminRole('settings'), getAdminSettings);
router.put('/settings/:key', requireAdminRole('settings'), updateAdminSetting);

// Admin Management (SuperAdmin Only)
router.get('/admins', superAdminAuth, getAllAdmins);
router.post('/admins/create', superAdminAuth, createAdminUser);
router.put('/admins/:adminId', superAdminAuth, updateAdminUser);
router.delete('/admins/:adminId', superAdminAuth, deleteAdminUser);
router.post('/admins/:adminId/change-password', superAdminAuth, changeAdminPassword);

// Analytics endpoints
router.get('/analytics/user-growth', requireAdminRole('analytics'), getUserGrowthTrend);
router.get('/analytics/revenue-trend', requireAdminRole('analytics'), getRevenueTrend);
router.get('/analytics/top-hosts', requireAdminRole('analytics'), getTopHosts);
router.get('/analytics/top-classes', requireAdminRole('analytics'), getTopClasses);
router.get('/analytics/engagement', requireAdminRole('analytics'), getEngagementMetrics);
router.get('/analytics/platform-stats', requireAdminRole('analytics'), getPlatformStats);

// Moderation endpoints (Phase 5D)
router.get('/moderation/queue', requireAdminRole('moderation'), getModerationQueue);
router.get('/moderation/queue/:contentId', requireAdminRole('moderation'), getModerationDetails);
router.post('/moderation/approve/:contentId', requireAdminRole('moderation'), approveModerationItem);
router.post('/moderation/reject/:contentId', requireAdminRole('moderation'), rejectModerationItem);
router.post('/moderation/remove-class/:contentId', requireAdminRole('moderation'), removeClass);
router.post('/moderation/suspend-class/:contentId', requireAdminRole('moderation'), suspendClass);
router.get('/moderation/history', requireAdminRole('moderation'), getModerationHistory);
router.get('/moderation/stats', requireAdminRole('moderation'), getModerationStats);
// Admin export for moderation logs (CSV/JSON)
router.get('/moderation/export', superAdminAuth, exportModerationLogs);

// Payment & Payouts endpoints (Phase 5E)
router.get('/payments/transactions', requireAdminRole('payments'), getTransactions);
router.get('/payments/transactions/:transactionId', requireAdminRole('payments'), getTransactionDetails);
router.get('/payments/revenue-by-host', requireAdminRole('payments'), getRevenueByHost);
router.get('/payments/revenue-trends', requireAdminRole('payments'), getRevenueTrends);
router.get('/payments/summary', requireAdminRole('payments'), getPaymentSummary);
router.get('/payments/commission-settings', requireAdminRole('payments'), getCommissionSettings);
router.put('/payments/commission-settings', requireAdminRole('payments'), updateCommissionSettings);
router.get('/payments/export', requireAdminRole('payments'), exportTransactions);

// Host Management endpoints (Phase 5F)
router.get('/hosts', requireAdminRole('hosts'), getAllHosts);
router.get('/hosts/pending', requireAdminRole('hosts'), getPendingHosts);
router.get('/hosts/performance/top-performers', requireAdminRole('hosts'), getTopPerformers);
router.get('/hosts/performance/at-risk', requireAdminRole('hosts'), getAtRiskHosts);
router.get('/hosts/:hostId', requireAdminRole('hosts'), getHostDetails);
router.get('/hosts/:hostId/performance', requireAdminRole('hosts'), getHostPerformance);
router.get('/hosts/:hostId/suspension-history', requireAdminRole('hosts'), getSuspensionHistory);
router.post('/hosts/:hostId/approve', requireAdminRole('hosts'), approveHost);
router.post('/hosts/:hostId/reject', requireAdminRole('hosts'), rejectHost);
router.post('/hosts/:hostId/suspend', requireAdminRole('hosts'), suspendHost);
router.post('/hosts/:hostId/unsuspend', requireAdminRole('hosts'), unsuspendHost);

// Legacy email routes (for backward compatibility)
router.post('/bulk-email/all', requireAdminRole('email-jobs'), async (req, res) => {
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
router.get('/settings/commission', requireAdminRole('settings'), getCommissionSettings);
router.put('/settings/commission', requireAdminRole('settings'), updateCommissionRate);
router.get('/settings/email-templates', requireAdminRole('settings'), getEmailTemplates);
router.put('/settings/email-templates/:templateId', requireAdminRole('settings'), updateEmailTemplate);
router.get('/settings/feature-flags', requireAdminRole('settings'), getFeatureFlags);
router.put('/settings/feature-flags/:featureId', requireAdminRole('settings'), toggleFeatureFlag);
router.get('/settings/audit-logs', requireAdminRole('audit-logs'), getAuditLogs);
router.post('/settings/audit-logs/export', requireAdminRole('audit-logs'), exportAuditLogs);

// Utilities
router.post('/utilities/run-badges', superAdminAuth, runBadgeEngine);
router.get('/utilities/email-jobs', requireAdminRole('email-jobs'), listEmailJobs);
router.get('/utilities/email-jobs/:jobId', requireAdminRole('email-jobs'), getEmailJobDetails);
router.post('/utilities/email-jobs/:jobId/retry', superAdminAuth, retryEmailJob);
router.post('/utilities/email-jobs/:jobId/send', superAdminAuth, sendEmailJobNow);
router.post('/utilities/email-jobs/retry-all', superAdminAuth, retryAllFailedEmailJobs);

export default router;