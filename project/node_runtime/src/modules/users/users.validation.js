const { z } = require('zod');

const updateStatusSchema = z.object({
    status: z.string().min(1, 'Status is required'),
});

const updateRoleSchema = z.object({
    role: z.enum(['admin', 'pm', 'viewer'], { message: 'Invalid role' }),
});

const createUserSchema = z.object({
    full_name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email'),
    role: z.enum(['admin', 'pm', 'viewer'], { message: 'Invalid role' }),
});

module.exports = { createUserSchema, updateStatusSchema, updateRoleSchema };
