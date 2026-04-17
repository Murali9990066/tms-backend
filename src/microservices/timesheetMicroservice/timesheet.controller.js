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

            // parse date without timezone shift
            const [y, m, d] = week_start.split('-').map(Number);
            const weekStartDate = new Date(y, m - 1, d);
            const weekEndDate = new Date(y, m - 1, d + 6);
            const pad = n => String(n).padStart(2, '0');
            const week_end = `${weekEndDate.getFullYear()}-${pad(weekEndDate.getMonth() + 1)}-${pad(weekEndDate.getDate())}`;

            // check if timesheet already exists for this week
            let timesheet = await TimesheetModel.findByUserAndWeek(user_id, week_start);

            if (!timesheet) {
                const result = await TimesheetModel.create({ user_id, week_start, week_end });
                timesheet = await TimesheetModel.findById(result.insertId);
            }

            // delete old entries and insert new ones (full replace)
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

};

module.exports = TimesheetController;