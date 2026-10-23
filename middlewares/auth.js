const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { JWT_SECRET } = require('../config');

const authenticate = (req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return next({ status: 401, message: 'Authorization header must be in the form "Bearer <token>"' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = userModel.findById(payload.id);

        if (!user) {
            return next({ status: 401, message: 'Token does not belong to an existing user' });
        }

        req.user = user;
        return next();
    } catch (error) {
        const message = error.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
        return next({ status: 401, message });
    }
};

const authorizeRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return next({ status: 403, message: `Only ${roles.join(' or ')} accounts can perform this action` });
    }
    return next();
};

module.exports = { authenticate, authorizeRoles };
