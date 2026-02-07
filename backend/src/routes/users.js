/**
 * Users Routes
 */

const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');
const { catchAsync, ApiError } = require('../utils/errors');
const { getSupabaseAdmin } = require('../config/supabase');

const router = express.Router();

// Validation schemas
const updateProfileSchema = z.object({
    body: z.object({
        full_name: z.string().min(2).max(100).optional(),
        avatar_url: z.string().url().optional(),
        bio: z.string().max(500).optional(),
        phone: z.string().max(20).optional(),
        roll_no: z.string().max(20).optional(),
        branch: z.string().max(50).optional(),
        year: z.string().max(10).optional(),
        skills: z.array(z.string()).optional(),
        profile_completed: z.boolean().optional(),
        title: z.string().max(100).optional(),
        github_url: z.string().url().nullish().or(z.literal('')),
        linkedin_url: z.string().url().nullish().or(z.literal('')),
        website_url: z.string().url().nullish().or(z.literal('')),
    }),
});

const updateRoleSchema = z.object({
    body: z.object({
        role: z.enum(['member', 'team', 'admin']),
    }),
});

const paginationSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
        role: z.enum(['member', 'team', 'admin', 'all']).default('all'),
        search: z.string().optional(),
    }),
});

/**
 * GET /users - List all users (admin only)
 */
router.get(
    '/',
    authenticate,
    authorize('admin'),
    validate(paginationSchema),
    catchAsync(async (req, res) => {
        const { page, limit, role, search } = req.query;
        const offset = (page - 1) * limit;

        const supabase = getSupabaseAdmin();

        let query = supabase
            .from('users')
            .select('id, email, full_name, avatar_url, role, created_at', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Filter by role
        if (role !== 'all') {
            query = query.eq('role', role);
        }

        // Search by name or email
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data: users, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total: count,
                    pages: Math.ceil(count / limit),
                },
            },
        });
    })
);

/**
 * GET /users/me - Get current user profile
 */
router.get(
    '/me',
    authenticate,
    catchAsync(async (req, res) => {
        const supabase = getSupabaseAdmin();

        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url, bio, role, phone, roll_no, branch, year, skills, profile_completed, auth_provider, title, github_url, linkedin_url, website_url, created_at')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            throw new ApiError(404, 'User not found');
        }

        res.json({
            success: true,
            data: user,
        });
    })
);

/**
 * PATCH /users/me - Update current user profile
 */
router.patch(
    '/me',
    authenticate,
    validate(updateProfileSchema),
    catchAsync(async (req, res) => {
        const supabase = getSupabaseAdmin();

        const { data: user, error } = await supabase
            .from('users')
            .update(req.body)
            .eq('id', req.user.id)
            .select('id, email, full_name, avatar_url, bio, role, phone, roll_no, branch, year, skills, profile_completed, auth_provider, title, github_url, linkedin_url, website_url, created_at')
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: user,
        });
    })
);

/**
 * GET /users/team - Get team members (public)
 * Returns admins and team members
 */
router.get(
    '/team',
    catchAsync(async (req, res) => {
        const supabase = getSupabaseAdmin();

        const { data: users, error } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, bio, role, title, github_url, linkedin_url, website_url')
            .in('role', ['admin', 'team'])
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: users,
        });
    })
);

/**
 * GET /users/:id - Get user by ID (admin only)
 */
router.get(
    '/:id',
    authenticate,
    authorize('admin'),
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const supabase = getSupabaseAdmin();

        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url, bio, role, created_at')
            .eq('id', id)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' },
            });
        }

        res.json({
            success: true,
            data: user,
        });
    })
);

/**
 * PATCH /users/:id/role - Update user role (admin only)
 */
router.patch(
    '/:id/role',
    authenticate,
    authorize('admin'),
    validate(updateRoleSchema),
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const { role } = req.body;

        // Prevent self-demotion
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                error: { message: 'Cannot change your own role' },
            });
        }

        const supabase = getSupabaseAdmin();

        const { data: user, error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', id)
            .select('id, email, full_name, role')
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' },
            });
        }

        res.json({
            success: true,
            data: user,
        });
    })
);

/**
 * DELETE /users/:id - Delete user (admin only)
 */
router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    catchAsync(async (req, res) => {
        const { id } = req.params;

        // Prevent self-deletion
        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                error: { message: 'Cannot delete your own account' },
            });
        }

        const supabase = getSupabaseAdmin();

        // Delete user from public.users
        const { error: dbError } = await supabase.from('users').delete().eq('id', id);

        if (dbError) throw dbError;

        // Delete from Supabase Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(id);

        if (authError) {
            console.error('Failed to delete auth user:', authError);
        }

        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    })
);

/**
 * GET /users/me/events - Get current user's registrations
 */
router.get(
    '/me/events',
    authenticate,
    catchAsync(async (req, res) => {
        const supabase = getSupabaseAdmin();

        const { data: registrations, error } = await supabase
            .from('registrations')
            .select(`
                id,
                status,
                created_at,
                events (
                  id,
                  title,
                  date,
                  start_date,
                  location
                )
            `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map events.date to events.start_date for frontend compatibility
        const mappedRegistrations = registrations.map(reg => ({
            ...reg,
            events: reg.events ? { ...reg.events, start_date: reg.events.start_date || reg.events.date } : null
        }));

        res.json({
            success: true,
            data: mappedRegistrations,
        });
    })
);

/**
 * GET /users/:id/events - Get user's registrations
 */
router.get(
    '/:id/events',
    authenticate,
    catchAsync(async (req, res) => {
        const { id } = req.params;

        // Only allow users to see their own events or admin
        if (id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: { message: 'Forbidden' },
            });
        }

        const supabase = getSupabaseAdmin();

        const { data: registrations, error } = await supabase
            .from('registrations')
            .select(`
        id,
        status,
        created_at,
        events (
          id,
          title,
          date,
          start_date,
          location
        )
      `)
            .eq('user_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map events.date to events.start_date for frontend compatibility
        const mappedRegistrations = registrations.map(reg => ({
            ...reg,
            events: reg.events ? { ...reg.events, start_date: reg.events.start_date || reg.events.date } : null
        }));

        res.json({
            success: true,
            data: mappedRegistrations,
        });
    })
);

module.exports = router;
