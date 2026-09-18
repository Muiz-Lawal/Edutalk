import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getWhiteboard, updateWhiteboard } from '../controllers/sessionWhiteboardController.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/:sessionId', getWhiteboard);
router.patch('/:sessionId', updateWhiteboard);
export default router;
