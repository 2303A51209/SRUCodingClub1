-- ============================================
-- HACKATHONS PLATFORM - ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADMIN USERS - Admin only
-- ============================================
CREATE POLICY admin_users_service_key ON admin_users
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- HACKATHON TYPES - Public read, admin write
-- ============================================
CREATE POLICY hackathon_types_read ON hackathon_types
    FOR SELECT
    USING (true);

CREATE POLICY hackathon_types_admin ON hackathon_types
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- HACKATHONS - Public read (non-draft), admin write
-- ============================================
CREATE POLICY hackathons_public_read ON hackathons
    FOR SELECT
    USING (status NOT IN ('draft', 'cancelled'));

CREATE POLICY hackathons_admin ON hackathons
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- TEAMS - Public read, public insert (registration), admin all
-- ============================================
CREATE POLICY teams_read ON teams
    FOR SELECT
    USING (true);

CREATE POLICY teams_insert ON teams
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM hackathons h 
            WHERE h.id = hackathon_id 
            AND h.status = 'upcoming'
            AND h.registration_deadline > now()
        )
    );

CREATE POLICY teams_admin ON teams
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- PARTICIPANTS - Public read, insert during registration
-- ============================================
CREATE POLICY participants_read ON participants
    FOR SELECT
    USING (true);

CREATE POLICY participants_insert ON participants
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams t
            JOIN hackathons h ON h.id = t.hackathon_id
            WHERE t.id = team_id
            AND h.status = 'upcoming'
            AND h.registration_deadline > now()
        )
    );

CREATE POLICY participants_admin ON participants
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- JUDGES - Public read (names only via API), admin write
-- ============================================
CREATE POLICY judges_read ON judges
    FOR SELECT
    USING (true);

CREATE POLICY judges_admin ON judges
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- SUBMISSIONS - Public read, admin write
-- ============================================
CREATE POLICY submissions_read ON submissions
    FOR SELECT
    USING (true);

CREATE POLICY submissions_admin ON submissions
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- SCORES - Admin only (no public access)
-- ============================================
CREATE POLICY scores_admin ON scores
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- EMAIL QUEUE - Admin only
-- ============================================
CREATE POLICY email_queue_admin ON email_queue
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- EMAIL LOGS - Admin only
-- ============================================
CREATE POLICY email_logs_admin ON email_logs
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- AUDIT LOGS - Admin only (service key)
-- ============================================
CREATE POLICY audit_logs_admin ON audit_logs
    FOR ALL
    USING (auth.role() = 'service_role');
