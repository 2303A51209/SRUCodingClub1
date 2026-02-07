/**
 * Hackathons Platform - Configuration
 * Loads environment variables and exports config object
 */
require('dotenv').config();

const config = {
    // Server
    port: parseInt(process.env.PORT, 10) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Supabase (Separate project for hackathons)
    supabase: {
        url: process.env.HACKATHONS_SUPABASE_URL,
        anonKey: process.env.HACKATHONS_SUPABASE_ANON_KEY,
        serviceKey: process.env.HACKATHONS_SUPABASE_SERVICE_KEY,
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    // Cookie
    cookie: {
        secret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },

    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    },

    // Gmail SMTP (for bulk emails)
    gmail: {
        user: process.env.GMAIL_SMTP_USER,
        appPassword: process.env.GMAIL_SMTP_APP_PASSWORD,
    },

    // Email settings
    email: {
        fromName: process.env.EMAIL_FROM_NAME || 'SR Coding Club Hackathons',
        fromAddress: process.env.EMAIL_FROM_ADDRESS || 'hackathons@srcodingclub.com',
        rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT, 10) || 500,
    },
};

// Validate required config in production
if (config.nodeEnv === 'production') {
    const required = ['supabase.url', 'supabase.anonKey', 'jwt.secret'];
    required.forEach(key => {
        const keys = key.split('.');
        let value = config;
        keys.forEach(k => { value = value?.[k]; });
        if (!value) {
            console.error(`Missing required config: ${key}`);
            process.exit(1);
        }
    });
}

module.exports = config;
