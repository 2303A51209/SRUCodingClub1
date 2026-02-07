const { getSupabaseAdmin } = require('../config/supabase');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function resetEvents() {
    console.log('🚀 Resetting Events...');
    const supabase = getSupabaseAdmin();

    try {
        // 1. Delete all existing events
        console.log('🗑️  Deleting all events...');
        const { error: deleteError } = await supabase
            .from('events')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (deleteError) {
            console.error('❌ Failed to delete events:', deleteError.message);
            return;
        }

        // 2. Get a valid user ID for 'created_by' (e.g., admin)
        const { data: admin } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'admin')
            .limit(1)
            .single();

        const userId = admin?.id;
        if (!userId) {
            console.error('❌ No admin user found to assign events to.');
            return;
        }

        // 3. Seed new events
        const newEvents = [
            {
                title: 'CODE QUEST 2026',
                description: 'The ultimate coding quest challenge for this semester.',
                date: new Date('2026-03-15T10:00:00Z'),
                start_date: new Date('2026-03-15T10:00:00Z'),
                location: 'SR University, Lab 1',
                capacity: 100,
                status: 'upcoming',
                event_type: 'hackathon',
                created_by: userId,
                image_url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1000'
            },
            {
                title: 'Orientation 2026',
                description: 'Club orientation session for new members.',
                date: new Date('2026-02-20T11:00:00Z'),
                start_date: new Date('2026-02-20T11:00:00Z'),
                location: 'Auditorium',
                capacity: 200,
                status: 'upcoming',
                event_type: 'meetup',
                created_by: userId,
                image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1000'
            },
            {
                title: 'Unlock AI with Google Gemini Pro',
                description: 'A free session on using Gemini Pro API.',
                date: new Date('2026-02-10T14:00:00Z'),
                start_date: new Date('2026-02-10T14:00:00Z'),
                location: 'Seminar Hall',
                capacity: 150,
                status: 'upcoming',
                event_type: 'workshop',
                created_by: userId,
                image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000'
            }
        ];

        console.log('🌱 Seeding new events...');
        const { error: seedError } = await supabase
            .from('events')
            .insert(newEvents);

        if (seedError) {
            console.error('❌ Failed to seed events:', seedError.message);
        } else {
            console.log('✅ Successfully reset and seeded events!');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

resetEvents();
