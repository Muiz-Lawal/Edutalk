import express from 'express';
import {
  startRecording,
  completeRecording,
  getRecording,
  getRecordingList,
  deleteRecording,
  getRecordingStats,
  playRecording,
  updatePlaybackProgress,
  getStudentRecordingLibrary,
  uploadRecording,
  publishRecording,
  updateClassRecordingSettings,
  getHostRecordings,
  setRecordingVisibility,
} from '../controllers/recordingController.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({
  dest: process.env.RECORDING_UPLOAD_DIR || 'tmp/recordings',
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, file.mimetype.startsWith('video/')),
});
const uploadVideo = (req, res, next) => upload.single('file')(req, res, (error) => {
  if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ code: 'file_too_large', message: 'That file is too large — maximum 2 GB.' });
  if (error) return res.status(400).json({ message: 'Upload a valid video file' });
  return next();
});

router.post('/start', authenticateToken, startRecording);
router.post('/complete', authenticateToken, completeRecording);
router.post('/play/:recordingId', authenticateToken, playRecording);
// Student-facing REST shape; retain the legacy route above for existing clients.
router.post('/:recordingId/play', authenticateToken, playRecording);
router.post('/:recordingId/progress', authenticateToken, updatePlaybackProgress);
router.get('/library', authenticateToken, getStudentRecordingLibrary);
router.post('/upload', authenticateToken, uploadVideo, uploadRecording);
router.post('/:recordingId/publish', authenticateToken, publishRecording);
router.put('/class/:classId/settings', authenticateToken, updateClassRecordingSettings);
router.get('/class/:classId', authenticateToken, getHostRecordings);
router.patch('/:recordingId/visibility', authenticateToken, setRecordingVisibility);
router.get('/:recordingId', authenticateToken, getRecording);
router.get('/list/all', authenticateToken, getRecordingList);
router.delete('/:recordingId', authenticateToken, deleteRecording);
router.get('/:recordingId/stats', authenticateToken, getRecordingStats);

export default router;
