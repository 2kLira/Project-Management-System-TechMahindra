const jwt = require('jsonwebtoken');
const supabase = require('../../config/supabase');

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

        const roleData = Array.isArray(user.role) ? user.role[0] : user.role;

        req.user = {
            id_user: user.id_user,
            username: user.username,
            email: user.email,
            role: roleData?.status || null
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

        if (!allowed.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${allowed.join(' or ')}`
            });
        }

        next();
    };
}

module.exports = { authUser, requireRole };
