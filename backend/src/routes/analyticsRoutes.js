import express from 'express';
import {
  getHostAnalytics,
  getClassAnalytics,
  getRevenueAnalytics,
  getStudentAnalytics,
  getRecommendationMetrics,
  generateAnalyticsReport,
  getEngagement,
  getAnalyticsDocuments,
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/host', authenticateToken, getHostAnalytics);
router.get('/class/:classId', authenticateToken, getClassAnalytics);
router.get('/revenue', authenticateToken, getRevenueAnalytics);
router.get('/student', authenticateToken, getStudentAnalytics);
router.get('/recommendations', authenticateToken, getRecommendationMetrics);
router.get('/report/:classId', authenticateToken, generateAnalyticsReport);
router.get('/engagement', getEngagement);
router.get('/docs', getAnalyticsDocuments);

export default router;
