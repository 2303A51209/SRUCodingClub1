/**
 * Hackathons Platform - Admin Routes
 * Protected routes for admin CRUD operations
 */
const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');
const { authenticate } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { auditMiddleware } = require('../middleware/auditLog');
const { adminActionLimiter, emailLimiter } = require('../middleware/rateLimiter');
const { queueEmail, logEmailSend, processEmailQueue } = require('../services/emailService');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

// All admin routes require authentication
router.use(authenticate);
router.use(adminOnly);
router.use(adminActionLimiter);

// ========================
// HACKATHON TYPES
// ========================

router.get('/types', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('hackathon_types')
            .select('*')
            .order('name');

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.post('/types', auditMiddleware('CREATE', 'hackathon_type'), async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const { data, error } = await supabaseAdmin
            .from('hackathon_types')
            .insert({ name, description })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// ========================
// HACKATHONS
// ========================

router.get('/hackathons', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('hackathons')
            .select(`
                *,
                hackathon_types (id, name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.get('/hackathons/:id', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('hackathons')
            .select(`
                *,
                hackathon_types (id, name, description)
            `)
            .eq('id', req.params.id)
            .single();

        if (error || !data) throw new NotFoundError('Hackathon not found');
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.post('/hackathons', auditMiddleware('CREATE', 'hackathon'), async (req, res, next) => {
    try {
        const {
            type_id, title, slug, description, rules, prizes,
            start_date, end_date, registration_deadline, max_team_size, status
        } = req.body;

        const { data, error } = await supabaseAdmin
            .from('hackathons')
            .insert({
                type_id, title, slug, description, rules, prizes,
                start_date, end_date, registration_deadline,
                max_team_size: max_team_size || 4,
                status: status || 'draft',
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.put('/hackathons/:id', auditMiddleware('UPDATE', 'hackathon'), async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('hackathons')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.delete('/hackathons/:id', auditMiddleware('DELETE', 'hackathon'), async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('hackathons')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Hackathon deleted' });
    } catch (error) {
        next(error);
    }
});

// ========================
// TEAMS
// ========================

router.get('/hackathons/:id/teams', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('teams')
            .select(`
                *,
                participants (*)
            `)
            .eq('hackathon_id', req.params.id)
            .order('created_at');

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.post('/teams', auditMiddleware('CREATE', 'team'), async (req, res, next) => {
    try {
        const { hackathon_id, name } = req.body;

        const { data, error } = await supabaseAdmin
            .from('teams')
            .insert({ hackathon_id, name })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.delete('/teams/:id', auditMiddleware('DELETE', 'team'), async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('teams')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Team deleted' });
    } catch (error) {
        next(error);
    }
});

// ========================
// PARTICIPANTS
// ========================

router.get('/teams/:id/participants', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('participants')
            .select('*')
            .eq('team_id', req.params.id);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.post('/participants', auditMiddleware('CREATE', 'participant'), async (req, res, next) => {
    try {
        const { team_id, name, email, phone, role } = req.body;

        const { data, error } = await supabaseAdmin
            .from('participants')
            .insert({ team_id, name, email, phone, role: role || 'member' })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.delete('/participants/:id', auditMiddleware('DELETE', 'participant'), async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('participants')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Participant removed' });
    } catch (error) {
        next(error);
    }
});

// ========================
// JUDGES
// ========================

router.get('/judges', async (req, res, next) => {
    try {
        const { hackathon_id } = req.query;
        let query = supabaseAdmin.from('judges').select('*');

        if (hackathon_id) {
            query = query.eq('hackathon_id', hackathon_id);
        }

        const { data, error } = await query.order('name');
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.post('/judges', auditMiddleware('CREATE', 'judge'), async (req, res, next) => {
    try {
        const { hackathon_id, name, email, expertise } = req.body;

        const { data, error } = await supabaseAdmin
            .from('judges')
            .insert({ hackathon_id, name, email, expertise })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.delete('/judges/:id', auditMiddleware('DELETE', 'judge'), async (req, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('judges')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Judge removed' });
    } catch (error) {
        next(error);
    }
});

// ========================
// SUBMISSIONS
// ========================

router.get('/hackathons/:id/submissions', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('submissions')
            .select(`
                *,
                teams (id, name)
            `)
            .eq('hackathon_id', req.params.id)
            .order('submitted_at');

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// ========================
// SCORES
// ========================

router.get('/hackathons/:id/scores', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('scores')
            .select(`
                *,
                submissions (id, title, team_id, teams (id, name)),
                judges (id, name)
            `)
            .eq('submissions.hackathon_id', req.params.id);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.post('/scores', auditMiddleware('CREATE', 'score'), async (req, res, next) => {
    try {
        const { submission_id, judge_id, innovation, technical, presentation, impact, feedback } = req.body;

        const { data, error } = await supabaseAdmin
            .from('scores')
            .insert({ submission_id, judge_id, innovation, technical, presentation, impact, feedback })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

router.get('/hackathons/:id/leaderboard', async (req, res, next) => {
    try {
        const { data: submissions, error } = await supabaseAdmin
            .from('submissions')
            .select(`
                id,
                title,
                teams (id, name),
                scores (total)
            `)
            .eq('hackathon_id', req.params.id);

        if (error) throw error;

        // Calculate average scores and rank
        const leaderboard = submissions.map(sub => {
            const scores = sub.scores || [];
            const avgScore = scores.length > 0
                ? scores.reduce((sum, s) => sum + s.total, 0) / scores.length
                : 0;
            return {
                submission_id: sub.id,
                title: sub.title,
                team: sub.teams,
                average_score: Math.round(avgScore * 100) / 100,
                judge_count: scores.length,
            };
        }).sort((a, b) => b.average_score - a.average_score);

        res.json({ success: true, data: leaderboard });
    } catch (error) {
        next(error);
    }
});

// ========================
// EMAILS
// ========================

router.post('/emails/send', emailLimiter, auditMiddleware('SEND', 'email'), async (req, res, next) => {
    try {
        const { hackathon_id, template, subject, body_html, recipients } = req.body;

        if (!recipients?.length) {
            throw new ValidationError('No recipients specified');
        }

        // Queue all emails
        for (const recipient of recipients) {
            await queueEmail({
                hackathonId: hackathon_id,
                template,
                recipientEmail: recipient.email,
                recipientName: recipient.name,
                subject,
                bodyHtml: body_html,
            });
        }

        // Log the send
        await logEmailSend({
            hackathonId: hackathon_id,
            subject,
            template,
            recipientsCount: recipients.length,
            sentBy: req.user.id,
        });

        // Process queue (async)
        processEmailQueue().catch(err => logger.error({ err }, 'Email queue processing failed'));

        res.json({
            success: true,
            message: `${recipients.length} emails queued for sending`,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/emails/logs', async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('email_logs')
            .select('*')
            .order('sent_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// ========================
// EXPORT
// ========================

router.get('/export/hackathons/:id', async (req, res, next) => {
    try {
        const { format = 'csv' } = req.query;
        const hackathonId = req.params.id;

        // Get hackathon with all related data
        const { data: hackathon } = await supabaseAdmin
            .from('hackathons')
            .select('*, hackathon_types (name)')
            .eq('id', hackathonId)
            .single();

        const { data: teams } = await supabaseAdmin
            .from('teams')
            .select('*, participants (*)')
            .eq('hackathon_id', hackathonId);

        const { data: submissions } = await supabaseAdmin
            .from('submissions')
            .select('*, scores (*)')
            .eq('hackathon_id', hackathonId);

        if (format === 'csv') {
            // Simple CSV export
            let csv = 'Team Name,Leader,Members,Submission Title,Average Score\n';

            teams?.forEach(team => {
                const leader = team.participants?.find(p => p.role === 'leader');
                const members = team.participants?.filter(p => p.role === 'member').map(p => p.name).join('; ');
                const submission = submissions?.find(s => s.team_id === team.id);
                const avgScore = submission?.scores?.length
                    ? (submission.scores.reduce((sum, s) => sum + s.total, 0) / submission.scores.length).toFixed(2)
                    : 'N/A';

                csv += `"${team.name}","${leader?.name || 'N/A'}","${members}","${submission?.title || 'No submission'}",${avgScore}\n`;
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=hackathon-${hackathon?.slug || hackathonId}.csv`);
            res.send(csv);
        } else {
            // JSON export
            res.json({
                success: true,
                data: {
                    hackathon,
                    teams,
                    submissions,
                },
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
