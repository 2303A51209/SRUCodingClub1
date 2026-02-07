/**
 * Auth Middleware
 * Verifies Supabase access tokens and attaches user to request
 */
const { supabaseAdmin } = require('../config/supabase');
const { ApiError } = require('../utils/errors');

/**
 * Require authentication - validates Bearer token
 */
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'Missing authorization token');
        }

        const token = authHeader.split(' ')[1];

        // Verify token with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            throw new ApiError(401, 'Invalid or expired token');
        }

        // Get user profile from public.users
        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        // Attach to request
        req.user = {
            ...user,
            profile,
            role: profile?.role || 'member',
        };

        next();
    } catch (err) {
        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({
                success: false,
                error: { message: err.message },
            });
        }
        return res.status(401).json({
            success: false,
            error: { message: 'Authentication failed' },
        });
    }
};

/**
 * Optional auth - doesn't fail if no token, but populates user if present
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);

            if (user) {
                const { data: profile } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                req.user = {
                    ...user,
                    profile,
                    role: profile?.role || 'member',
                };
            }
        }
    } catch (err) {
        // Ignore errors - optional auth
    }
    next();
};

/**
 * Authorize middleware - checks if user has one of the required roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Not authenticated' }
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Not authorized' }
            });
        }

        next();
    };
};

/**
 * Legacy alias
 */
const auth = requireAuth;
const authenticate = requireAuth;

module.exports = {
    auth,
    authenticate,
    authorize,
    requireAuth,
    optionalAuth,
};
