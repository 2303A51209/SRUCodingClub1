/**
 * Hackathons Platform - Express App
 * Main application setup with all middleware
 */
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const apiRoutes = require('./routes');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Request ID for tracing
app.use((req, res, next) => {
    req.id = require('crypto').randomUUID();
    res.setHeader('X-Request-ID', req.id);
    next();
});

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for inline scripts
}));

// Block sensitive paths
app.use((req, res, next) => {
    const blocked = ['/backend', '/.env', '/.git', '/node_modules'];
    const lowerPath = req.path.toLowerCase();
    if (blocked.some(b => lowerPath.startsWith(b))) {
        return res.status(404).send('Not found');
    }
    next();
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../frontend/public')));
app.use('/css', express.static(path.join(__dirname, '../../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../../frontend/js')));

// CORS
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
}));

// Rate limiting for API
app.use('/api', apiLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(config.cookie.secret));

// Request logging
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        logger.info({
            message: 'API Request',
            method: req.method,
            path: req.path,
            requestId: req.id,
        });
    }
    next();
});

// API routes
app.use('/api', apiRoutes);

// Serve index.html for root and unknown routes (SPA-like behavior)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
});

// 404 for non-API routes returns index.html
app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
        return res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
    }
    next();
});

// 404 handler for API
app.use('/api', (req, res, next) => {
    const { ApiError } = require('./utils/errors');
    next(new ApiError(404, `Not found: ${req.originalUrl}`));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
