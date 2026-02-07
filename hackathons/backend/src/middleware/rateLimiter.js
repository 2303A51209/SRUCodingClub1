/**
 * Hackathons Platform - Rate Limiter
 * Protects API and login endpoints from abuse
 */
const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('../utils/errors');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new RateLimitError('Too many API requests, please try again later'));
    },
});

/**
 * Strict rate limiter for login attempts
 * 5 attempts per 15 minutes
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
    handler: (req, res, next) => {
        next(new RateLimitError('Too many login attempts, please try again in 15 minutes'));
    },
});

/**
 * Rate limiter for admin actions (email, export)
 */
const adminActionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 actions per hour
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new RateLimitError('Too many admin actions, please wait'));
    },
});

/**
 * Email sending rate limiter
 */
const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // Max 500 emails per hour
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new RateLimitError('Email rate limit reached, please wait'));
    },
});

module.exports = {
    apiLimiter,
    loginLimiter,
    adminActionLimiter,
    emailLimiter,
};
