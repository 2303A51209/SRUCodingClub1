const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY, // Service Role Key for backend usually, or Anon if using client client
        serviceKey: process.env.SUPABASE_SERVICE_KEY,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
        refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5500', // Update for Production
    },
    cookie: {
        secret: process.env.COOKIE_SECRET,
    }
};

module.exports = config;
