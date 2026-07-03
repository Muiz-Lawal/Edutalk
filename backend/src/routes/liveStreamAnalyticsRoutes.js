const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getStreamAnalytics,
  getViewerTimeline,
  getEngagementMetrics,
  getQualityDistribution,
  getDemographics,
  getRetentionCurve,
} = require('../controllers/liveStreamAnalyticsController');

/**
 * GET /api/analytics/live/streams/:streamId
 * Get comprehensive stream analytics overview
 */
router.get('/live/streams/:streamId', verifyToken, getStreamAnalytics);

/**
 * GET /api/analytics/live/streams/:streamId/timeline
 * Get viewer count timeline (minute-by-minute)
 */
router.get('/live/streams/:streamId/timeline', verifyToken, getViewerTimeline);

/**
 * GET /api/analytics/live/streams/:streamId/engagement
 * Get engagement metrics and chat activity
 */
router.get('/live/streams/:streamId/engagement', verifyToken, getEngagementMetrics);

/**
 * GET /api/analytics/live/streams/:streamId/quality
 * Get quality distribution data
 */
router.get('/live/streams/:streamId/quality', verifyToken, getQualityDistribution);

/**
 * GET /api/analytics/live/streams/:streamId/demographics
 * Get viewer demographics (browser, OS, device)
 */
router.get(
  '/live/streams/:streamId/demographics',
  verifyToken,
  getDemographics
);

/**
 * GET /api/analytics/live/streams/:streamId/retention
 * Get retention curve (watch time drop-off)
 */
router.get('/live/streams/:streamId/retention', verifyToken, getRetentionCurve);

module.exports = router;
