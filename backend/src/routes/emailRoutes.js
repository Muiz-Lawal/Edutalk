import express from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  createEmailJob,
  getEmailJobs,
  getEmailJob,
  retryEmailJob,
  deleteEmailJob,
  sendBulkEmails,
  getEmailStats,
  getUserEmailHistory,
  previewTemplate,
  processEmailQueue,
  cleanupOldEmails,
} from '../controllers/emailController.js';

const router = express.Router();

/**
 * Template Routes
 */
router.post('/templates', authenticateToken, authorizeAdmin, createTemplate);
router.get('/templates', authenticateToken, getTemplates);
router.get('/templates/:templateId', authenticateToken, getTemplate);
router.put('/templates/:templateId', authenticateToken, authorizeAdmin, updateTemplate);
router.delete('/templates/:templateId', authenticateToken, authorizeAdmin, deleteTemplate);
router.post('/templates/preview', authenticateToken, previewTemplate);

/**
 * Email Job Routes
 */
router.post('/jobs', authenticateToken, createEmailJob);
router.get('/jobs', authenticateToken, getEmailJobs);
router.get('/jobs/:jobId', authenticateToken, getEmailJob);
router.post('/jobs/:jobId/retry', authenticateToken, retryEmailJob);
router.delete('/jobs/:jobId', authenticateToken, deleteEmailJob);

/**
 * Bulk Operations
 */
router.post('/bulk-send', authenticateToken, authorizeAdmin, sendBulkEmails);

/**
 * Statistics
 */
router.get('/stats', authenticateToken, getEmailStats);
router.get('/my-history', authenticateToken, getUserEmailHistory);

/**
 * Admin Operations
 */
router.post('/admin/process-queue', authenticateToken, authorizeAdmin, processEmailQueue);
router.post('/admin/cleanup', authenticateToken, authorizeAdmin, cleanupOldEmails);

export default router;
