import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  createLiveStream,
  getLiveStream,
  updateLiveStream,
  startLiveStream,
  stopLiveStream,
  getStreamStats,
  getActiveStreams,
  getStreamAnalytics,
  updateViewerEngagement,
  getStreamViewers,
  joinStream,
  leaveStream,
} from '../controllers/liveController.js';
import {
  sendChatMessage,
  getChatMessages,
  deleteChatMessage,
  pinMessage,
  unpinMessage,
  getModerationStats,
} from '../controllers/chatController.js';

const router = express.Router();

// ==================== Stream Management ====================

// Create live stream (host only)
router.post('/', verifyToken, createLiveStream);

// Get specific stream details
router.get('/:id', getLiveStream);

// Update stream settings
router.put('/:id', verifyToken, updateLiveStream);

// Start streaming
router.post('/:id/start', verifyToken, startLiveStream);

// Stop streaming
router.post('/:id/stop', verifyToken, stopLiveStream);

// Get all active streams
router.get('/status/active', getActiveStreams);

// ==================== Statistics & Analytics ====================

// Get real-time stream stats
router.get('/:id/stats', getStreamStats);

// Get detailed analytics
router.get('/:id/analytics', getStreamAnalytics);

// Get stream viewers
router.get('/:id/viewers', getStreamViewers);

// Update viewer engagement metrics
router.post('/:liveStreamId/viewer-engagement', updateViewerEngagement);

// ==================== Viewer Tracking ====================

// Join stream (create viewer session)
router.post('/viewer/join', joinStream);

// Leave stream (end viewer session)
router.post('/viewer/leave', leaveStream);

// ==================== Chat Management ====================

// Send message
router.post('/:liveStreamId/chat', verifyToken, sendChatMessage);

// Get chat messages
router.get('/:liveStreamId/chat', getChatMessages);

// Delete message (moderator)
router.delete('/:liveStreamId/chat/:messageId', verifyToken, deleteChatMessage);

// Pin message (moderator)
router.post('/:liveStreamId/chat/:messageId/pin', verifyToken, pinMessage);

// Unpin message (moderator)
router.delete('/:liveStreamId/chat/:messageId/pin', verifyToken, unpinMessage);

// Get moderation stats
router.get('/:liveStreamId/moderation-stats', getModerationStats);

export default router;
