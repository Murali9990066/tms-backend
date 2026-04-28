const pool = require('../../config/db');

const ReportModel = {

    // Base query — fetch all daily entries with filters
    getEntries: async ({ vendorId, employeeIds, projectIds, dateFrom, dateTo }) => {
        let query = `
            SELECT
                te.entry_date AS date,
                u.id AS employeeId,
                u.name AS employeeName,
                u.display_employee_id AS employeeCode,
                p.id AS projectId,
                p.name AS projectName,
                tm.name AS task,
                te.hours,
                te.comment,
                t.status AS timesheetStatus,
                t.week_start AS weekStart,
                t.week_end AS weekEnd
            FROM timesheet_entry te
            INNER JOIN timesheet t ON te.timesheet_id = t.id
            INNER JOIN \`user\` u ON t.user_id = u.id
            INNER JOIN project p ON te.project_id = p.id
            INNER JOIN task_master tm ON te.task_id = tm.id
            WHERE te.vendor_id = ?
        `;
        const params = [vendorId];

        if (dateFrom) { query += ` AND te.entry_date >= ?`; params.push(dateFrom); }
        if (dateTo) { query += ` AND te.entry_date <= ?`; params.push(dateTo); }
        if (employeeIds?.length) { query += ` AND u.id IN (${employeeIds.map(() => '?').join(',')})`; params.push(...employeeIds); }
        if (projectIds?.length) { query += ` AND p.id IN (${projectIds.map(() => '?').join(',')})`; params.push(...projectIds); }

        query += ` ORDER BY te.entry_date ASC, u.name ASC`;

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Pending approvals — submitted timesheets
    getPendingApprovals: async ({ vendorId, employeeIds, projectIds, dateFrom, dateTo }) => {
        let query = `
            SELECT
                t.id AS timesheetId,
                t.week_start AS weekStart,
                t.week_end AS weekEnd,
                t.status,
                u.id AS employeeId,
                u.name AS employeeName,
                u.display_employee_id AS employeeCode,
                t.created_at AS submittedAt
            FROM timesheet t
            INNER JOIN \`user\` u ON t.user_id = u.id
            WHERE u.vendor_id = ?
            AND t.status = 'SUBMITTED'
        `;
        const params = [vendorId];

        if (dateFrom) { query += ` AND t.week_start >= ?`; params.push(dateFrom); }
        if (dateTo) { query += ` AND t.week_end <= ?`; params.push(dateTo); }
        if (employeeIds?.length) { query += ` AND u.id IN (${employeeIds.map(() => '?').join(',')})`; params.push(...employeeIds); }

        query += ` ORDER BY t.week_start ASC`;

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Missing timesheets — employees with no entries in date range
    getMissingTimesheets: async ({ vendorId, employeeIds, dateFrom, dateTo }) => {
        let query = `
            SELECT
                u.id AS employeeId,
                u.name AS employeeName,
                u.display_employee_id AS employeeCode
            FROM \`user\` u
            WHERE u.vendor_id = ?
            AND u.role = 'EMPLOYEE'
            AND u.is_active = true
            AND u.id NOT IN (
                SELECT DISTINCT t.user_id
                FROM timesheet t
                INNER JOIN timesheet_entry te ON te.timesheet_id = t.id
                WHERE te.vendor_id = ?
                ${dateFrom ? 'AND te.entry_date >= ?' : ''}
                ${dateTo ? 'AND te.entry_date <= ?' : ''}
            )
        `;
        const params = [vendorId, vendorId];
        if (dateFrom) params.push(dateFrom);
        if (dateTo) params.push(dateTo);
        if (employeeIds?.length) { query += ` AND u.id IN (${employeeIds.map(() => '?').join(',')})`; params.push(...employeeIds); }

        const [rows] = await pool.query(query, params);
        return rows;
    },

};

module.exports = ReportModel;