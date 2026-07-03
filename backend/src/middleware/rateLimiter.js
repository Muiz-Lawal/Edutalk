// Simple in-memory rate limiter (dev only)
// Limits requests per IP for event ingestion endpoints
const windows = new Map();

export default function rateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const max = options.max || 120; // requests per window

  return (req, res, next) => {
    try {
      const key = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const entry = windows.get(key) || { count: 0, start: now };

      if (now - entry.start > windowMs) {
        entry.count = 1;
        entry.start = now;
      } else {
        entry.count += 1;
      }

      windows.set(key, entry);

      if (entry.count > max) {
        res.status(429).json({ message: 'Too many requests - rate limit exceeded' });
        return;
      }

      next();
    } catch (err) {
      // Fail open on rate limiter errors
      console.error('rateLimiter error:', err);
      next();
    }
  };
}
