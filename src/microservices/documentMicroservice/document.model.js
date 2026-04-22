const pool = require('../../config/db');

const DocumentModel = {

    // Get all documents for a timesheet
    findByTimesheetId: async (timesheetId) => {
        const [rows] = await pool.query(
            `SELECT d.id, d.timesheet_id, d.file_name, d.file_type, d.storage_path, d.uploaded_at,
              u.name AS uploaded_by_name, u.display_employee_id
       FROM document d
       JOIN \`user\` u ON u.id = d.uploaded_by
       WHERE d.timesheet_id = ?
       ORDER BY d.uploaded_at ASC`,
            [timesheetId]
        );
        return rows;
    },

    // Get document count for a timesheet
    countByTimesheetId: async (timesheetId) => {
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS count FROM document WHERE timesheet_id = ?`,
            [timesheetId]
        );
        return rows[0].count;
    },

    // Get single document by id
    findById: async (documentId) => {
        const [rows] = await pool.query(
            `SELECT * FROM document WHERE id = ?`,
            [documentId]
        );
        return rows[0] || null;
    },

    // Insert a new document
    create: async ({ timesheetId, uploadedBy, fileName, fileType, storagePath }) => {
        const [result] = await pool.query(
            `INSERT INTO document (timesheet_id, uploaded_by, file_name, file_type, storage_path)
       VALUES (?, ?, ?, ?, ?)`,
            [timesheetId, uploadedBy, fileName, fileType, storagePath]
        );
        return result.insertId;
    },

    // Delete a document by id
    deleteById: async (documentId) => {
        await pool.query(`DELETE FROM document WHERE id = ?`, [documentId]);
    },

    // Get timesheet by id (status check)
    findTimesheetById: async (timesheetId) => {
        const [rows] = await pool.query(
            `SELECT * FROM timesheet WHERE id = ?`,
            [timesheetId]
        );
        return rows[0] || null;
    }

};

module.exports = DocumentModel;