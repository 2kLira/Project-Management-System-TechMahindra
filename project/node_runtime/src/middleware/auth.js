const jwt = require('jsonwebtoken');
const supabase = require('../../supabase');

function normalizeRole(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
}

async function authUser(req, res, next) {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({ message: 'Authentication required. No token found.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const tokenUserId = decoded.id_user || decoded.id;

        if (!tokenUserId) {
            return res.status(401).json({ message: 'Invalid token payload.' });
        }

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
            .eq('id_user', tokenUserId)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        const roleRows = Array.isArray(user.role) ? user.role : (user.role ? [user.role] : []);
        const roles = roleRows
            .map((r) => normalizeRole(r?.status))
            .filter(Boolean);

        req.user = {
            id_user: user.id_user,
            username: user.username,
            email: user.email,
            role: roles[0] || null,
            roles,
        };

        next();
    } catch (err) {
        console.error('authUser error:', err.message);
        return res.status(401).json({ message: 'Unauthorized access.' });
    }
}

function requireRole(...allowed) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        const allowedNormalized = allowed.map(normalizeRole);
        const userRoles = Array.isArray(req.user.roles) && req.user.roles.length > 0
            ? req.user.roles
            : [normalizeRole(req.user.role)];

        if (!userRoles.some((r) => allowedNormalized.includes(r))) {
            return res.status(403).json({
                message: `Access denied. Required role: ${allowed.join(' or ')}`
            });
        }

        next();
    };
}

module.exports = { authUser, requireRole };