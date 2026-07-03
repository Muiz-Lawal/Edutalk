import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Login rate limiter - 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return ipKeyGenerator(req, res);
  },
});

// General API rate limiter - 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Sensitive operations rate limiter - 5 per hour
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many sensitive operations, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.user?._id?.toString() || ipKeyGenerator(req, res);
  },
});

// User deletion limiter - 5 deletions per hour
export const userDeletionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Cannot delete more than 5 users per hour',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.user?._id?.toString() || ipKeyGenerator(req, res);
  },
});

// Admin creation limiter - 3 per hour
export const adminCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Cannot create more than 3 admins per hour',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.user?._id?.toString() || ipKeyGenerator(req, res);
  },
});

// Refund processing limiter - 10 per hour
export const refundLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Cannot process more than 10 refunds per hour',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.user?._id?.toString() || ipKeyGenerator(req, res);
  },
});

// Password change limiter - 3 per day
export const passwordChangeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: 'Cannot change password more than 3 times per day',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.user?._id?.toString() || ipKeyGenerator(req, res);
  },
});
