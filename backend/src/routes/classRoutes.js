import express from 'express';
import {
  createClass,
  getClassById,
  getAllClasses,
  getHostClasses,
  updateClass,
  deleteClass,
} from '../controllers/classController.js';
import { getClassRecommendations } from '../controllers/recommendationController.js';
import { authenticateToken, optionalAuthMiddleware, authorizeHost } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, authorizeHost, createClass);
router.get('/recommendations', optionalAuthMiddleware, getClassRecommendations);
router.get('/', optionalAuthMiddleware, getAllClasses);
router.get('/my-classes', authenticateToken, authorizeHost, getHostClasses);
router.get('/:classId', optionalAuthMiddleware, getClassById);
router.put('/:classId', authenticateToken, authorizeHost, updateClass);
router.delete('/:classId', authenticateToken, authorizeHost, deleteClass);

export default router;
