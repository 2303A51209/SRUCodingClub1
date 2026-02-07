-- Migration: Performance Indexes
-- Add missing indexes for frequently filtered columns

-- Index for event status filtering
CREATE INDEX IF NOT EXISTS idx_events_status 
ON public.events(status);

-- Index for event date filtering (commonly used for upcoming/past)
CREATE INDEX IF NOT EXISTS idx_events_date_desc 
ON public.events(date DESC);

-- Composite index for registrations lookup (event + user)
CREATE INDEX IF NOT EXISTS idx_registrations_event_user 
ON public.registrations(event_id, user_id);

-- Index for registrations status
CREATE INDEX IF NOT EXISTS idx_registrations_status 
ON public.registrations(status);

-- Index for announcements target_role
CREATE INDEX IF NOT EXISTS idx_announcements_target_role 
ON public.announcements(target_role);

-- Index for gallery category
CREATE INDEX IF NOT EXISTS idx_gallery_category 
ON public.gallery_items(category);
