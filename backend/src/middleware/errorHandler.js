const logger = require('../utils/logger');
const config = require('../config');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log the error
    logger.error({
        message,
        statusCode,
        stack: err.stack,
        requestId: req.id,
        path: req.path,
        method: req.method,
    });

    res.status(statusCode).json({
        success: false,
        error: {
            message: statusCode === 500 && config.env === 'production' ? 'Internal Server Error' : message,
            // Only show stack in development
            stack: config.env === 'development' ? err.stack : undefined,
        },
    });
};

module.exports = errorHandler;
