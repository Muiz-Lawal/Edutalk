import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getPointsBalance,
  getPointsHistory,
  awardPoints,
} from '../controllers/pointsController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/balance/:userId?', getPointsBalance);
router.get('/history/:userId?', getPointsHistory);
router.post('/award', awardPoints);

export default router;
