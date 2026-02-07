/**
 * Gallery Routes
 */

const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');
const { catchAsync } = require('../utils/errors');
const { getSupabaseClient, getSupabaseAdmin } = require('../config/supabase');

const router = express.Router();

const gallerySchema = z.object({
    body: z.object({
        url: z.string().url(),
        caption: z.string().max(500).optional(),
        category: z.string().max(50).optional(),
    }),
});

/**
 * GET /gallery - List gallery items
 */
router.get(
    '/',
    catchAsync(async (req, res) => {
        const { category, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Use admin client to bypass RLS (gallery is public data)
        const supabase = getSupabaseAdmin();

        let query = supabase
            .from('gallery_items')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: items, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: items || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit),
            },
        });
    })
);

/**
 * POST /gallery - Upload gallery item (admin/team)
 */
router.post(
    '/',
    authenticate,
    authorize('admin', 'team'),
    validate(gallerySchema),
    catchAsync(async (req, res) => {
        const supabase = getSupabaseAdmin();

        const { data: item, error } = await supabase
            .from('gallery_items')
            .insert({
                url: req.body.url,
                caption: req.body.caption || null,
                category: req.body.category || null,
                uploaded_by: req.user.id,
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: item,
        });
    })
);

/**
 * PATCH /gallery/:id - Update gallery item (admin/team)
 */
router.patch(
    '/:id',
    authenticate,
    authorize('admin', 'team'),
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const supabase = getSupabaseAdmin();

        const { data: item, error } = await supabase
            .from('gallery_items')
            .update({
                url: req.body.url,
                caption: req.body.caption || null,
                category: req.body.category || null,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: item,
        });
    })
);

/**
 * DELETE /gallery/:id - Delete gallery item (admin only)
 */
router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const supabase = getSupabaseAdmin();

        const { error } = await supabase.from('gallery_items').delete().eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Gallery item deleted',
        });
    })
);

module.exports = router;
