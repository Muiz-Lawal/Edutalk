import User from '../models/User.js';
import AdminSession from '../models/AdminSession.js';
import AdminActivity from '../models/AdminActivity.js';
import { 
  generate2FASecret, 
  verify2FAToken, 
  generateBackupCodes 
} from '../utils/twoFactorAuth.js';
import { validatePassword, isPasswordExpired } from '../utils/passwordValidator.js';
import { 
  send2FASetupEmail, 
  sendSuspiciousActivityEmail,
  sendPasswordChangedEmail,
} from '../utils/emailNotifications.js';
import { 
  createAdminSession,
  getActiveSessions as getSessionsForUser,
  logoutAllSessions as logoutAllUserSessions,
} from '../utils/sessionManager.js';
import { logActivity, getActivityTrends, getFlaggedActivities, exportActivityLogs as exportLogs } from '../utils/activityLogger.js';

// ==================== 2FA SETUP ====================

// Generate 2FA secret
export const generateAdmin2FASecret = async (req, res) => {
  try {
    const user = req.user;

    if (user.twoFAEnabled) {
      return res.status(400).json({ error: '2FA is already enabled for this account' });
    }

    const { secret, qrCode } = await generate2FASecret(user.email);

    res.json({
      secret,
      qrCode,
      message: 'Scan this QR code with your authenticator app',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Enable 2FA
export const enable2FA = async (req, res) => {
  try {
    const { secret, verificationCode } = req.body;
    const user = req.user;

    if (!secret || !verificationCode) {
      return res.status(400).json({ error: 'Secret and verification code required' });
    }

    // Verify the code
    const isValid = verify2FAToken(secret, verificationCode);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Update user
    user.twoFAEnabled = true;
    user.twoFASecret = secret;
    user.twoFABackupCodes = backupCodes;
    user.twoFAVerifiedAt = new Date();
    await user.save();

    // Log activity
    await logActivity(
      user._id,
      user.email,
      user.adminRole,
      '2fa_enabled',
      'User',
      user._id,
      user.email,
      '2FA enabled',
      'high',
      req.ip,
      req.headers['user-agent']
    );

    // Send email with backup codes
    await send2FASetupEmail(user.email, backupCodes);

    res.json({
      message: '2FA enabled successfully',
      backupCodes,
      warning: 'Save these backup codes in a safe place. You will need them if you lose access to your authenticator app.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Disable 2FA
export const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    const user = req.user;

    if (!password) {
      return res.status(400).json({ error: 'Password required to disable 2FA' });
    }

    // Verify password
    const bcrypt = (await import('bcryptjs')).default;
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Disable 2FA
    user.twoFAEnabled = false;
    user.twoFASecret = null;
    user.twoFABackupCodes = [];
    await user.save();

    // Log activity
    await logActivity(
      user._id,
      user.email,
      user.adminRole,
      '2fa_disabled',
      'User',
      user._id,
      user.email,
      '2FA disabled',
      'high',
      req.ip,
      req.headers['user-agent']
    );

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== SESSIONS ====================

// Get active sessions
export const getAdminActiveSessions = async (req, res) => {
  try {
    const sessions = await AdminSession.find({
      adminId: req.user._id,
      isActive: true,
    }).sort({ loginTime: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout specific session
export const logoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AdminSession.findByIdAndUpdate(
      sessionId,
      {
        isActive: false,
        logoutTime: new Date(),
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Log activity
    await logActivity(
      req.user._id,
      req.user.email,
      req.user.adminRole,
      'session_logout',
      'AdminSession',
      sessionId,
      null,
      'Session logged out by user',
      'low',
      req.ip,
      req.headers['user-agent']
    );

    res.json({ message: 'Session logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout all sessions
export const logoutAllAdminSessions = async (req, res) => {
  try {
    await AdminSession.updateMany(
      {
        adminId: req.user._id,
        isActive: true,
      },
      {
        isActive: false,
        logoutTime: new Date(),
      }
    );

    // Log activity
    await logActivity(
      req.user._id,
      req.user.email,
      req.user.adminRole,
      'logout',
      'User',
      req.user._id,
      req.user.email,
      'Logged out from all sessions',
      'medium',
      req.ip,
      req.headers['user-agent']
    );

    res.json({ message: 'All sessions logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== ACTIVITY MONITORING ====================

// Get activity logs
export const getActivityLogs = async (req, res) => {
  try {
    const { adminId, action, severity, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (adminId) query.adminId = adminId;
    if (action) query.action = action;
    if (severity) query.severity = severity;

    const activities = await AdminActivity.find(query)
      .populate('adminId', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminActivity.countDocuments(query);

    res.json({
      activities,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get flagged activities
export const getAdminFlaggedActivities = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const activities = await AdminActivity.find({ flagged: true })
      .populate('adminId', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminActivity.countDocuments({ flagged: true });

    res.json({
      activities,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export activity logs
export const exportAdminActivityLogs = async (req, res) => {
  try {
    const { adminId, startDate, endDate, action, severity, format = 'json' } = req.query;

    const filters = {};
    if (adminId) filters.adminId = adminId;
    if (action) filters.action = action;
    if (severity) filters.severity = severity;
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    const logs = await exportLogs(filters);

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(logs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.csv"');
      res.send(csv);
    } else {
      res.json(logs);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get activity trends
export const getAdminActivityTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const trends = await getActivityTrends(parseInt(days));

    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== PASSWORD MANAGEMENT ====================

// Change password endpoint
export const changeAdminPassword = async (req, res) => {
  try {
    const { newPassword, currentPassword } = req.body;
    const user = req.user;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    // Import required utilities
    const { hashPassword, comparePassword } = await import('../utils/auth.js');
    
    // If password is NOT expired, verify current password
    if (!isPasswordExpired(user.passwordChangedAt)) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }

      const isValid = await comparePassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Validate new password requirements
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors[0] });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear expiration
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    user.failedLoginCount = 0; // Reset failed login attempts
    
    await user.save();

    // Log the activity
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await logActivity(
      user._id,
      user.email,
      user.adminRole,
      'password_changed',
      'User',
      user._id,
      user.email,
      'Admin changed their password',
      'medium',
      ipAddress,
      userAgent
    );

    // Send email notification
    try {
      await sendPasswordChangedEmail(user.email, user.firstName);
    } catch (emailError) {
      console.error('Error sending password change email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message: '✅ Password changed successfully',
      success: true,
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: error.message || 'Failed to change password' });
  }
};

// Helper to convert to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ];

  return csv.join('\n');
};
