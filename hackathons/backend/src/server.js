/**
 * Hackathons Platform - Server Entry Point
 * Runs on port 3001 (separate from main project on 3000)
 */
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const PORT = config.port;

const server = app.listen(PORT, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 HACKATHONS PLATFORM                                  ║
║   ────────────────────────────────────────────────────    ║
║   Server running on port ${PORT}                            ║
║   Environment: ${config.nodeEnv.padEnd(11)}                          ║
║                                                           ║
║   Public:  http://localhost:${PORT}/                        ║
║   Admin:   http://localhost:${PORT}/admin/login             ║
║   API:     http://localhost:${PORT}/api                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
