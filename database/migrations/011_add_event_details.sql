-- Add rich content fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS prizes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;
