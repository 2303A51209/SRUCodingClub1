const { getSupabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

async function seed() {
    console.log('🌱 Starting Seed...');
    const supabase = getSupabaseAdmin();

    try {
        // 1. Create Team Members (if low count)
        // We use random UUIDs. They won't be able to login, but they will display.
        /* 
        const teamMembers = [
            {
                id: uuidv4(),
                email: 'rahul@example.com',
                full_name: 'Rahul Kumar',
                role: 'admin',
                title: 'President • Full Stack',
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul',
                created_at: new Date().toISOString()
            },
            {
                id: uuidv4(),
                email: 'ananya@example.com',
                full_name: 'Ananya Singh',
                role: 'team',
                title: 'Vice President • ML/AI',
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ananya',
                created_at: new Date().toISOString()
            },
            {
                id: uuidv4(),
                email: 'arjun@example.com',
                full_name: 'Arjun Reddy',
                role: 'team',
                title: 'Tech Lead • Backend',
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
                created_at: new Date().toISOString()
            },
            {
                id: uuidv4(),
                email: 'sneha@example.com',
                full_name: 'Sneha Patel',
                role: 'team',
                title: 'Events Lead • Frontend',
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sneha',
                created_at: new Date().toISOString()
            }
        ];

        // Check if team exists
        const { data: existingTeam } = await supabase
            .from('users')
            .select('id')
            .in('email', teamMembers.map(t => t.email));

        if (!existingTeam || existingTeam.length === 0) {
            console.log('... Inserting Team Members');
            const { error: userError } = await supabase.from('users').upsert(teamMembers);
            if (userError) console.error('Error inserting users:', userError);
        } else {
            console.log('... Team already exists, skipping.');
        }
        */

        // Get an ID for creator (use first team member or any existing)
        const { data: creator } = await supabase.from('users').select('id').limit(1).single();
        const creatorId = creator?.id || uuidv4();

        // 2. Create Events
        const events = [
            {
                title: 'Weekend Hackathon',
                description: '48 hours to build, ship, and present. Prizes for top 3 projects.',
                date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
                location: 'CS Building, Room 302',
                status: 'upcoming',
                is_public: true,
                created_by: creatorId
            },
            {
                title: 'React Workshop',
                description: 'Build a todo app from scratch with React hooks and context.',
                date: new Date(Date.now() + 86400000 * 12).toISOString(), // 12 days
                location: 'Online',
                status: 'upcoming',
                is_public: true,
                created_by: creatorId
            },
            {
                title: 'Git & GitHub 101',
                description: 'Beginner-friendly session on version control and collaboration.',
                date: new Date(Date.now() + 86400000 * 20).toISOString(), // 20 days
                location: 'CS Lab 1',
                status: 'upcoming',
                is_public: true,
                created_by: creatorId
            }
        ];

        console.log('... Inserting Events');
        for (const event of events) {
            // Upsert based on title to avoid dupes? Supabase upsert needs Primary Key.
            // We'll just insert if not exists.
            const { data: existing } = await supabase.from('events').select('id').eq('title', event.title).maybeSingle();
            if (!existing) {
                await supabase.from('events').insert(event);
            }
        }

        // 3. Create Projects
        const projects = [
            {
                title: 'Campus Navigate',
                description: 'AR navigation for university campus',
                status: 'active',
                is_featured: true,
                tags: ['AR', 'Mobile'],
                created_by: creatorId
            },
            {
                title: 'Study Buddy',
                description: 'Find peers for group study sessions',
                status: 'active',
                is_featured: false,
                tags: ['Web', 'React'],
                created_by: creatorId
            },
            {
                title: 'Algo Visualizer',
                description: 'Visualize sorting algorithms',
                status: 'active',
                is_featured: true,
                tags: ['Education', 'Algorithms'],
                created_by: creatorId
            }
        ];

        console.log('... Inserting Projects');
        for (const proj of projects) {
            const { data: existing } = await supabase.from('projects').select('id').eq('title', proj.title).maybeSingle();
            if (!existing) {
                await supabase.from('projects').insert(proj);
            }
        }

        console.log('✅ Seed Complete!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seed Failed:', err);
        process.exit(1);
    }
}

seed();
