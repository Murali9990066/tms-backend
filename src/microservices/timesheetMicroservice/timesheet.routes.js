const express = require('express');
const router = express.Router();
const TimesheetController = require('./timesheet.controller');
const authorize = require('../../shared/middleware/rbac.middleware');

// POST /timesheet/save — EMPLOYEE, PM (proxy)
router.post('/save', TimesheetController.saveDraft);

// POST /timesheet/submit — EMPLOYEE
router.post('/submit', authorize('EMPLOYEE', 'PM'), TimesheetController.submitTimesheet);

// GET  /timesheet/team?vendor_id=1&status=SUBMITTED — PM, ADMIN
router.get('/team', authorize('PM', 'ADMIN'), TimesheetController.getTeamTimesheets);

// GET  /timesheet?week_start=2026-04-06 — EMPLOYEE
router.get('/', TimesheetController.getTimesheet);

// GET  /timesheet/:id — PM views specific timesheet
router.get('/:id', authorize('PM', 'ADMIN'), TimesheetController.getTimesheetById);

// POST /timesheet/:id/approve — PM only
router.post('/:id/approve', authorize('PM'), TimesheetController.approveTimesheet);

// POST /timesheet/:id/reject — PM only
router.post('/:id/reject', authorize('PM'), TimesheetController.rejectTimesheet);

module.exports = router;