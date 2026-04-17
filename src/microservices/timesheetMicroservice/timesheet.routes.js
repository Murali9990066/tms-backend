const express = require('express');
const router = express.Router();
const TimesheetController = require('./timesheet.controller');

// POST /timesheet/save
router.post('/save', TimesheetController.saveDraft);

// GET /timesheet?weekId=2026-W15
router.get('/', TimesheetController.getTimesheet);

module.exports = router;