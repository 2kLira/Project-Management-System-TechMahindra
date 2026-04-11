const { z } = require('zod');

const updateStatusSchema = z.object({
    status: z.string().min(1, 'Status is required'),
});

const updateRoleSchema = z.object({
    role: z.enum(['admin', 'pm', 'viewer'], { message: 'Invalid role' }),
});

module.exports = { updateStatusSchema, updateRoleSchema };
