function validateEnv() {
    const required = ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
}

module.exports = { validateEnv };
