const express = require('express');
const router = express.Router();
const { getSupabaseAdmin } = require('../config/supabase');
const { catchAsync } = require('../utils/errors');

/**
 * @route   GET /api/v1/projects
 * @desc    Get all projects
 * @access  Public
 */
router.get(
    '/',
    catchAsync(async (req, res) => {
        const supabase = getSupabaseAdmin();
        const { category, featured } = req.query;

        let query = supabase
            .from('projects')
            .select('id, title, description, image_url, tags, demo_url, github_url, status, is_featured, created_at')
            .eq('status', 'active')
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false });

        if (category && category !== 'all') {
            query = query.contains('tags', [category]);
        }

        if (featured === 'true') {
            query = query.eq('is_featured', true);
        }

        const { data: projects, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: projects,
        });
    })
);

/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get project by ID
 * @access  Public
 */
router.get(
    '/:id',
    catchAsync(async (req, res) => {
        const supabase = getSupabaseAdmin();
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        res.json({
            success: true,
            data: project,
        });
    })
);

module.exports = router;
