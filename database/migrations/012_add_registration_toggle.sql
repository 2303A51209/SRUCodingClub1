-- Add registration_enabled column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS registration_enabled BOOLEAN DEFAULT TRUE;
