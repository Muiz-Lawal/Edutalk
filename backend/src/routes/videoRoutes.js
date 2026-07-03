import express from 'express';
import {
  createVideoRoom,
  getVideoRoomToken,
  joinVideoRoom,
  leaveVideoRoom,
  closeVideoRoom,
  getVideoRoomStats,
} from '../controllers/videoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/rooms', authenticateToken, createVideoRoom);
router.get('/rooms/:roomId/token', authenticateToken, getVideoRoomToken);
router.post('/rooms/join', authenticateToken, joinVideoRoom);
router.post('/rooms/leave', authenticateToken, leaveVideoRoom);
router.delete('/rooms/:roomId', authenticateToken, closeVideoRoom);
router.get('/rooms/:roomId/stats', authenticateToken, getVideoRoomStats);

export default router;
