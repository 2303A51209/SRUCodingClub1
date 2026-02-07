-- Migration: Drive Folders Table
-- Run this in Supabase SQL Editor

-- Create drive_folders table
CREATE TABLE IF NOT EXISTS drive_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,               -- Display name (e.g., "Orientation 2025")
    folder_url TEXT NOT NULL,         -- Google Drive URL or folder ID
    category TEXT DEFAULT 'event',    -- Category for filtering (event, workshop, meetup, celebration)
    is_active BOOLEAN DEFAULT true,   -- Toggle folder on/off
    display_order INTEGER DEFAULT 0,  -- For custom ordering
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE drive_folders ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active folders
DROP POLICY IF EXISTS "Public view active folders" ON drive_folders;
CREATE POLICY "Public view active folders" ON drive_folders 
    FOR SELECT USING (is_active = true);

-- Policy: Admins can do everything (using service key bypasses RLS anyway)
-- This is just for documentation purposes

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_drive_folders_active ON drive_folders(is_active);
CREATE INDEX IF NOT EXISTS idx_drive_folders_order ON drive_folders(display_order);

-- Insert the existing Orientation folder as seed data
INSERT INTO drive_folders (name, folder_url, category) VALUES
('Orientation 2025', 'https://drive.google.com/drive/folders/1bomEAEVi7Lz5q7SjRNVG_yCvQQkRIr-e', 'event');
