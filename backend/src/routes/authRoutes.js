import express from 'express';
import { register, login, getProfile, getHostContext, updateProfile, updateHostOnboarding, changePassword, upgradeToHost, adminLogin, adminLogout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { loginLimiter } from '../utils/rateLimiters.js';
import { requestPasswordReset, resendCode, resetPassword, verifyEmail } from '../controllers/emailConfirmationController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendCode);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticateToken, getProfile);
router.get('/host-context', authenticateToken, getHostContext);
router.put('/profile', authenticateToken, updateProfile);
router.patch('/host-onboarding', authenticateToken, updateHostOnboarding);
router.post('/change-password', authenticateToken, changePassword);
router.post('/upgrade-to-host', authenticateToken, upgradeToHost);

// Admin authentication
router.post('/admin/login', loginLimiter, adminLogin);
router.post('/admin/logout', adminAuth, adminLogout);

export default router;
