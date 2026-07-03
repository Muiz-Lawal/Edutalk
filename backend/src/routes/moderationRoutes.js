import express from 'express';
import {
  getModerationQueue,
  processModerationDecision,
  bulkProcessModeration,
  getModerationStats,
  getUserModerationHistory,
  reModerateContent,
  submitContentAppeal,
  getUserAppeals,
  getMyRejectedContent,
  reviewAppeal,
  getModerationQueueAdvanced,
  exportModerationLogs,
} from '../controllers/moderationController.js';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

// Middleware to check if user is admin/host
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isHost) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const router = express.Router();

// All moderation routes require authentication
router.use(authenticateToken);

// User appeal routes (no admin check needed)
router.post('/:logId/appeal', submitContentAppeal);
router.get('/appeals/my-appeals', getUserAppeals);
// List rejected content for current user (eligible to appeal)
router.get('/my/rejected', getMyRejectedContent);

// Admin-only routes
router.use(requireAdmin);

// Get moderation queue
router.get('/queue', getModerationQueue);

// Get moderation queue with advanced filters
router.get('/queue/advanced', getModerationQueueAdvanced);

// Get moderation statistics
router.get('/stats', getModerationStats);

// Process single moderation decision
router.post('/:id/decide', processModerationDecision);

// Bulk process moderation decisions
router.post('/bulk-decide', bulkProcessModeration);

// Get user's moderation history
router.get('/user/:userId/history', getUserModerationHistory);

// Re-moderate specific content
router.post('/:id/re-moderate', reModerateContent);

// Review user appeal
router.post('/:logId/appeal/review', reviewAppeal);

// Export moderation logs
router.get('/export/logs', exportModerationLogs);

export default router;