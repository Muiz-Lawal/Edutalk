import express from 'express';
import * as discountController from '../controllers/discountController.js';
import { authenticateToken, authorizeHost } from '../middleware/auth.js';

const router = express.Router();

// All discount routes require authentication
router.use(authenticateToken);

// Discount CRUD routes
router.post('/', authorizeHost, discountController.createDiscount);
router.get('/', discountController.getDiscounts);
router.get('/:discountId', discountController.getDiscountById);
router.put('/:discountId', discountController.updateDiscount);
router.delete('/:discountId', discountController.deleteDiscount);

// Discount validation and analytics
router.post('/validate', discountController.validateDiscount);
router.get('/:discountId/analytics', discountController.getDiscountAnalytics);
router.get('/analytics/overall', discountController.getOverallDiscountAnalytics);

export default router;
