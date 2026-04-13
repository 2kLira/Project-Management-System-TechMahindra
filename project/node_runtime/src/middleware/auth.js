const jwt = require('jsonwebtoken');
const supabase = require('../../supabase');

function normalizeRole(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
        const first = value[0];
        if (typeof first === 'string') return first.trim().toLowerCase();
        if (first && typeof first.status === 'string') return first.status.trim().toLowerCase();
        return null;
    }
    if (typeof value === 'object' && typeof value.status === 'string') {
        return value.status.trim().toLowerCase();
    }
    if (typeof value === 'string') return value.trim().toLowerCase();
    return null;
}

async function authUser(req, res, next) {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({ message: 'Authentication required. No token found.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { data: user, error } = await supabase
            .from('users')
            .select(`
                id_user,
                username,
                email,
                role (
                    status
                )
            `)
            .eq('id_user', decoded.id)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        req.user = {
            id_user: user.id_user,
            username: user.username,
            email: user.email,
            role: normalizeRole(user.role)
        };

        next();
    } catch (err) {
        console.error('authUser error:', err.message);
        return res.status(401).json({ message: 'Unauthorized access.' });
    }
}

function requireRole(...allowed) {
    const normalizedAllowed = allowed.map(a => String(a).trim().toLowerCase());
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        const currentRole = normalizeRole(req.user.role);

        if (!normalizedAllowed.includes(currentRole)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${allowed.join(' or ')}`
            });
        }

        req.user.role = currentRole;

        next();
    };
}

module.exports = { authUser, requireRole };