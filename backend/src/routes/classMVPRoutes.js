import express from 'express';
import {
  createClass,
  getClasses,
  getClassById,
  getHostClasses,
  updateClass,
  deleteClass,
  getClassSchedule,
  calculatePricing,
  getCategories,
} from '../controllers/classMVPController.js';
import { authenticateToken, authorizeHost } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/categories', getCategories);
router.get('/pricing', calculatePricing);
router.get('/', getClasses);
router.get('/:id', getClassById);
router.get('/:id/schedule', getClassSchedule);

// Host-only routes
router.post('/', authenticateToken, authorizeHost, createClass);
router.get('/host/my-classes', authenticateToken, authorizeHost, getHostClasses);
router.put('/:id', authenticateToken, authorizeHost, updateClass);
router.delete('/:id', authenticateToken, authorizeHost, deleteClass);

export default router;
