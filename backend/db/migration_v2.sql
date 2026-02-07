-- Migration V2: Event System Enhancements

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enhance 'events' table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'workshop', -- content-based categorization
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE, -- New standard field
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,   -- New standard field
ADD COLUMN IF NOT EXISTS description_rich JSONB, -- For structured rich text
ADD COLUMN IF NOT EXISTS rules JSONB,            -- Array of rules
ADD COLUMN IF NOT EXISTS prizes JSONB,           -- Array of prize objects
ADD COLUMN IF NOT EXISTS schedule JSONB,         -- Array of schedule items
ADD COLUMN IF NOT EXISTS faq JSONB,              -- Array of Q&A
ADD COLUMN IF NOT EXISTS sponsors JSONB,         -- Array of sponsor objects
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb,            -- Toggle sections (show_sponsors, etc)
ADD COLUMN IF NOT EXISTS registration_config JSONB DEFAULT '{}'::jsonb; -- Registration rules (min_team_size, etc)

-- Update status check constraint to include new statuses
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check 
    CHECK (status IN ('draft', 'published', 'archived', 'upcoming', 'ongoing', 'completed', 'cancelled'));

-- Backfill start_date from existing date column if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'date') THEN
        UPDATE events SET start_date = date WHERE start_date IS NULL;
    END IF;
END $$;

-- 3. Create 'teams' table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL, -- Unique code to join
    leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to auth user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, name),
    UNIQUE(event_id, code)
);

-- 4. Create 'team_members' table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('invited', 'accepted', 'rejected')) DEFAULT 'accepted',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- 5. Enhance 'registrations' table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS track_id TEXT, -- Can be FK if tracks table exists, or just text
ADD COLUMN IF NOT EXISTS submission_data JSONB DEFAULT '{}'::jsonb, -- Custom fields (github, portfolio)
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- 6. RLS Policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Public teams view
DROP POLICY IF EXISTS "Public teams view" ON teams;
CREATE POLICY "Public teams view" ON teams FOR SELECT USING (true);

-- Policy: Authenticated users can create teams
DROP POLICY IF EXISTS "Auth create teams" ON teams;
CREATE POLICY "Auth create teams" ON teams FOR INSERT WITH CHECK (auth.uid() = leader_id);

-- Policy: Leader can update team
DROP POLICY IF EXISTS "Leader update team" ON teams;
CREATE POLICY "Leader update team" ON teams FOR UPDATE USING (auth.uid() = leader_id);

-- Policy: Members can view their team members
DROP POLICY IF EXISTS "View team members" ON team_members;
CREATE POLICY "View team members" ON team_members FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid()
    )
);

-- Policy: Leader can add members
DROP POLICY IF EXISTS "Leader add members" ON team_members;
CREATE POLICY "Leader add members" ON team_members FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM teams 
        WHERE teams.id = team_members.team_id 
        AND teams.leader_id = auth.uid()
    )
);
