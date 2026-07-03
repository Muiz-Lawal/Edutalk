import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.put('/:notificationId/read', authenticateToken, markNotificationAsRead);
router.put('/read-all', authenticateToken, markAllNotificationsAsRead);
router.delete('/:notificationId', authenticateToken, deleteNotification);

export default router;
