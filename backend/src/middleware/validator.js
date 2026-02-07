const { ApiError } = require('../utils/errors');

const validate = (schema) => (req, res, next) => {
    try {
        // Validate request against schema
        // Usually we validate body, query, params.
        // Zod schema should handle `body`, `query`, `params` keys if needed,
        // or we just validate `req.body` if the schema is for the body.
        // Convention: Schema is an object { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }

        if (schema.body) {
            req.body = schema.body.parse(req.body);
        }
        if (schema.query) {
            req.query = schema.query.parse(req.query);
        }
        if (schema.params) {
            req.params = schema.params.parse(req.params);
        }

        next();
    } catch (err) {
        if (err.errors) {
            // Zod Error
            const errorMessage = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            next(new ApiError(400, errorMessage));
        } else {
            next(err);
        }
    }
};

module.exports = { validate };
