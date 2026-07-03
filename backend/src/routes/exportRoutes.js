import express from 'express';
import {
  exportAnalyticsCSV,
  exportAnalyticsPDF,
  emailAnalyticsReport,
  getExportHistory,
  getScheduledReports,
  updateScheduledReport,
  deleteScheduledReport,
} from '../controllers/exportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Export endpoints - all require authentication
 */

/**
 * POST /api/analytics/export/csv
 * Export stream analytics to CSV format
 * Query params: streamId, startDate, endDate, format
 */
router.get('/csv', authenticateToken, exportAnalyticsCSV);

/**
 * GET /api/analytics/export/pdf
 * Export stream analytics to PDF format
 * Query params: streamId, startDate, endDate, format
 */
router.get('/pdf', authenticateToken, exportAnalyticsPDF);

/**
 * POST /api/analytics/export/email
 * Schedule email report
 * Body: { streamId, recipients, frequency, dayOfWeek?, dayOfMonth?, hour, minute, reportType, subject }
 */
router.post('/email', authenticateToken, emailAnalyticsReport);

/**
 * GET /api/analytics/exports
 * Get export history
 * Query params: streamId, limit, page
 */
router.get('/history', authenticateToken, getExportHistory);

/**
 * GET /api/analytics/schedules
 * Get scheduled reports for user
 * Query params: streamId, limit, page
 */
router.get('/schedules', authenticateToken, getScheduledReports);

/**
 * PUT /api/analytics/schedules/:scheduleId
 * Update scheduled report
 */
router.put('/schedules/:scheduleId', authenticateToken, updateScheduledReport);

/**
 * DELETE /api/analytics/schedules/:scheduleId
 * Delete scheduled report
 */
router.delete('/schedules/:scheduleId', authenticateToken, deleteScheduledReport);

export default router;
