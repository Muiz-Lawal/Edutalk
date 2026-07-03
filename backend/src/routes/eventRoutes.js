import express from 'express';
import { registerEvent, registerEventsBatch } from '../controllers/eventController.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimiter from '../middleware/rateLimiter.js';
import validateEvent from '../middleware/validateEvent.js';

const router = express.Router();

// Public event recording (client-side) - allow anonymous events
router.post('/', rateLimiter(), validateEvent, registerEvent);

// Batch events (clients may call this authenticated)
router.post('/batch', authenticateToken, registerEventsBatch);

export default router;
