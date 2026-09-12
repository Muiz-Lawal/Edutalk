import express from 'express';
import { getHostContext } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/host-context', authenticateToken, getHostContext);

export default router;
