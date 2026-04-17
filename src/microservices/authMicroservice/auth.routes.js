const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const authenticate = require('./auth.middleware');

// public routes — no token required
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// protected routes — token required
router.post('/logout', authenticate, AuthController.logout);
router.post('/change-password', authenticate, AuthController.changePassword);
router.post('/update-password', authenticate, AuthController.updatePassword);

module.exports = router;