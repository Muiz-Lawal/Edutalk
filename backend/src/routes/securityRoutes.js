import express from 'express';
import { adminAuth, verify2FA } from '../middleware/adminAuth.js';
import User from '../models/User.js';
import {
  generateAdmin2FASecret,
  enable2FA,
  disable2FA,
  getAdminActiveSessions,
  logoutSession,
  logoutAllAdminSessions,
  getActivityLogs,
  getAdminFlaggedActivities,
  exportAdminActivityLogs,
  getAdminActivityTrends,
  changeAdminPassword,
} from '../controllers/securityController.js';
import {
  loginLimiter,
  sensitiveOperationLimiter,
} from '../utils/rateLimiters.js';

const router = express.Router();

// ==================== 2FA ROUTES ====================

// Generate 2FA secret
router.post('/2fa/generate', adminAuth, generateAdmin2FASecret);

// Enable 2FA
router.post('/2fa/enable', adminAuth, sensitiveOperationLimiter, enable2FA);

// Disable 2FA
router.post('/2fa/disable', adminAuth, sensitiveOperationLimiter, disable2FA);

// Verify 2FA token (for login)
router.post('/2fa/verify', verify2FA);

// ==================== PASSWORD ROUTES ====================

// Change password (for expired password or regular change) - Custom auth for tempToken support
router.post('/password/change', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}, sensitiveOperationLimiter, changeAdminPassword);

// ==================== SESSION ROUTES ====================

// Get active sessions
router.get('/sessions', adminAuth, getAdminActiveSessions);

// Logout specific session
router.post('/sessions/:sessionId/logout', adminAuth, logoutSession);

// Logout all sessions
router.post('/sessions/logout-all', adminAuth, logoutAllAdminSessions);

// ==================== ACTIVITY MONITORING ROUTES ====================

// Get activity logs (admin-only)
router.get('/activity/logs', adminAuth, getActivityLogs);

// Get flagged activities (admin-only)
router.get('/activity/flagged', adminAuth, getAdminFlaggedActivities);

// Export activity logs (admin-only)
router.get('/activity/export', adminAuth, exportAdminActivityLogs);

// Get activity trends (admin-only)
router.get('/activity/trends', adminAuth, getAdminActivityTrends);

export default router;
