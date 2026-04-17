const jwt = require('jsonwebtoken');
const sendResponse = require('../../shared/utils/response.util');

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendResponse(res, 401, 'Access denied. No token provided');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // attach decoded user to request
        req.user = decoded;
        next();

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return sendResponse(res, 401, 'Session expired. Please login again');
        }
        return sendResponse(res, 401, 'Invalid token');
    }
};

module.exports = authenticate;