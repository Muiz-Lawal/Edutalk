import express from 'express';
import {
  startRecording,
  completeRecording,
  getRecording,
  getRecordingList,
  deleteRecording,
  getRecordingStats,
} from '../controllers/recordingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/start', authenticateToken, startRecording);
router.post('/complete', authenticateToken, completeRecording);
router.get('/:recordingId', authenticateToken, getRecording);
router.get('/list/all', authenticateToken, getRecordingList);
router.delete('/:recordingId', authenticateToken, deleteRecording);
router.get('/:recordingId/stats', authenticateToken, getRecordingStats);

export default router;
