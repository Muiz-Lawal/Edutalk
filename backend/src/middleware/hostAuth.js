/**
 * Middleware to authorize host-only operations
 * Must be used after authenticateToken middleware
 */
export const authorizeHost = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No user found' });
    }

    if (!req.user.isHost) {
      return res.status(403).json({ 
        message: 'Forbidden: Only hosts can perform this action. Upgrade your account to host.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Optional middleware to check if user is host
 * Does not block if user is not host, just sets flag
 */
export const optionalHostCheck = (req, res, next) => {
  try {
    req.isHost = req.user && req.user.isHost;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
