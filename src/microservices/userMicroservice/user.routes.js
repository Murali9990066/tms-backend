const express = require('express');
const router = express.Router();
const UserController = require('./user.controller');
const authorize = require('../../shared/middleware/rbac.middleware');

// POST   /user
router.post('/', authorize('ADMIN'), UserController.createUser);

// GET    /user
router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), UserController.getAllUsers);

// GET    /user/:id
router.get('/:id', UserController.getUserById);

// PUT    /user/:id
router.put('/:id', authorize('ADMIN'), UserController.updateUser);

// PATCH  /user/:id/status
router.patch('/:id/status', authorize('ADMIN'), UserController.updateUserStatus);

module.exports = router;