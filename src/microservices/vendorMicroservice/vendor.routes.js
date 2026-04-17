const express = require('express');
const router = express.Router();
const VendorController = require('./vendor.controller');
const authorize = require('../../shared/middleware/rbac.middleware');

// POST   /vendor
router.post('/', authorize('SUPER_ADMIN'), VendorController.createVendor);

// GET    /vendor
router.get('/', authorize('SUPER_ADMIN'), VendorController.getAllVendors);

// GET    /vendor/:id
router.get('/:id', authorize('SUPER_ADMIN'), VendorController.getVendorById);

// PUT    /vendor/:id
router.put('/:id', authorize('SUPER_ADMIN'), VendorController.updateVendor);

module.exports = router;