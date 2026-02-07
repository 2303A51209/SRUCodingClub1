/**
 * Hackathons Platform - Public Routes
 * Read-only endpoints for public pages (no auth required)
 */
const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');
const { NotFoundError } = require('../utils/errors');

/**
 * GET /api/public/hackathons
 * List all published hackathons (not drafts)
 */
router.get('/hackathons', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('hackathons')
            .select(`
                id,
                title,
                slug,
                description,
                start_date,
                end_date,
                registration_deadline,
                status,
                max_team_size,
                hackathon_types (
                    id,
                    name
                )
            `)
            .neq('status', 'draft')
            .neq('status', 'cancelled')
            .order('start_date', { ascending: true });

        if (error) throw error;

        // Get counts for each hackathon
        const hackathonsWithCounts = await Promise.all(
            data.map(async (hackathon) => {
                // Get team count
                const { count: teamCount } = await supabase
                    .from('teams')
                    .select('*', { count: 'exact', head: true })
                    .eq('hackathon_id', hackathon.id);

                // Get submission count
                const { count: submissionCount } = await supabase
                    .from('submissions')
                    .select('*', { count: 'exact', head: true })
                    .eq('hackathon_id', hackathon.id);

                return {
                    ...hackathon,
                    team_count: teamCount || 0,
                    submission_count: submissionCount || 0,
                    registration_open: hackathon.status === 'upcoming' &&
                        new Date(hackathon.registration_deadline) > new Date(),
                };
            })
        );

        res.json({
            success: true,
            data: hackathonsWithCounts,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/public/hackathons/:id
 * Get single hackathon details
 */
router.get('/hackathons/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('hackathons')
            .select(`
                id,
                title,
                slug,
                description,
                rules,
                prizes,
                start_date,
                end_date,
                registration_deadline,
                max_team_size,
                status,
                hackathon_types (
                    id,
                    name,
                    description
                )
            `)
            .eq('id', id)
            .neq('status', 'draft')
            .single();

        if (error || !data) {
            throw new NotFoundError('Hackathon not found');
        }

        // Get team count
        const { count: teamCount } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true })
            .eq('hackathon_id', id);

        // Get submission count
        const { count: submissionCount } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('hackathon_id', id);

        // Get judges (names only)
        const { data: judges } = await supabase
            .from('judges')
            .select('id, name, expertise')
            .eq('hackathon_id', id);

        res.json({
            success: true,
            data: {
                ...data,
                team_count: teamCount || 0,
                submission_count: submissionCount || 0,
                registration_open: data.status === 'upcoming' &&
                    new Date(data.registration_deadline) > new Date(),
                judges: judges || [],
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/public/hackathons/:id/registration-info
 * Get registration requirements for a hackathon
 */
router.get('/hackathons/:id/registration-info', async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('hackathons')
            .select('id, title, max_team_size, registration_deadline, status, rules')
            .eq('id', id)
            .neq('status', 'draft')
            .single();

        if (error || !data) {
            throw new NotFoundError('Hackathon not found');
        }

        const registrationOpen = data.status === 'upcoming' &&
            new Date(data.registration_deadline) > new Date();

        res.json({
            success: true,
            data: {
                id: data.id,
                title: data.title,
                max_team_size: data.max_team_size,
                registration_deadline: data.registration_deadline,
                registration_open: registrationOpen,
                rules: data.rules,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/public/register
 * Register a team for a hackathon
 */
router.post('/register', async (req, res, next) => {
    try {
        const { hackathon_id, team_name, leader, members } = req.body;

        // Validate hackathon exists and registration is open
        const { data: hackathon, error: hackathonError } = await supabase
            .from('hackathons')
            .select('id, max_team_size, registration_deadline, status')
            .eq('id', hackathon_id)
            .single();

        if (hackathonError || !hackathon) {
            throw new NotFoundError('Hackathon not found');
        }

        const registrationOpen = hackathon.status === 'upcoming' &&
            new Date(hackathon.registration_deadline) > new Date();

        if (!registrationOpen) {
            throw new ValidationError('Registration is closed for this hackathon');
        }

        // Validate team size
        const totalMembers = 1 + (members?.length || 0);
        if (totalMembers > hackathon.max_team_size) {
            throw new ValidationError(`Team size exceeds maximum of ${hackathon.max_team_size}`);
        }

        // Create team
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert({
                hackathon_id,
                name: team_name,
            })
            .select()
            .single();

        if (teamError) {
            if (teamError.code === '23505') {
                throw new ValidationError('Team name already exists for this hackathon');
            }
            throw teamError;
        }

        // Add leader
        await supabase.from('participants').insert({
            team_id: team.id,
            name: leader.name,
            email: leader.email,
            phone: leader.phone || null,
            role: 'leader',
        });

        // Add members
        if (members?.length > 0) {
            await supabase.from('participants').insert(
                members.map(m => ({
                    team_id: team.id,
                    name: m.name,
                    email: m.email,
                    phone: m.phone || null,
                    role: 'member',
                }))
            );
        }

        res.status(201).json({
            success: true,
            message: 'Team registered successfully',
            data: {
                team_id: team.id,
                team_name: team.name,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Import ValidationError for register endpoint
const { ValidationError } = require('../utils/errors');

module.exports = router;
