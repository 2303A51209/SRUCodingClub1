-- Migration: Gallery Table
-- Description: Create gallery table for storing event photos

CREATE TABLE IF NOT EXISTS gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'other',
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);
CREATE INDEX IF NOT EXISTS idx_gallery_event ON gallery(event_id);
CREATE INDEX IF NOT EXISTS idx_gallery_created ON gallery(created_at DESC);

-- Enable RLS
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Gallery items are publicly viewable"
    ON gallery FOR SELECT
    USING (true);

-- Team/Admin insert policy
CREATE POLICY "Team and admins can upload gallery items"
    ON gallery FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'team')
        )
    );

-- Admin delete policy
CREATE POLICY "Admins can delete gallery items"
    ON gallery FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
