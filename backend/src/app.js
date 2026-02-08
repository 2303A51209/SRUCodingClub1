const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
// const xss = require('xss-clean'); // Moved to middleware/sanitizer
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const config = require('./config');
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const apiRoutes = require('./routes');
const { ApiError } = require('./utils/errors');

const app = express();

// 1. Request ID (Traceability)
app.use(requestId);

// 2. Security Headers
// CSP disabled for development - inline scripts are used in frontend
// In production, move scripts to external files and enable strict CSP
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now
}));

// 3. Block access to sensitive files/directories before static serving
app.use((req, res, next) => {
    const blocked = ['/backend', '/database', '/.env', '/.git', '/node_modules', '/package.json', '/package-lock.json'];
    const lowerPath = req.path.toLowerCase();
    if (blocked.some(b => lowerPath.startsWith(b))) {
        return res.status(404).send('Not found');
    }
    next();
});

// 4. Serve Static Files from project root (GitHub Pages compatible structure)
app.use(express.static(path.join(__dirname, '../../')));

// 4. CORS - Allow all origins (same domain on Render)
app.use(cors({
    origin: true,
    credentials: true,
}));

// 5. Rate Limiting (API Only)
app.use('/api', apiLimiter);

// 5. Body Parsing
app.use(express.json({ limit: '10mb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.cookie.secret));

const sanitizer = require('./middleware/sanitizer');
// ...
// 6. Security (Data Sanitization & Param Pollution)
app.use(sanitizer());
app.use(hpp());

// 7. Request Logging
app.use((req, res, next) => {
    logger.info({
        message: 'Incoming Request',
        method: req.method,
        path: req.path,
        requestId: req.id,
        ip: req.ip,
    });
    next();
});

// 8. Routes
app.use('/api/v1', apiRoutes);

// 404 Handler
app.use((req, res, next) => {
    next(new ApiError(404, `Not found: ${req.originalUrl}`));
});

// 9. Global Error Handler
app.use(errorHandler);

module.exports = app;
