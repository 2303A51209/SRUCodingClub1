-- ============================================
-- HACKATHONS PLATFORM - DATABASE SCHEMA
-- Separate Supabase project: srcc-hackathons
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ADMIN USERS (for authentication)
-- ============================================
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for email lookups
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- ============================================
-- HACKATHON TYPES
-- ============================================
CREATE TABLE hackathon_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- HACKATHONS
-- ============================================
CREATE TABLE hackathons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_id UUID REFERENCES hackathon_types(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    rules TEXT,
    prizes TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    registration_deadline TIMESTAMPTZ,
    max_team_size INT DEFAULT 4 CHECK (max_team_size >= 1 AND max_team_size <= 10),
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'upcoming', 'live', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_hackathons_status ON hackathons(status);
CREATE INDEX idx_hackathons_start_date ON hackathons(start_date);
CREATE INDEX idx_hackathons_slug ON hackathons(slug);

-- ============================================
-- TEAMS
-- ============================================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(hackathon_id, name)
);

CREATE INDEX idx_teams_hackathon ON teams(hackathon_id);

-- ============================================
-- PARTICIPANTS
-- ============================================
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_participants_team ON participants(team_id);
CREATE INDEX idx_participants_email ON participants(email);

-- ============================================
-- JUDGES
-- ============================================
CREATE TABLE judges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    expertise TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_judges_hackathon ON judges(hackathon_id);

-- ============================================
-- SUBMISSIONS
-- ============================================
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    repo_url TEXT,
    demo_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_submissions_hackathon ON submissions(hackathon_id);
CREATE INDEX idx_submissions_team ON submissions(team_id);

-- ============================================
-- SCORES
-- ============================================
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
    innovation INT NOT NULL CHECK (innovation BETWEEN 0 AND 10),
    technical INT NOT NULL CHECK (technical BETWEEN 0 AND 10),
    presentation INT NOT NULL CHECK (presentation BETWEEN 0 AND 10),
    impact INT NOT NULL CHECK (impact BETWEEN 0 AND 10),
    total INT GENERATED ALWAYS AS (innovation + technical + presentation + impact) STORED,
    feedback TEXT,
    scored_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(submission_id, judge_id)
);

CREATE INDEX idx_scores_submission ON scores(submission_id);

-- ============================================
-- EMAIL QUEUE (for async processing)
-- ============================================
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hackathon_id UUID REFERENCES hackathons(id) ON DELETE SET NULL,
    template TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    body_html TEXT,
    smtp_type TEXT NOT NULL DEFAULT 'bulk' CHECK (smtp_type IN ('system', 'bulk')),
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_created ON email_queue(created_at);

-- ============================================
-- EMAIL LOGS (history of sent emails)
-- ============================================
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hackathon_id UUID REFERENCES hackathons(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    template TEXT NOT NULL,
    recipients_count INT NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT now(),
    sent_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX idx_email_logs_hackathon ON email_logs(hackathon_id);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hackathons_updated_at
    BEFORE UPDATE ON hackathons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
