-- Fix Status Constraint
-- Run this to allow 'upcoming' and other new statuses in the events table

-- 1. Drop the old constraint if it exists
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;

-- 2. Add the new constraint with all allowed values
ALTER TABLE events ADD CONSTRAINT events_status_check 
    CHECK (status IN ('draft', 'published', 'archived', 'upcoming', 'ongoing', 'completed', 'cancelled'));

-- 3. Verify it worked (optional metadata update)
COMMENT ON CONSTRAINT events_status_check ON events IS 'Validation for event status (v2 update)';
