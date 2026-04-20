const TimesheetModel = require('./timesheet.model');
const sendResponse = require('../../shared/utils/response.util');

const TimesheetController = {

    // POST /timesheet/save
    saveDraft: async (req, res) => {
        try {
            const { week_start, entries } = req.body;
            const user_id = req.user.id;
            const vendor_id = req.user.vendor_id;

            if (!week_start) {
                return sendResponse(res, 400, 'week_start is required');
            }

            if (!entries || !Array.isArray(entries) || entries.length === 0) {
                return sendResponse(res, 400, 'entries are required');
            }

            const [y, m, d] = week_start.split('-').map(Number);
            const weekStartDate = new Date(y, m - 1, d);
            const weekEndDate = new Date(y, m - 1, d + 6);
            const pad = n => String(n).padStart(2, '0');
            const week_end = `${weekEndDate.getFullYear()}-${pad(weekEndDate.getMonth() + 1)}-${pad(weekEndDate.getDate())}`;

            let timesheet = await TimesheetModel.findByUserAndWeek(user_id, week_start);

            if (!timesheet) {
                const result = await TimesheetModel.create({ user_id, week_start, week_end });
                timesheet = await TimesheetModel.findById(result.insertId);
            }

            // only allow editing if status is DRAFT or REJECTED
            if (timesheet.status === 'SUBMITTED') {
                return sendResponse(res, 400, 'Cannot edit a submitted timesheet');
            }

            if (timesheet.status === 'APPROVED') {
                return sendResponse(res, 400, 'Cannot edit an approved timesheet');
            }

            // if rejected reset back to DRAFT
            if (timesheet.status === 'REJECTED') {
                await TimesheetModel.updateStatus(timesheet.id, 'DRAFT');
            }

            await TimesheetModel.deleteEntries(timesheet.id);
            await TimesheetModel.insertEntries(
                entries.map(e => ({
                    timesheet_id: timesheet.id,
                    vendor_id,
                    date: e.date,
                    project_id: e.project_id,
                    task_id: e.task_id,
                    hours: e.hours,
                    comment: e.comment,
                }))
            );

            const savedEntries = await TimesheetModel.findEntries(timesheet.id);

            return sendResponse(res, 200, 'Timesheet saved successfully', {
                timesheet: {
                    id: timesheet.id,
                    week_start: timesheet.week_start,
                    week_end: timesheet.week_end,
                    status: timesheet.status,
                },
                entries: savedEntries,
            });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /timesheet?week_start=2026-04-06
    getTimesheet: async (req, res) => {
        try {
            const { week_start } = req.query;
            const user_id = req.user.id;

            if (!week_start) {
                return sendResponse(res, 400, 'week_start is required');
            }

            const timesheet = await TimesheetModel.findByUserAndWeek(user_id, week_start);
            if (!timesheet) {
                return sendResponse(res, 200, 'No timesheet found for this week', {
                    timesheet: null,
                    entries: [],
                });
            }

            const entries = await TimesheetModel.findEntries(timesheet.id);

            return sendResponse(res, 200, 'Timesheet fetched successfully', {
                timesheet: {
                    id: timesheet.id,
                    week_start: timesheet.week_start,
                    week_end: timesheet.week_end,
                    status: timesheet.status,
                },
                entries,
            });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // POST /timesheet/submit
    submitTimesheet: async (req, res) => {
        try {
            const { week_start } = req.body;
            const user_id = req.user.id;

            if (!week_start) {
                return sendResponse(res, 400, 'week_start is required');
            }

            const timesheet = await TimesheetModel.findByUserAndWeek(user_id, week_start);
            if (!timesheet) {
                return sendResponse(res, 404, 'Timesheet not found for this week');
            }

            if (timesheet.status === 'SUBMITTED') {
                return sendResponse(res, 400, 'Timesheet already submitted');
            }

            if (timesheet.status === 'APPROVED') {
                return sendResponse(res, 400, 'Timesheet already approved');
            }

            await TimesheetModel.updateStatus(timesheet.id, 'SUBMITTED');
            const updated = await TimesheetModel.findById(timesheet.id);

            return sendResponse(res, 200, 'Timesheet submitted successfully', {
                timesheet: {
                    id: updated.id,
                    week_start: updated.week_start,
                    week_end: updated.week_end,
                    status: updated.status,
                },
            });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /timesheet/:id — PM views specific timesheet with entries
    getTimesheetById: async (req, res) => {
        try {
            const timesheet = await TimesheetModel.findById(req.params.id);
            if (!timesheet) {
                return sendResponse(res, 404, 'Timesheet not found');
            }

            const entries = await TimesheetModel.findEntries(req.params.id);
            const approvals = await TimesheetModel.findApprovals(req.params.id);

            return sendResponse(res, 200, 'Timesheet fetched successfully', {
                timesheet,
                entries,
                approvals,
            });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /timesheet/team?vendor_id=1&status=SUBMITTED
    getTeamTimesheets: async (req, res) => {
        try {
            const { vendor_id, status } = req.query;

            if (!vendor_id) {
                return sendResponse(res, 400, 'vendor_id is required');
            }

            let timesheets = await TimesheetModel.findAllByVendor(vendor_id);

            if (status) {
                timesheets = timesheets.filter(t => t.status === status);
            }

            return sendResponse(res, 200, 'Team timesheets fetched successfully', { timesheets });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // POST /timesheet/:id/approve
    approveTimesheet: async (req, res) => {
        try {
            const { comments, document_verified } = req.body;
            const reviewed_by = req.user.id;
            const timesheet_id = req.params.id;

            const timesheet = await TimesheetModel.findById(timesheet_id);
            if (!timesheet) {
                return sendResponse(res, 404, 'Timesheet not found');
            }

            if (timesheet.status !== 'SUBMITTED') {
                return sendResponse(res, 400, 'Only submitted timesheets can be approved');
            }

            if (timesheet.filled_by && timesheet.filled_by === reviewed_by) {
                return sendResponse(res, 403, 'You cannot approve a timesheet you filled on behalf of an employee');
            }

            await TimesheetModel.updateStatus(timesheet_id, 'APPROVED');
            await TimesheetModel.createApproval({
                timesheet_id,
                reviewed_by,
                action: 'APPROVED',
                comments,
                document_verified,
            });

            const updated = await TimesheetModel.findById(timesheet_id);
            return sendResponse(res, 200, 'Timesheet approved successfully', {
                timesheet: {
                    id: updated.id,
                    week_start: updated.week_start,
                    week_end: updated.week_end,
                    status: updated.status,
                },
            });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // POST /timesheet/:id/reject
    rejectTimesheet: async (req, res) => {
        try {
            const { comments, document_verified } = req.body;
            const reviewed_by = req.user.id;
            const timesheet_id = req.params.id;

            if (!comments) {
                return sendResponse(res, 400, 'comments are required when rejecting a timesheet');
            }

            const timesheet = await TimesheetModel.findById(timesheet_id);
            if (!timesheet) {
                return sendResponse(res, 404, 'Timesheet not found');
            }

            if (timesheet.status !== 'SUBMITTED') {
                return sendResponse(res, 400, 'Only submitted timesheets can be rejected');
            }

            if (timesheet.filled_by && timesheet.filled_by === reviewed_by) {
                return sendResponse(res, 403, 'You cannot reject a timesheet you filled on behalf of an employee');
            }

            await TimesheetModel.updateStatus(timesheet_id, 'REJECTED');
            await TimesheetModel.createApproval({
                timesheet_id,
                reviewed_by,
                action: 'REJECTED',
                comments,
                document_verified,
            });

            const updated = await TimesheetModel.findById(timesheet_id);
            return sendResponse(res, 200, 'Timesheet rejected successfully', {
                timesheet: {
                    id: updated.id,
                    week_start: updated.week_start,
                    week_end: updated.week_end,
                    status: updated.status,
                },
            });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

};

module.exports = TimesheetController;