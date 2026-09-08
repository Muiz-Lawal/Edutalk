import express from 'express';
import {
  createClass,
  getClassById,
  getAllClasses,
  getHostClasses,
  updateClass,
  deleteClass,
  getClassSessions,
  addBonusSession,
  cancelClassSession,
  notifyRunningLate,
  updateSessionMeetingUrl,
  setPreviewSession,
  getOwnedClass,
  updateClassPrice,
  duplicateClass,
  archiveClass,
  updateVacationMode,
} from '../controllers/classController.js';
import { getClassRecommendations } from '../controllers/recommendationController.js';
import { authenticateToken, optionalAuthMiddleware, authorizeHost } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeHost, createClass);
router.get('/recommendations', optionalAuthMiddleware, getClassRecommendations);
router.get('/', optionalAuthMiddleware, getAllClasses);
router.get('/my-classes', authenticateToken, authorizeHost, getHostClasses);
router.get('/manage/:classId', authenticateToken, authorizeHost, getOwnedClass);
router.post('/manage/:classId/price', authenticateToken, authorizeHost, updateClassPrice);
router.post('/manage/:classId/duplicate', authenticateToken, authorizeHost, duplicateClass);
router.post('/manage/:classId/archive', authenticateToken, authorizeHost, archiveClass);
router.post('/manage/:classId/vacation', authenticateToken, authorizeHost, updateVacationMode);
router.get('/:classId/sessions', authenticateToken, authorizeHost, getClassSessions);
router.post('/:classId/sessions', authenticateToken, authorizeHost, addBonusSession);
router.post('/sessions/:sessionId/cancel', authenticateToken, authorizeHost, cancelClassSession);
router.post('/sessions/:sessionId/running-late', authenticateToken, authorizeHost, notifyRunningLate);
router.put('/sessions/:sessionId/meeting-url', authenticateToken, authorizeHost, updateSessionMeetingUrl);
router.post('/sessions/:sessionId/preview', authenticateToken, authorizeHost, setPreviewSession);
router.get('/:classId', optionalAuthMiddleware, getClassById);
router.put('/:classId', authenticateToken, authorizeHost, updateClass);
router.delete('/:classId', authenticateToken, authorizeHost, deleteClass);

export default router;
