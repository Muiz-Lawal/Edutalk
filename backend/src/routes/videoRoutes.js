import express from 'express';
import {
  createVideoRoom,
  getVideoRoomToken,
  joinVideoRoom,
  leaveVideoRoom,
  closeVideoRoom,
  getVideoRoomStats,
  getCommandCenter,
  updateRoomControl,
  getRoomState,
  getSessionSummary,
  exportAttendance,
  getBreakouts,
  updateBreakouts,
} from '../controllers/videoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/rooms', authenticateToken, createVideoRoom);
router.get('/rooms/:roomId/token', authenticateToken, getVideoRoomToken);
router.post('/rooms/join', authenticateToken, joinVideoRoom);
router.post('/rooms/leave', authenticateToken, leaveVideoRoom);
router.delete('/rooms/:roomId', authenticateToken, closeVideoRoom);
router.get('/rooms/:roomId/stats', authenticateToken, getVideoRoomStats);
router.get('/rooms/:roomId/command-center', authenticateToken, getCommandCenter);
router.get('/rooms/:roomId/state', authenticateToken, getRoomState);
router.get('/rooms/:roomId/summary', authenticateToken, getSessionSummary);
router.get('/rooms/:roomId/attendance.csv', authenticateToken, exportAttendance);
router.patch('/rooms/:roomId/control', authenticateToken, updateRoomControl);
router.get('/rooms/:roomId/breakouts', authenticateToken, getBreakouts);
router.patch('/rooms/:roomId/breakouts', authenticateToken, updateBreakouts);

export default router;
