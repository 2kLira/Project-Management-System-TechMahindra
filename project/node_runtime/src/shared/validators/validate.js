const { ZodError } = require('zod');

function validate(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const issues = err.issues || err.errors || [];
                return res.status(400).json({
                    message: 'Validation error',
                    errors: issues.map(e => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            next(err);
        }
    };
}

module.exports = { validate };
