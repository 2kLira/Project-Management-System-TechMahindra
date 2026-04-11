const { z } = require('zod');

const loginSchema = z.object({
    email_user: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    full_name: z.string().min(1, 'Full name is required'),
    role: z.enum(['admin', 'pm', 'viewer'], { message: 'Invalid role' }),
});

module.exports = { loginSchema, registerSchema };
