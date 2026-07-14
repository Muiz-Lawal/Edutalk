import User from '../models/User.js';
import { verifyToken as decodeToken } from '../utils/auth.js'; // Renamed import locally to avoid name collision

const normalizeUser = (decoded) => {
  if (!decoded) return null;
  const userId = decoded.userId || decoded.id || decoded.sub;
  return {
    ...decoded,
    userId,
    id: userId,
  };
};

// Main authentication middleware
export const authenticateToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = decodeToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = normalizeUser(decoded);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        req.user = normalizeUser(decoded);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const authorizeHost = async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.user.userId).select('isHost');
    if (!user || !user.isHost) {
      return res.status(403).json({ message: 'Host access required' });
    }

    req.user.isHost = true;
    next();
  } catch (error) {
    console.error('Host authorization error:', error);
    res.status(403).json({ message: 'Host authorization failed' });
  }
};

export const authorizeAdmin = async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.user.userId).select('isAdmin adminRole');
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(403).json({ message: 'Admin authorization failed' });
  }
};

// FIX: Export authenticateToken as verifyToken so liveRoutes.js doesn't crash!
export { authenticateToken as verifyToken };