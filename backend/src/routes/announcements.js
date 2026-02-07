/**
 * Announcements Routes
 */

const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');
const { catchAsync } = require('../utils/errors');
const { getSupabaseClient, getSupabaseAdmin } = require('../config/supabase');

const router = express.Router();

const announcementSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200),
        content: z.string().min(10).max(10000),
        priority: z.enum(['low', 'normal', 'high']).default('normal'),
        is_published: z.boolean().default(true),
        expires_at: z.string().datetime().optional(),
    }),
});

/**
 * GET /announcements - List published announcements
 */
router.get(
    '/',
    catchAsync(async (req, res) => {
        const supabase = getSupabaseClient();
        const now = new Date().toISOString();

        const { data: announcements, error } = await supabase
            .from('announcements')
            .select('id, title, content, created_at')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.json({
            success: true,
            data: announcements,
        });
    })
);

/**
 * POST /announcements - Create announcement (admin/team)
 */
router.post(
    '/',
    authenticate,
    authorize('admin', 'team'),
    validate(announcementSchema),
    catchAsync(async (req, res) => {
        const supabase = getSupabaseAdmin();

        const { data: announcement, error } = await supabase
            .from('announcements')
            .insert({
                ...req.body,
                created_by: req.user.id,
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: announcement,
        });
    })
);

/**
 * PATCH /announcements/:id - Update announcement
 */
router.patch(
    '/:id',
    authenticate,
    authorize('admin', 'team'),
    validate(announcementSchema.partial()),
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const supabase = getSupabaseAdmin();

        const { data: announcement, error } = await supabase
            .from('announcements')
            .update(req.body)
            .eq('id', id)
            .select()
            .single();

        if (error || !announcement) {
            return res.status(404).json({
                success: false,
                error: { message: 'Announcement not found' },
            });
        }

        res.json({
            success: true,
            data: announcement,
        });
    })
);

/**
 * DELETE /announcements/:id - Delete announcement (admin only)
 */
router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const supabase = getSupabaseAdmin();

        const { error } = await supabase.from('announcements').delete().eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Announcement deleted',
        });
    })
);

module.exports = router;
