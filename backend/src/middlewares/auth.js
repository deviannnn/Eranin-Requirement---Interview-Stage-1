const createError = require('http-errors');
const { extractToken, decodeToken } = require('../utils/jwt');

const rolesMap = { "admin": 1, "default": 2 }

const authenticate = (req, res, next) => {
    const token = extractToken(req);
    if (!token) return next(createError(401, 'No token provided!'));
    try {
        const decoded = decodeToken(token, 'access');
        req.user = decoded;
        return next();
    } catch (error) {
        return next(createError(401, 'Invalid or expired refresh token'));
    }
}

const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) return next(createError(401, ''));
        if (!roles.some(role => rolesMap[role] === req.user.roleId)) return next(createError(403, ''));
        return next();
    };
};

module.exports = { authenticate, authorize };