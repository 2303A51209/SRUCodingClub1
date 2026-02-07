/**
 * Registrations Routes
 */

const express = require('express');
const { z } = require('zod');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { catchAsync, ApiError } = require('../utils/errors');
const { getSupabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Validation Schema
const registerSchema = z.object({
    body: z.object({
        event_id: z.string().uuid(),
        type: z.enum(['solo', 'create_team', 'join_team']),

        // Team Data
        team_name: z.string().min(3).max(50).optional(),
        team_code: z.string().min(6).max(20).optional(),

        // Track
        track_id: z.string().optional(),

        // Dynamic Fields
        submission_data: z.record(z.any()).optional(),
    }).refine(data => {
        if (data.type === 'create_team' && !data.team_name) return false;
        if (data.type === 'join_team' && !data.team_code) return false;
        return true;
    }, {
        message: "Team name required for creation, Team code required for joining",
        path: ["type"]
    }),
});

/**
 * POST / - Register for an event
 */
router.post(
    '/',
    authenticate,
    validate(registerSchema),
    catchAsync(async (req, res) => {
        const { event_id, type, team_name, team_code, track_id, submission_data } = req.body;
        const userId = req.user.id;
        const supabase = getSupabaseAdmin();

        // 1. Fetch Event & Config
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, title, status, registration_config, capacity')
            .eq('id', event_id)
            .single();

        if (eventError || !event) throw new ApiError(404, 'Event not found');

        // 2. Validate Event State
        if (event.status !== 'published' && event.status !== 'upcoming' && event.status !== 'ongoing') {
            throw new ApiError(400, 'Registration is not open for this event');
        }

        const config = event.registration_config || {};
        const now = new Date();

        if (config.registration_start && new Date(config.registration_start) > now) {
            throw new ApiError(400, 'Registration has not started yet');
        }
        if (config.registration_end && new Date(config.registration_end) < now) {
            throw new ApiError(400, 'Registration has ended');
        }

        // 3. Check Existing Registration
        const { data: existing } = await supabase
            .from('registrations')
            .select('id')
            .eq('event_id', event_id)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) throw new ApiError(400, 'You are already registered for this event');

        // 4. Handle Logic based on Type
        let teamId = null;
        let registrationStatus = 'verified'; // Default, maybe 'pending' via config

        if (type === 'solo') {
            if (config.allow_solo === false) throw new ApiError(400, 'Solo registration is not allowed');
        }
        else if (type === 'create_team') {
            if (config.allow_teams === false) throw new ApiError(400, 'Team registration is not allowed');

            // Generate unique code
            const generatedCode = uuidv4().substring(0, 8).toUpperCase();

            // Create Team
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .insert({
                    event_id,
                    name: team_name,
                    code: generatedCode,
                    leader_id: userId
                })
                .select()
                .single();

            if (teamError) {
                if (teamError.code === '23505') throw new ApiError(400, 'Team name already exists');
                throw teamError;
            }

            teamId = team.id;

            // Add Leader to Team Members
            await supabase.from('team_members').insert({
                team_id: teamId,
                user_id: userId,
                status: 'accepted'
            });
        }
        else if (type === 'join_team') {
            if (config.allow_teams === false) throw new ApiError(400, 'Team registration is not allowed');

            // Find Team
            const { data: team } = await supabase
                .from('teams')
                .select('id, event_id')
                .eq('code', team_code)
                .eq('event_id', event_id) // Ensure code matches event
                .single();

            if (!team) throw new ApiError(404, 'Invalid Team Code');

            teamId = team.id;

            // Check Size Limit
            const { count } = await supabase
                .from('team_members')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId);

            if (config.max_team_size && count >= config.max_team_size) {
                throw new ApiError(400, 'Team is full');
            }

            // Add Member
            await supabase.from('team_members').insert({
                team_id: teamId,
                user_id: userId,
                status: 'accepted'
            });
        }

        // 5. Create Registration
        const { data: registration, error: regError } = await supabase
            .from('registrations')
            .insert({
                event_id,
                user_id: userId,
                team_id: teamId,
                track_id: track_id || null,
                submission_data: submission_data || {},
                status: registrationStatus,
                verified: true
            })
            .select()
            .single();

        if (regError) throw regError;

        res.status(201).json({
            success: true,
            data: {
                registration,
                team_code: type === 'create_team' ? (await supabase.from('teams').select('code').eq('id', teamId).single()).data?.code : undefined
            }
        });
    })
);

/**
 * PATCH /:id - Admin: Update registration status
 */
router.patch(
    '/:id',
    authenticate,
    authorize('admin', 'team'),
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const { status, verified } = req.body;
        const supabase = getSupabaseAdmin();

        const updateData = {};
        if (status) updateData.status = status;
        if (verified !== undefined) updateData.verified = verified;

        const { data, error } = await supabase
            .from('registrations')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    })
);

module.exports = router;
