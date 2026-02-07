/**
 * Hackathons Platform - Error Handler Middleware
 * Global error handling for all routes
 */
const logger = require('../utils/logger');
const { ApiError } = require('../utils/errors');
const config = require('../config');

const errorHandler = (err, req, res, next) => {
    // Default to 500 if no status code
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || null;

    // Log error
    if (statusCode >= 500) {
        logger.error({
            err,
            requestId: req.id,
            path: req.path,
            method: req.method,
        }, 'Server error');
    } else {
        logger.warn({
            statusCode,
            message,
            path: req.path,
            method: req.method,
        }, 'Client error');
    }

    // Build response
    const response = {
        success: false,
        status: err.status || 'error',
        message,
    };

    // Include validation errors if present
    if (errors) {
        response.errors = errors;
    }

    // Include stack trace in development
    if (config.nodeEnv === 'development' && statusCode >= 500) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
