/**
 * Database Seed Script - Core Team & Events
 * Run with: node seed.js
 */

require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Core Team Data (Official List)
const coreTeam = [
    {
        name: 'RAJ KUMAR GURRAPU',
        title: 'CHAIR',
        role: 'admin',
        email: '2303a51782@sru.edu.in',
        linkedin: 'https://www.linkedin.com/in/rajkumargurrapu'
    },
    {
        name: 'Deepthi Nimmagadda',
        title: 'VICE CHAIR',
        role: 'admin',
        email: '2303A52303@sru.edu.in',
        linkedin: 'https://www.linkedin.com/in/shree-deepthi-nimmagadda-83835427b'
    },
    {
        name: 'RAJU GUJJA',
        title: 'SECRETARY',
        role: 'team',
        email: '2403A52018@sru.edu.in',
        linkedin: 'https://www.linkedin.com/in/raju-gujja-14917831b'
    },
    {
        name: 'SAI SATHWIK THOTAKURI',
        title: 'TREASURER',
        role: 'team',
        email: '2303A51221@sru.edu.in',
        linkedin: 'https://www.linkedin.com/in/sai-sathwik-thotakuri-6083492bb'
    },
    {
        name: 'TRINISHA REDDY',
        title: 'MARKETING & PR SECRETARY',
        role: 'team',
        email: '2503A51269@sru.edu.in',
        linkedin: 'http://linkedin.com/in/trinisha-reddy-a1304136b'
    },
    {
        name: 'GOUTHAM NAGULA',
        title: 'WEB MASTER',
        role: 'team',
        email: '2303A51209@sru.edu.in',
        linkedin: 'https://www.linkedin.com/in/nagula-goutham-1a530134b'
    },
    {
        name: 'BEJJANKI SATHWIKA',
        title: 'MEMBERSHIP CHAIR',
        role: 'team',
        email: '2403A52190@sru.edu.in',
        linkedin: 'https://www.linkedin.com/in/sathwika-bejjanki-57646a322'
    },
    {
        name: 'NALLALA SUHAS REDDY',
        title: 'CONTENT & CREATIVE HEAD',
        role: 'team',
        email: '2503A52172@sru.edu.in',
        linkedin: 'https://www.linkedin.com/in/nallala-suhas-reddy-673572380'
    },
    {
        name: 'Dritisri Vemula',
        title: 'DIGITAL & SOCIAL MEDIA HEAD',
        role: 'team',
        email: '2403A52236@sru.edu.in',
        linkedin: 'https://www.linkedin.com/in/dritisri-vemula-b035b42a2'
    },
    {
        name: 'RISHIK KOYYADA',
        title: 'MANAGEMENT HEAD',
        role: 'team',
        email: '2403A52263@sru.edu.in',
        linkedin: null
    }
];

// Minimal Events Data
const sampleEvents = [
    {
        title: 'Web Development Workshop',
        description: 'Learn modern web development with HTML, CSS, and JavaScript.',
        status: 'upcoming',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Room 101, CS Building',
    },
    {
        title: 'HackSRU 2026',
        description: 'Annual 24-hour hackathon! Build innovative projects and win prizes.',
        status: 'upcoming',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Main Auditorium',
    },
    {
        title: 'Python for Data Science',
        description: 'Introduction to Python programming with focus on data analysis.',
        status: 'upcoming',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Online (Zoom)',
    },
    {
        title: 'Monthly Meetup - April',
        description: 'Join us for our monthly community meetup!',
        status: 'upcoming',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Club Room, Block A',
    }
];

async function seedDatabase() {
    console.log('🌱 Starting database seed...\n');

    // 1. Seed Events
    console.log('📅 Seeding events...');
    // Simple insert, ignoring duplicates logic for now or we could check first. 
    // Since unique constraint is missing, we just insert.
    const { data: events, error: eventsError } = await supabase
        .from('events')
        .insert(sampleEvents)
        .select();

    if (eventsError) {
        console.error('❌ Error seeding events:', eventsError.message);
    } else {
        console.log(`✅ Inserted ${events?.length || 0} events`);
    }

    // 2. Seed Core Team
    console.log('\n👥 Seeding Core Team...');

    for (const member of coreTeam) {
        // Use provided email
        const email = member.email;
        const password = 'Password123!'; // Default password for seeded users

        console.log(`Processing ${member.name} (${email})...`);

        let userId;

        // Try to create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: member.name }
        });

        if (authError) {
            // If error is "User already registered", we need to find their ID.
            if (authError.message.includes('already registered') || authError.status === 422 || authError.message.includes('unique constraint')) {
                console.log(`  User already exists in Auth, looking up ID...`);
                // We can't easily query auth.users by email via client directly usually unless we list users.
                // Alternative: Update public.users by name if we assume they are linked.
                // Or, list users (pagination might be needed but for 10 users it's fine)
                const { data: { users: allAuthUsers } } = await supabase.auth.admin.listUsers();
                const found = allAuthUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
                if (found) {
                    userId = found.id;
                } else {
                    console.error(`  ❌ Auth user exists but couldn't find ID for ${email}`);
                    continue; // Skip
                }
            } else {
                console.error(`  ❌ Failed to create auth user: ${authError.message}`);
                continue;
            }
        } else {
            console.log(`  ✅ Created Auth User: ${authUser.user.id}`);
            userId = authUser.user.id;
        }

        if (!userId) continue;

        // 2. Upsert into public.users
        const { error: upsertError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                email: email,
                full_name: member.name,
                role: member.role,
                title: member.title,
                bio: `${member.title} of SR University Coding Club`,
                linkedin_url: member.linkedin
            }, { onConflict: 'id' });

        if (upsertError) {
            console.error(`  ❌ Failed to upsert public profile: ${upsertError.message}`);
        } else {
            console.log(`  ✅ Upserted public profile for ${member.name}`);
        }
    }

    console.log('\n🎉 Seed complete!\n');
}

seedDatabase().catch(console.error);
