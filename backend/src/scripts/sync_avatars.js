const fs = require('fs');
const path = require('path');
const { getSupabaseAdmin } = require('../config/supabase');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const IMG_DIR = 'C:\\Users\\sprus\\OneDrive\\Desktop\\ALLNEW2\\assets\\img';
const BUCKET = 'avatars';

// Mapping: Filename (lowercase) -> User Email or Name Part
const MAPPING = {
    'nagula goutham.jpg': '2303A51209@sru.edu.in', // GOUTHAM NAGULA
    'rishik koyyada.jpg': '2403A52263@sru.edu.in',
    'raj kumar.jpg': '2303a51782@sru.edu.in', // RAJ KUMAR GURRAPU
    'raju gujja.jpg': '2403A52018@sru.edu.in',
    'sai sathwik .jpg': '2303A51221@sru.edu.in', // SAI SATHWIK THOTAKURI
    'sathwika bejjanki.png': '2403A52190@sru.edu.in',
    'shree deepthi.jpg': '2303A52303@sru.edu.in', // Deepthi Nimmagadda
    'trinisha reddy.jpg': '2503A51269@sru.edu.in',
    'dritisri vemula.jpg': '2403A52236@sru.edu.in',
    'suhas.jpg': '2503A52172@sru.edu.in', // NALLALA SUHAS REDDY
    'rishik.jpg': null, // Skip duplicate or handle if primary missing
};

async function syncAvatars() {
    console.log('🚀 Starting Avatar Sync...');
    const supabase = getSupabaseAdmin();

    try {
        const files = fs.readdirSync(IMG_DIR);

        for (const file of files) {
            const lowerName = file.toLowerCase();
            const targetEmail = MAPPING[lowerName];

            if (!targetEmail) {
                console.log(`⚠️  No mapping found for: ${file}`);
                continue;
            }

            console.log(`Processing: ${file} -> ${targetEmail}`);

            // 1. Read file
            const filePath = path.join(IMG_DIR, file);
            const fileBuffer = fs.readFileSync(filePath);

            // 2. Upload to Supabase
            // Use a clean filename for storage
            const storagePath = `team/${Date.now()}_${file.replace(/\s+/g, '_')}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(storagePath, fileBuffer, {
                    contentType: file.endsWith('.png') ? 'image/png' : 'image/jpeg',
                    upsert: true
                });

            if (uploadError) {
                console.error(`❌ Upload failed for ${file}:`, uploadError.message);
                continue;
            }

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(storagePath);

            console.log(`   Uploaded to: ${publicUrl}`);

            // 4. Update User Profile
            const { error: dbError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('email', targetEmail);

            if (dbError) {
                console.error(`❌ Database update failed for ${targetEmail}:`, dbError.message);
            } else {
                console.log(`✅ Updated avatar for ${targetEmail}`);
            }
        }

        console.log('✨ Sync Complete!');

    } catch (err) {
        console.error('❌ Application Error:', err);
    }
}

syncAvatars();
