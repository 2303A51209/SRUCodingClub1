const pino = require('pino');
const config = require('../config');

const transport = config.env === 'development'
    ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
        },
    }
    : undefined;

const logger = pino({
    level: config.env === 'development' ? 'debug' : 'info',
    transport,
    base: {
        env: config.env,
    },
});

module.exports = logger;
