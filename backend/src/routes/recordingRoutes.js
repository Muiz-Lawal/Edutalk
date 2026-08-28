import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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

// Ensure uploads directory exists
const uploadDir = path.resolve(process.cwd(), 'uploads', 'recordings');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

// Public upload endpoint for POC (multipart/form-data)
router.post('/upload', upload.single('recording'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No recording file provided' });
  return res.json({ message: 'uploaded', filename: req.file.filename, path: `/uploads/recordings/${req.file.filename}` });
});

// Existing authenticated routes
router.post('/start', authenticateToken, startRecording);
router.post('/complete', authenticateToken, completeRecording);
router.get('/:recordingId', authenticateToken, getRecording);
router.get('/list/all', authenticateToken, getRecordingList);
router.delete('/:recordingId', authenticateToken, deleteRecording);
router.get('/:recordingId/stats', authenticateToken, getRecordingStats);

export default router;
