const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

// Validate required config
if (!config.supabase.url) {
    console.error('SUPABASE_URL is not set in environment variables');
    throw new Error('Missing Supabase URL - check your .env file');
}

// Use service key if available, otherwise fall back to anon key
const adminKey = config.supabase.serviceKey || config.supabase.key;

if (!adminKey) {
    console.error('Neither SUPABASE_SERVICE_KEY nor SUPABASE_KEY is set');
    throw new Error('Missing Supabase Key - check your .env file');
}

// Service Role Client (Admin access - Use carefully)
const supabaseAdmin = createClient(config.supabase.url, adminKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// Public client using anon key (for public routes)
const getSupabaseClient = () => {
    return createClient(config.supabase.url, config.supabase.key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    });
};

// Get admin client (Create new instance each time to avoid state issues)
const getSupabaseAdmin = () => {
    // console.log('DEBUG: Creating new Supabase Admin Client'); 
    return createClient(config.supabase.url, adminKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

module.exports = {
    supabaseAdmin,
    getSupabaseClient,
    getSupabaseAdmin,
};
