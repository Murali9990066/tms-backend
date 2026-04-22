const express = require('express');
const router = express.Router();
const upload = require('../../config/multer');
const authorize = require('../../shared/middleware/rbac.middleware');
const DocumentController = require('./document.controller');

// POST /document/:timesheetId — upload up to 5 files
router.post(
    '/:timesheetId',
    authorize('SUPER_ADMIN', 'ADMIN', 'PM', 'EMPLOYEE'),
    (req, res, next) => {
        upload.array('files', 5)(req, res, (err) => {
            if (err) return res.status(400).json({ success: false, message: err.message });
            next();
        });
    },
    DocumentController.uploadDocuments
);

// GET /document/:timesheetId — get all documents for a timesheet
router.get(
    '/:timesheetId',
    authorize('SUPER_ADMIN', 'ADMIN', 'PM', 'EMPLOYEE'),
    DocumentController.getDocuments
);

// DELETE /document/:documentId — delete a specific document
router.delete(
    '/:documentId',
    authorize('SUPER_ADMIN', 'ADMIN', 'PM', 'EMPLOYEE'),
    DocumentController.deleteDocument
);

module.exports = router;