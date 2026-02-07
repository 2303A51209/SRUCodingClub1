/**
 * Events Routes
 */

const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');
const { catchAsync } = require('../utils/errors');
const { getSupabaseClient, getSupabaseAdmin } = require('../config/supabase');

const router = express.Router();

// Validation helper
const jsonSchema = z.union([z.string(), z.record(z.any()), z.array(z.any())]).optional().nullable();

const eventSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(100),
        tagline: z.string().max(200).optional().nullable(),
        // Support both date and start_date
        date: z.string().datetime().optional(),
        start_date: z.string().datetime().optional(),
        end_date: z.string().datetime().optional(),
        location: z.string().max(200).optional().nullable(),
        // Support both capacity and max_participants
        capacity: z.number().int().positive().optional().nullable(),
        max_participants: z.number().int().positive().optional().nullable(),
        event_type: z.enum(['workshop', 'hackathon', 'talk', 'meetup', 'other']).default('workshop'),
        is_public: z.boolean().default(true),
        status: z.enum(['draft', 'published', 'archived', 'upcoming', 'ongoing', 'completed', 'cancelled']).default('draft'),
        registration_deadline: z.string().datetime().optional(),
        image_url: z.string().url().optional().nullable(),
        cover_image: z.string().url().optional().nullable(),

        // Rich Content
        description_rich: jsonSchema,
        rules: jsonSchema,
        prizes: jsonSchema,
        schedule: jsonSchema,
        faq: jsonSchema,
        sponsors: jsonSchema,

        // Configs
        config: jsonSchema,
        registration_config: jsonSchema,
        registration_enabled: z.boolean().default(true),
    }),
});

// ... (paginationSchema remains same)

// GET /events - Get all events
router.get(
    '/',
    catchAsync(async (req, res) => {
        const { page = 1, limit = 10, event_type, status } = req.query;
        const supabase = getSupabaseAdmin();

        let query = supabase
            .from('events')
            .select('*', { count: 'exact' });

        if (event_type) query = query.eq('event_type', event_type);

        // Handle status filter
        if (status === 'all') {
            // No filter - return all events (for admin)
        } else if (status) {
            query = query.eq('status', status);
        } else {
            // By default, show upcoming events
            query = query.in('status', ['upcoming', 'published', 'ongoing']);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query
            .order('start_date', { ascending: true })
            .range(from, to);

        if (error) throw error;

        // Get registration counts for these events
        // (Optional: can be done via joined query or separate)
        // For simplicity, we'll return events as is, or we can use a view.
        // Let's stick to basic events for now.

        res.json({
            success: true,
            count,
            data
        });
    })
);

/**
 * GET /events/:id - Get event details
 */
router.get(
    '/:id',
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const supabase = getSupabaseAdmin();

        const { data: event, error } = await supabase
            .from('events')
            .select(`
                *,
                registrations (count)
            `)
            .eq('id', id)
            .single();

        if (error || !event) {
            return res.status(404).json({
                success: false,
                error: { message: 'Event not found' }
            });
        }

        res.json({
            success: true,
            data: event
        });
    })
);

// POST /events
router.post(
    '/',
    authenticate,
    authorize('admin', 'team'),
    validate(eventSchema),
    catchAsync(async (req, res) => {
        // Map frontend fields to DB columns
        const { start_date, max_participants, cover_image, ...rest } = req.body;

        const eventData = {
            ...rest,
            // Map fields if not provided in primary format
            date: rest.date || start_date,
            capacity: rest.capacity || max_participants,
            image_url: rest.image_url || cover_image,
            created_by: req.user.id,
        };

        const supabase = getSupabaseAdmin();

        const { data: event, error } = await supabase
            .from('events')
            .insert(eventData)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: event,
        });
    })
);

// PATCH /events/:id
router.patch(
    '/:id',
    authenticate,
    authorize('admin', 'team'),
    validate(eventSchema.partial()),
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const supabase = getSupabaseAdmin();

        // Map frontend fields to DB columns
        const { start_date, max_participants, cover_image, ...rest } = req.body;
        const updateData = { ...rest };

        if (start_date && !updateData.date) updateData.date = start_date;
        if (max_participants && !updateData.capacity) updateData.capacity = max_participants;
        if (cover_image && !updateData.image_url) updateData.image_url = cover_image;

        const { data: event, error } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error || !event) {
            return res.status(404).json({
                success: false,
                error: { message: 'Event not found' },
            });
        }

        res.json({
            success: true,
            data: event,
        });
    })
);

/**
 * DELETE /events/:id - Delete event (admin only)
 */
router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const supabase = getSupabaseAdmin();

        const { error } = await supabase.from('events').delete().eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Event deleted successfully',
        });
    })
);

/**
 * POST /events/:id/register - Register for event
 */
router.post(
    '/:id/register',
    authenticate,
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const supabase = getSupabaseAdmin();

        // Check event exists and has capacity
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*, registrations(count)')
            .eq('id', id)
            .single();

        if (eventError || !event) {
            return res.status(404).json({
                success: false,
                error: { message: 'Event not found' },
            });
        }

        // Check status and registration toggle
        if (event.status === 'completed' || event.status === 'cancelled' || event.registration_enabled === false) {
            return res.status(400).json({
                success: false,
                error: { message: 'Registration is closed for this event' },
            });
        }

        // Check status and registration toggle
        if (event.status === 'completed' || event.status === 'cancelled' || event.registration_enabled === false) {
            return res.status(400).json({
                success: false,
                error: { message: 'Registration is closed for this event' },
            });
        }

        // Check capacity
        if (event.max_participants && event.registrations[0].count >= event.max_participants) {
            return res.status(400).json({
                success: false,
                error: { message: 'Event is at full capacity' },
            });
        }

        // Check already registered
        const { data: existing } = await supabase
            .from('registrations')
            .select('id')
            .eq('event_id', id)
            .eq('user_id', userId)
            .single();

        if (existing) {
            return res.status(400).json({
                success: false,
                error: { message: 'Already registered for this event' },
            });
        }

        // Register
        const { data: registration, error } = await supabase
            .from('registrations')
            .insert({ event_id: id, user_id: userId })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: registration,
        });
    })
);

/**
 * DELETE /events/:id/register - Cancel registration
 */
router.delete(
    '/:id/register',
    authenticate,
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const supabase = getSupabaseAdmin();

        const { error } = await supabase
            .from('registrations')
            .delete()
            .eq('event_id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Registration cancelled',
        });
    })
);

// ... existing PATCH ...

/**
 * GET /events/:id/registrations - Admin: Get all registrations
 */
router.get(
    '/:id/registrations',
    authenticate,
    authorize('admin', 'team'),
    catchAsync(async (req, res) => {
        const { id } = req.params;
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('registrations')
            .select(`
                *,
                users:user_id (id, full_name, email, phone, avatar_url),
                teams:team_id (id, name, code)
            `)
            .eq('event_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    })
);

module.exports = router;
