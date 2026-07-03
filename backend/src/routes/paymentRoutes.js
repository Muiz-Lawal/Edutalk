import express from 'express';
import { createPaymentIntent, confirmPayment, getPaymentHistory } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-intent', authenticateToken, createPaymentIntent);
router.post('/confirm', authenticateToken, confirmPayment);
router.get('/history', authenticateToken, getPaymentHistory);

export default router;
