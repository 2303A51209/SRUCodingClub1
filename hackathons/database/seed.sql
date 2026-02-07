-- ============================================
-- HACKATHONS PLATFORM - SEED DATA
-- Sample data for development and testing
-- ============================================

-- Insert admin user
-- Note: You must also create this user in Supabase Auth
INSERT INTO admin_users (email, name, role) VALUES
    ('admin@srcodingclub.com', 'Admin User', 'super_admin');

-- Insert hackathon types
INSERT INTO hackathon_types (name, description) VALUES
    ('24-Hour Sprint', 'Intense 24-hour coding challenge'),
    ('Week-long Hackathon', 'Extended hackathon over 7 days'),
    ('Beginner Friendly', 'Perfect for first-time participants'),
    ('AI/ML Challenge', 'Focus on artificial intelligence and machine learning'),
    ('Web Development', 'Full-stack web application development');

-- Insert sample hackathons
INSERT INTO hackathons (
    type_id, title, slug, description, rules, prizes,
    start_date, end_date, registration_deadline, max_team_size, status
) VALUES
    (
        (SELECT id FROM hackathon_types WHERE name = '24-Hour Sprint'),
        'Code Sprint 2026',
        'code-sprint-2026',
        'Join us for an exciting 24-hour coding challenge! Build innovative solutions to real-world problems.',
        '1. Teams of 2-4 members\n2. All code must be written during the event\n3. Use of open-source libraries is allowed\n4. Projects must be original work',
        '🥇 1st Place: ₹50,000\n🥈 2nd Place: ₹30,000\n🥉 3rd Place: ₹20,000',
        '2026-02-15 09:00:00+05:30',
        '2026-02-16 09:00:00+05:30',
        '2026-02-10 23:59:59+05:30',
        4,
        'upcoming'
    ),
    (
        (SELECT id FROM hackathon_types WHERE name = 'AI/ML Challenge'),
        'AI Innovation Challenge',
        'ai-innovation-2026',
        'Push the boundaries of AI and machine learning. Create solutions that leverage the power of intelligent systems.',
        '1. Teams of 1-3 members\n2. Pre-trained models allowed\n3. Must include working demo\n4. Documentation required',
        '🥇 1st Place: ₹75,000 + Internship\n🥈 2nd Place: ₹45,000\n🥉 3rd Place: ₹25,000',
        '2026-03-01 10:00:00+05:30',
        '2026-03-08 18:00:00+05:30',
        '2026-02-25 23:59:59+05:30',
        3,
        'upcoming'
    ),
    (
        (SELECT id FROM hackathon_types WHERE name = 'Beginner Friendly'),
        'First Code Challenge',
        'first-code-2025',
        'Your first step into the world of hackathons! Perfect for beginners.',
        '1. Open to all skill levels\n2. Mentors available throughout\n3. Focus on learning',
        'Participation certificates for all!\nTop 10 teams get swag boxes.',
        '2025-12-01 09:00:00+05:30',
        '2025-12-01 21:00:00+05:30',
        '2025-11-28 23:59:59+05:30',
        4,
        'completed'
    );

-- Insert sample judges
INSERT INTO judges (hackathon_id, name, email, expertise) VALUES
    ((SELECT id FROM hackathons WHERE slug = 'code-sprint-2026'), 'Dr. Priya Sharma', 'priya.sharma@example.com', 'Full-Stack Development'),
    ((SELECT id FROM hackathons WHERE slug = 'code-sprint-2026'), 'Rahul Verma', 'rahul.verma@example.com', 'Cloud Architecture'),
    ((SELECT id FROM hackathons WHERE slug = 'ai-innovation-2026'), 'Dr. Arun Kumar', 'arun.kumar@example.com', 'Machine Learning'),
    ((SELECT id FROM hackathons WHERE slug = 'ai-innovation-2026'), 'Sneha Patel', 'sneha.patel@example.com', 'AI Ethics');

-- Insert sample teams for completed hackathon
INSERT INTO teams (hackathon_id, name) VALUES
    ((SELECT id FROM hackathons WHERE slug = 'first-code-2025'), 'Code Warriors'),
    ((SELECT id FROM hackathons WHERE slug = 'first-code-2025'), 'Binary Builders'),
    ((SELECT id FROM hackathons WHERE slug = 'first-code-2025'), 'Debug Demons');

-- Insert sample participants
INSERT INTO participants (team_id, name, email, role) VALUES
    ((SELECT id FROM teams WHERE name = 'Code Warriors'), 'Amit Singh', 'amit@example.com', 'leader'),
    ((SELECT id FROM teams WHERE name = 'Code Warriors'), 'Priya Reddy', 'priya@example.com', 'member'),
    ((SELECT id FROM teams WHERE name = 'Binary Builders'), 'Raj Patel', 'raj@example.com', 'leader'),
    ((SELECT id FROM teams WHERE name = 'Binary Builders'), 'Ananya Sharma', 'ananya@example.com', 'member'),
    ((SELECT id FROM teams WHERE name = 'Debug Demons'), 'Vikram Joshi', 'vikram@example.com', 'leader');

-- Insert sample submissions
INSERT INTO submissions (team_id, hackathon_id, title, description, repo_url, demo_url) VALUES
    (
        (SELECT id FROM teams WHERE name = 'Code Warriors'),
        (SELECT id FROM hackathons WHERE slug = 'first-code-2025'),
        'EcoTracker',
        'An app to track and reduce your carbon footprint',
        'https://github.com/example/ecotracker',
        'https://ecotracker.demo.com'
    ),
    (
        (SELECT id FROM teams WHERE name = 'Binary Builders'),
        (SELECT id FROM hackathons WHERE slug = 'first-code-2025'),
        'StudyBuddy',
        'AI-powered study companion for students',
        'https://github.com/example/studybuddy',
        'https://studybuddy.demo.com'
    );
