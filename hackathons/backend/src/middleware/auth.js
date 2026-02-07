/**
 * Hackathons Platform - Auth Middleware
 * JWT verification for protected routes
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Verify JWT from cookie or Authorization header
 */
const authenticate = (req, res, next) => {
    try {
        // Try signed cookie first (set with signed: true)
        // Then regular cookie, then Authorization header
        let token = req.signedCookies?.hackathons_token || req.cookies?.hackathons_token;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            throw new UnauthorizedError('No authentication token provided');
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;

        logger.debug({ userId: decoded.id }, 'User authenticated');
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new UnauthorizedError('Invalid token'));
        } else if (error.name === 'TokenExpiredError') {
            next(new UnauthorizedError('Token expired'));
        } else {
            next(error);
        }
    }
};

/**
 * Generate JWT for admin user
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
};

module.exports = {
    authenticate,
    generateToken,
};
