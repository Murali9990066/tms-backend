const pool = require('../../config/db');

const TimesheetModel = {

    // find timesheet by user and week_start
    findByUserAndWeek: async (user_id, week_start) => {
        const [rows] = await pool.query(
            `SELECT * FROM timesheet WHERE user_id = ? AND week_start = ?`,
            [user_id, week_start]
        );
        return rows[0];
    },

    // find timesheet by id
    findById: async (id) => {
        const [rows] = await pool.query(
            `SELECT * FROM timesheet WHERE id = ?`,
            [id]
        );
        return rows[0];
    },

    // create timesheet
    create: async (data) => {
        const { user_id, week_start, week_end } = data;
        const [result] = await pool.query(
            `INSERT INTO timesheet (user_id, week_start, week_end, status)
       VALUES (?, ?, ?, 'DRAFT')`,
            [user_id, week_start, week_end]
        );
        return result;
    },

    // delete all entries for a timesheet
    deleteEntries: async (timesheet_id) => {
        const [result] = await pool.query(
            `DELETE FROM timesheet_entry WHERE timesheet_id = ?`,
            [timesheet_id]
        );
        return result;
    },

    // insert entries
    insertEntries: async (entries) => {
        for (const entry of entries) {
            const { timesheet_id, vendor_id, date, project_id, task_id, hours, comment } = entry;
            await pool.query(
                `INSERT INTO timesheet_entry (timesheet_id, vendor_id, entry_date, project_id, task_id, hours, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [timesheet_id, vendor_id, date, project_id, task_id, hours, comment || null]
            );
        }
    },

    // get entries for a timesheet with project and task names
    findEntries: async (timesheet_id) => {
        const [rows] = await pool.query(
            `SELECT te.id, te.entry_date as date, te.project_id, p.name as project_name,
              te.task_id, t.name as task_name, te.hours, te.comment
       FROM timesheet_entry te
       INNER JOIN project p ON te.project_id = p.id
       INNER JOIN task_master t ON te.task_id = t.id
       WHERE te.timesheet_id = ?
       ORDER BY te.entry_date ASC`,
            [timesheet_id]
        );
        return rows;
    },

};

module.exports = TimesheetModel;