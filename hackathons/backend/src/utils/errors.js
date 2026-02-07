/**
 * Hackathons Platform - Error Classes
 */

class ApiError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(404, message);
    }
}

class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}

class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(403, message);
    }
}

class ValidationError extends ApiError {
    constructor(message = 'Validation failed', errors = []) {
        super(400, message);
        this.errors = errors;
    }
}

class RateLimitError extends ApiError {
    constructor(message = 'Too many requests') {
        super(429, message);
    }
}

module.exports = {
    ApiError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ValidationError,
    RateLimitError,
};
