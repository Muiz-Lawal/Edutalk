import express from 'express';
import { register, login, getProfile, updateProfile, upgradeToHost, adminLogin, adminLogout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { loginLimiter } from '../utils/rateLimiters.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/upgrade-to-host', authenticateToken, upgradeToHost);

// Admin authentication
router.post('/admin/login', loginLimiter, adminLogin);
router.post('/admin/logout', adminAuth, adminLogout);

export default router;
