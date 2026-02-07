/**
 * Hackathons Platform - Supabase Client
 * Separate Supabase project for hackathons
 */
const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

// Client for public operations (uses anon key with RLS)
const supabase = createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: false,
        },
    }
);

// Admin client for backend operations (bypasses RLS)
const supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

module.exports = {
    supabase,
    supabaseAdmin,
};
