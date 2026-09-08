import express from 'express';
import {
  createPaymentIntent,
  createCheckoutQuote,
  confirmPayment,
  getPaymentHistory,
  processRefund,
  getCart,
  mergeCart,
} from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-intent', authenticateToken, createPaymentIntent);
router.post('/batch', authenticateToken, createPaymentIntent);
router.get('/cart', authenticateToken, getCart);
router.post('/cart/merge', authenticateToken, mergeCart);
router.post('/quote', authenticateToken, createCheckoutQuote);
router.post('/checkout/quote', authenticateToken, createCheckoutQuote);
router.get('/quote', createCheckoutQuote);
router.post('/confirm', authenticateToken, confirmPayment);
router.get('/history', authenticateToken, getPaymentHistory);
router.post('/refund', authenticateToken, processRefund);

export default router;
