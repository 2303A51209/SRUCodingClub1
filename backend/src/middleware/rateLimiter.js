/**
 * Route-Specific Rate Limiters
 * Different limits for different endpoint sensitivities
 */

const rateLimit = require('express-rate-limit');

/**
 * Strict limiter for auth endpoints (login, register, forgot-password)
 * Prevents brute force attacks
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    skipSuccessfulRequests: true, // Only count failed attempts
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            message: 'Too many authentication attempts, please try again after 15 minutes',
        },
    },
});

/**
 * Standard API limiter for general endpoints
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            message: 'Too many requests from this IP, please try again after 15 minutes',
        },
    },
});

/**
 * Relaxed limiter for read-only public endpoints
 */
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Higher limit for public reads
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            message: 'Too many requests, please try again later',
        },
    },
});

/**
 * Strict limiter for sensitive operations (password reset, email change)
 */
const sensitiveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            message: 'Too many attempts, please try again in an hour',
        },
    },
});

module.exports = {
    authLimiter,
    apiLimiter,
    publicLimiter,
    sensitiveLimiter,
    // Default export for backward compatibility
    default: apiLimiter,
};
