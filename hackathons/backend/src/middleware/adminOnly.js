/**
 * Hackathons Platform - Admin Only Middleware
 * Ensures only admin users can access protected routes
 */
const { ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Check if authenticated user has admin role
 * Must be used after authenticate middleware
 */
const adminOnly = (req, res, next) => {
    if (!req.user) {
        return next(new ForbiddenError('Authentication required'));
    }

    // Allow both 'admin' and 'super_admin' roles
    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(req.user.role)) {
        logger.warn({ userId: req.user.id, role: req.user.role }, 'Non-admin access attempt');
        return next(new ForbiddenError('Admin access required'));
    }

    next();
};

module.exports = adminOnly;
