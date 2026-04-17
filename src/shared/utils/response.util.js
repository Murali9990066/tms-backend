const sendResponse = (res, statusCode, message, data = null) => {
    const response = {
        status: statusCode >= 200 && statusCode < 300 ? 'success' : 'error',
        statusCode,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

module.exports = sendResponse;