const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { catchAsync } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Admin-only middleware
 */
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: { message: 'Admin access required' }
        });
    }
    next();
};

/**
 * GET /admin/stats
 * Dashboard statistics for admin
 */
router.get('/stats', requireAuth, requireAdmin, catchAsync(async (req, res) => {
    // Get counts
    const [usersResult, eventsResult, projectsResult, registrationsResult] = await Promise.all([
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('events').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('projects').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('registrations').select('id', { count: 'exact', head: true }),
    ]);

    // Get recent users (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: newUsersCount } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

    // Get upcoming events count
    const { count: upcomingEventsCount } = await supabaseAdmin
        .from('events')
        .select('id', { count: 'exact', head: true })
        .gte('date', new Date().toISOString())
        .eq('status', 'upcoming');

    // Get role breakdown
    const { data: roleData } = await supabaseAdmin
        .from('users')
        .select('role');

    const roleBreakdown = roleData?.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
    }, {}) || {};

    res.json({
        success: true,
        data: {
            totalUsers: usersResult.count || 0,
            totalEvents: eventsResult.count || 0,
            totalProjects: projectsResult.count || 0,
            totalRegistrations: registrationsResult.count || 0,
            newUsersThisWeek: newUsersCount || 0,
            upcomingEvents: upcomingEventsCount || 0,
            roleBreakdown,
        }
    });
}));

/**
 * GET /admin/recent-activity
 * Recent activity for admin dashboard
 */
router.get('/recent-activity', requireAuth, requireAdmin, catchAsync(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent users
    const { data: recentUsers } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    // Get recent events
    const { data: recentEvents } = await supabaseAdmin
        .from('events')
        .select('id, title, date, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    // Get recent registrations with user and event info
    const { data: recentRegistrations } = await supabaseAdmin
        .from('registrations')
        .select(`
            id,
            status,
            created_at,
            users:user_id (email, full_name),
            events:event_id (title)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    // Combine and format activity
    const activity = [];

    recentUsers?.forEach(user => {
        activity.push({
            type: 'new_user',
            message: `${user.full_name || user.email} joined as ${user.role}`,
            timestamp: user.created_at,
            icon: 'user-plus',
        });
    });

    recentEvents?.forEach(event => {
        activity.push({
            type: 'new_event',
            message: `Event "${event.title}" was created`,
            timestamp: event.created_at,
            icon: 'calendar',
        });
    });

    recentRegistrations?.forEach(reg => {
        activity.push({
            type: 'registration',
            message: `${reg.users?.full_name || reg.users?.email} registered for "${reg.events?.title}"`,
            timestamp: reg.created_at,
            icon: 'check-circle',
        });
    });

    // Sort by timestamp
    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
        success: true,
        data: activity.slice(0, limit)
    });
}));

/**
 * GET /admin/users
 * List all users with filters
 */
router.get('/users', requireAuth, requireAdmin, catchAsync(async (req, res) => {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from('users')
        .select('*', { count: 'exact' });

    if (role) {
        query = query.eq('role', role);
    }

    if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    console.log('Admin users query result:', { dataCount: data?.length, count, error });

    if (error) throw error;

    res.json({
        success: true,
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
        }
    });
}));

/**
 * PATCH /admin/users/:id/role
 * Change user role
 */
router.patch('/users/:id/role', requireAuth, requireAdmin, catchAsync(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'team', 'member'].includes(role)) {
        return res.status(400).json({
            success: false,
            error: { message: 'Invalid role. Must be admin, team, or member.' }
        });
    }

    // When promoting to team, reset profile_completed so they see welcome popup
    const updateData = {
        role,
        updated_at: new Date().toISOString()
    };

    // Trigger welcome popup for newly promoted team members
    if (role === 'team') {
        updateData.profile_completed = false;
    }

    const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    res.json({
        success: true,
        data
    });
}));

/**
 * GET /admin/drive-folders
 * List all drive folders
 */
router.get('/drive-folders', requireAuth, requireAdmin, catchAsync(async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('drive_folders')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
        success: true,
        data
    });
}));

/**
 * POST /admin/drive-folders
 * Add new drive folder
 */
router.post('/drive-folders', requireAuth, requireAdmin, catchAsync(async (req, res) => {
    const { name, folder_url, category, is_active, display_order } = req.body;

    if (!name || !folder_url) {
        return res.status(400).json({
            success: false,
            error: { message: 'Name and folder_url are required' }
        });
    }

    const { data, error } = await supabaseAdmin
        .from('drive_folders')
        .insert({
            name,
            folder_url,
            category: category || 'event',
            is_active: is_active !== false,
            display_order: display_order || 0
        })
        .select()
        .single();

    if (error) throw error;

    res.status(201).json({
        success: true,
        data
    });
}));

/**
 * PATCH /admin/drive-folders/:id
 * Update drive folder
 */
router.patch('/drive-folders/:id', requireAuth, requireAdmin, catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, folder_url, category, is_active, display_order } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (folder_url !== undefined) updateData.folder_url = folder_url;
    if (category !== undefined) updateData.category = category;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data, error } = await supabaseAdmin
        .from('drive_folders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    res.json({
        success: true,
        data
    });
}));

/**
 * DELETE /admin/drive-folders/:id
 * Delete drive folder
 */
router.delete('/drive-folders/:id', requireAuth, requireAdmin, catchAsync(async (req, res) => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
        .from('drive_folders')
        .delete()
        .eq('id', id);

    if (error) throw error;

    res.json({
        success: true,
        message: 'Folder deleted'
    });
}));

module.exports = router;
