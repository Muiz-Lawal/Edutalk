import AdminSession from '../models/AdminSession.js';
import User from '../models/User.js';
import { UAParser } from 'ua-parser-js';

// Create admin session
export const createAdminSession = async (
  adminId,
  email,
  adminRole,
  token,
  ipAddress,
  userAgent
) => {
  const parser = new UAParser(userAgent);
  const browserInfo = parser.getResult();

  const session = await AdminSession.create({
    adminId,
    adminEmail: email,
    adminRole,
    token,
    ipAddress,
    userAgent,
    browserInfo: {
      name: browserInfo.browser.name,
      version: browserInfo.browser.version,
      os: browserInfo.os.name,
    },
  });

  return session;
};

// Get active sessions for user
export const getActiveSessions = async (adminId) => {
  return AdminSession.find({
    adminId,
    isActive: true,
    logoutTime: null,
  }).sort({ loginTime: -1 });
};

// End session
export const endSession = async (sessionId) => {
  return AdminSession.findByIdAndUpdate(
    sessionId,
    {
      isActive: false,
      logoutTime: new Date(),
      sessionDuration: new Date() - new Date(sessionId.loginTime),
    },
    { new: true }
  );
};

// Logout all sessions for user
export const logoutAllSessions = async (adminId) => {
  return AdminSession.updateMany(
    {
      adminId,
      isActive: true,
    },
    {
      isActive: false,
      logoutTime: new Date(),
    }
  );
};

// Update last activity
export const updateLastActivity = async (sessionId) => {
  return AdminSession.findByIdAndUpdate(
    sessionId,
    { lastActivityTime: new Date() },
    { new: true }
  );
};

// Check for suspicious login
export const checkSuspiciousLogin = async (adminId, ipAddress) => {
  const recentSessions = await AdminSession.find({
    adminId,
    isActive: true,
    createdAt: {
      $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    },
  });

  const uniqueIPs = new Set(recentSessions.map(s => s.ipAddress));

  // Flag as suspicious if different IP in same day
  if (uniqueIPs.size > 0 && !uniqueIPs.has(ipAddress)) {
    return {
      isSuspicious: true,
      reason: 'Login from different IP address',
      recentIPs: Array.from(uniqueIPs),
    };
  }

  return { isSuspicious: false };
};

// Get session statistics
export const getSessionStats = async (adminId) => {
  const allSessions = await AdminSession.find({ adminId });
  const activeSessions = await AdminSession.find({
    adminId,
    isActive: true,
  });

  return {
    totalSessions: allSessions.length,
    activeSessions: activeSessions.length,
    averageSessionDuration: calculateAverageSessionDuration(allSessions),
    loginCount: allSessions.length,
  };
};

const calculateAverageSessionDuration = (sessions) => {
  const durations = sessions
    .filter(s => s.sessionDuration)
    .map(s => s.sessionDuration);

  if (durations.length === 0) return 0;

  const total = durations.reduce((sum, duration) => sum + duration, 0);
  return Math.round(total / durations.length / 1000 / 60); // in minutes
};
