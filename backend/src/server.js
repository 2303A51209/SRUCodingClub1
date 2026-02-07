/**
 * Server Entry Point
 */

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const PORT = config.port || 3000;

const server = app.listen(PORT, () => {
    logger.info(`🚀 Server started on port ${PORT}`);
    logger.info(`📍 Environment: ${config.nodeEnv}`);
    logger.info(`📡 API: http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown
const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});
