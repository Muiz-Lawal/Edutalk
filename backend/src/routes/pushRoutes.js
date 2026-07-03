import express from 'express';
import { pushController } from '../controllers/pushController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// User routes (protected)
router.post('/subscribe', authenticateToken, pushController.subscribe);
router.post('/unsubscribe', authenticateToken, pushController.unsubscribe);
router.post('/send-test', authenticateToken, pushController.sendTest);
router.get('/subscriptions', authenticateToken, pushController.listSubscriptions);
router.post('/notify-user', authenticateToken, pushController.notifyUser);

// Admin routes
router.post('/broadcast', authenticateToken, pushController.broadcast);

export default router;
