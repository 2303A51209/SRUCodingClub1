const { ApiError } = require('../utils/errors');

/**
 * @param {...string|string[]} allowedRoles - Roles allowed to access, e.g. 'admin', 'team' or ['admin', 'team']
 */
const authorize = (...allowedRoles) => {
    // Flatten in case an array is passed as first argument
    const roles = allowedRoles.flat();

    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'User not authenticated'));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, 'You do not have permission to perform this action'));
        }

        next();
    };
};

module.exports = { authorize, rbac: authorize };
