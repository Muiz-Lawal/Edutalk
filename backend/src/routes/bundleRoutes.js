import express from 'express';
import * as bundleController from '../controllers/bundleController.js';
import { authenticateToken, authorizeHost } from '../middleware/auth.js';

const router = express.Router();

// All bundle routes require authentication
router.use(authenticateToken);

// Bundle CRUD routes
router.post('/', authorizeHost, bundleController.createBundle);
router.get('/', bundleController.getBundles);
router.get('/my-bundles', authorizeHost, bundleController.getHostBundles);
router.get('/:bundleId', bundleController.getBundleById);
router.put('/:bundleId', authorizeHost, bundleController.updateBundle);
router.delete('/:bundleId', authorizeHost, bundleController.deleteBundle);

// Bundle analytics
router.get('/:bundleId/analytics', authorizeHost, bundleController.getBundleAnalytics);

// Dynamic pricing routes
router.get('/:bundleId/analyze-pricing', authorizeHost, bundleController.analyzeBundlePricing);
router.post('/:bundleId/optimize-pricing', authorizeHost, bundleController.optimizeBundlePricing);
router.post('/:bundleId/flash-sale', authorizeHost, bundleController.createFlashSale);
router.post('/:bundleId/seasonal-pricing', authorizeHost, bundleController.setSeasonalPricing);
router.get('/:bundleId/personalized-pricing', bundleController.getPersonalizedPricing);
router.post('/:bundleId/ab-test', authorizeHost, bundleController.createPricingABTest);
router.get('/:bundleId/current-price', bundleController.getCurrentPrice);

export default router;
