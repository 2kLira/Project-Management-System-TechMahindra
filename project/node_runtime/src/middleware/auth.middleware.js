const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }
    try {
        const payload = jwt.verify(token, secretKey);
        req.user = payload; // { id, role, username }
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token not valid' });
    }
}

module.exports = authMiddleware;
