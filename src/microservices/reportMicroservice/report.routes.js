const express = require('express');
const router = express.Router();
const authorize = require('../../shared/middleware/rbac.middleware');
const ReportController = require('./report.controller');

// POST /report/generate — generate report data (JSON)
router.post(
    '/generate',
    authorize('SUPER_ADMIN', 'ADMIN', 'PM', 'EMPLOYEE'),
    ReportController.generateReport
);

// GET /report/export — download report as PDF or Excel
router.get(
    '/export',
    authorize('SUPER_ADMIN', 'ADMIN', 'PM', 'EMPLOYEE'),
    ReportController.exportReport
);

module.exports = router;