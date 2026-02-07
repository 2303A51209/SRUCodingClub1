/**
 * Hackathons Platform - Auth Routes
 * Login/Logout for admin users (hidden login)
 */
const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');
const { authenticate, generateToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { logAuditEvent } = require('../middleware/auditLog');
const { ValidationError, UnauthorizedError } = require('../utils/errors');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * POST /api/auth/login
 * Admin login - returns JWT in HttpOnly cookie
 */
router.post('/login', loginLimiter, async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }

        // DEV MODE: Allow bypass for local development
        const DEV_MODE = process.env.NODE_ENV === 'development';
        const DEV_ADMIN_EMAIL = '2303A51206@sru.edu.in';
        const DEV_ADMIN_PASSWORD = 'admin123';

        let profile;

        if (DEV_MODE && email === DEV_ADMIN_EMAIL && password === DEV_ADMIN_PASSWORD) {
            // Development bypass - no Supabase needed
            logger.info({ email }, 'DEV MODE: Admin login bypass');
            profile = {
                id: 'dev-admin-001',
                email: DEV_ADMIN_EMAIL,
                name: 'Dev Admin',
                role: 'super_admin',
            };
        } else {
            // Production: Authenticate with Supabase
            const { data, error } = await supabaseAdmin.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                logger.warn({ email, error: error.message }, 'Supabase auth failed');
                throw new UnauthorizedError('Invalid credentials');
            }

            // Get user profile to check role
            const { data: dbProfile, error: profileError } = await supabaseAdmin
                .from('admin_users')
                .select('*')
                .eq('email', email)
                .single();

            if (profileError || !dbProfile) {
                logger.warn({ email, profileError }, 'Admin user not found in admin_users table');
                throw new UnauthorizedError('Admin access required');
            }

            // Allow admin or super_admin roles
            const allowedRoles = ['admin', 'super_admin'];
            if (!allowedRoles.includes(dbProfile.role)) {
                logger.warn({ email, role: dbProfile.role }, 'Non-admin role login attempt');
                throw new UnauthorizedError('Admin access required');
            }

            profile = dbProfile;
        }

        // Generate JWT
        const token = generateToken({
            id: profile.id,
            email: profile.email,
            role: profile.role,
        });

        // Set HttpOnly cookie
        res.cookie('hackathons_token', token, {
            httpOnly: true,
            secure: config.cookie.secure,
            sameSite: 'lax',
            maxAge: config.cookie.maxAge,
            signed: true,
        });

        // Log successful login
        await logAuditEvent({
            adminId: profile.id,
            action: 'LOGIN',
            entityType: 'auth',
            entityId: profile.id,
            details: { email },
            ipAddress: req.ip,
        }).catch(() => { }); // Don't fail if audit fails in dev

        logger.info({ email }, 'Admin logged in');

        res.json({
            success: true,
            data: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout
 * Clear auth cookie
 */
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        // Log logout
        await logAuditEvent({
            adminId: req.user.id,
            action: 'LOGOUT',
            entityType: 'auth',
            entityId: req.user.id,
            details: {},
            ipAddress: req.ip,
        });

        // Clear cookie
        res.clearCookie('hackathons_token');

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req, res, next) => {
    try {
        // DEV MODE: If user ID starts with 'dev-', return JWT payload directly
        if (req.user.id?.startsWith('dev-')) {
            return res.json({
                success: true,
                data: {
                    id: req.user.id,
                    email: req.user.email,
                    name: 'Dev Admin',
                    role: req.user.role,
                },
            });
        }

        // Production: Query database
        const { data: profile, error } = await supabaseAdmin
            .from('admin_users')
            .select('id, email, name, role')
            .eq('id', req.user.id)
            .single();

        if (error) {
            throw new UnauthorizedError('User not found');
        }

        res.json({
            success: true,
            data: profile,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
