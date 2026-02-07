-- Migration 008: Add team profile fields

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS github_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS website_url text;

-- Add index for role to speed up team queries (if not already exists)
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
