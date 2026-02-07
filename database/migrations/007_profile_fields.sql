-- Migration: Add Additional Profile Fields
-- Adds fields for roll number, branch, year, skills that OAuth users can fill in later

-- Add new columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS roll_no text,
ADD COLUMN IF NOT EXISTS branch text,
ADD COLUMN IF NOT EXISTS year text,
ADD COLUMN IF NOT EXISTS skills text[], -- Array of skill strings
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email'; -- 'email', 'google', 'github'

-- Index for profile completion filtering
CREATE INDEX IF NOT EXISTS idx_users_profile_completed 
ON public.users(profile_completed);

-- Comment for documentation
COMMENT ON COLUMN public.users.profile_completed IS 'True when user has filled in all required profile fields (roll_no, branch, year)';
COMMENT ON COLUMN public.users.auth_provider IS 'Authentication provider: email, google, or github';
