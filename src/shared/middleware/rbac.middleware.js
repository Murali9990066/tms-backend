const sendResponse = require('../utils/response.util');

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendResponse(res, 401, 'Access denied. Please login');
        }

        // SUPER_ADMIN has access to everything
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return sendResponse(res, 403, `Access denied. Required role: ${allowedRoles.join(' or ')}`);
        }

        next();
    };
};

module.exports = authorize;