const pool = require('../../config/db');

const ProjectModel = {

    // ─── PROJECT ───────────────────────────────────────────

    create: async (data) => {
        const { vendor_id, name, project_type, client_name } = data;
        const [result] = await pool.query(
            `INSERT INTO project (vendor_id, name, project_type, client_name)
       VALUES (?, ?, ?, ?)`,
            [vendor_id, name, project_type, client_name || null]
        );
        return result;
    },

    findAll: async (vendor_id) => {
        const [rows] = await pool.query(
            `SELECT * FROM project WHERE vendor_id = ? ORDER BY created_at DESC`,
            [vendor_id]
        );
        return rows;
    },

    findById: async (id) => {
        const [rows] = await pool.query(
            `SELECT * FROM project WHERE id = ?`,
            [id]
        );
        return rows[0];
    },

    findByNameAndVendor: async (name, vendor_id) => {
        const [rows] = await pool.query(
            `SELECT * FROM project WHERE name = ? AND vendor_id = ?`,
            [name, vendor_id]
        );
        return rows[0];
    },

    update: async (id, data) => {
        const { name, project_type, client_name } = data;
        const [result] = await pool.query(
            `UPDATE project SET name = ?, project_type = ?, client_name = ?,
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [name, project_type, client_name || null, id]
        );
        return result;
    },

    updateStatus: async (id, is_active) => {
        const [result] = await pool.query(
            `UPDATE project SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [is_active, id]
        );
        return result;
    },

    // ─── TASK ──────────────────────────────────────────────

    findAllTasks: async () => {
        const [rows] = await pool.query(
            `SELECT * FROM task_master ORDER BY id ASC`
        );
        return rows;
    },

    findTaskById: async (id) => {
        const [rows] = await pool.query(
            `SELECT * FROM task_master WHERE id = ?`,
            [id]
        );
        return rows[0];
    },

    updateTaskStatus: async (id, is_active_globally) => {
        const [result] = await pool.query(
            `UPDATE task_master SET is_active_globally = ? WHERE id = ?`,
            [is_active_globally, id]
        );
        return result;
    },

    findVendorTasks: async (vendor_id) => {
        const [rows] = await pool.query(
            `SELECT t.id, t.name, t.is_active_globally, vt.is_visible
       FROM task_master t
       INNER JOIN vendor_task vt ON t.id = vt.task_id
       WHERE vt.vendor_id = ?
       ORDER BY t.name ASC`,
            [vendor_id]
        );
        return rows;
    },

    findVendorTaskById: async (task_id, vendor_id) => {
        const [rows] = await pool.query(
            `SELECT * FROM vendor_task WHERE task_id = ? AND vendor_id = ?`,
            [task_id, vendor_id]
        );
        return rows[0];
    },

    updateTaskVisibility: async (task_id, vendor_id, is_visible) => {
        const [result] = await pool.query(
            `UPDATE vendor_task SET is_visible = ? WHERE task_id = ? AND vendor_id = ?`,
            [is_visible, task_id, vendor_id]
        );
        return result;
    },

    // ─── ALLOCATION ────────────────────────────────────────

    createAllocation: async (data) => {
        const { project_id, user_id, start_date, end_date } = data;
        const [result] = await pool.query(
            `INSERT INTO project_allocation (project_id, user_id, start_date, end_date)
       VALUES (?, ?, ?, ?)`,
            [project_id, user_id, start_date || null, end_date || null]
        );
        return result;
    },

    findAllocationById: async (id) => {
        const [rows] = await pool.query(
            `SELECT pa.*, p.name as project_name, u.name as user_name,
              u.display_employee_id, u.role
       FROM project_allocation pa
       INNER JOIN project p ON pa.project_id = p.id
       INNER JOIN \`user\` u ON pa.user_id = u.id
       WHERE pa.id = ?`,
            [id]
        );
        return rows[0];
    },

    findAllocationByProjectAndUser: async (project_id, user_id) => {
        const [rows] = await pool.query(
            `SELECT * FROM project_allocation WHERE project_id = ? AND user_id = ?`,
            [project_id, user_id]
        );
        return rows[0];
    },

    findAllocationsByProject: async (project_id) => {
        const [rows] = await pool.query(
            `SELECT pa.*, u.name as user_name, u.display_employee_id, u.role, u.email
       FROM project_allocation pa
       INNER JOIN \`user\` u ON pa.user_id = u.id
       WHERE pa.project_id = ?
       ORDER BY pa.id DESC`,
            [project_id]
        );
        return rows;
    },

    findAllocationsByUser: async (user_id) => {
        const [rows] = await pool.query(
            `SELECT pa.*, p.name as project_name, p.project_type
       FROM project_allocation pa
       INNER JOIN project p ON pa.project_id = p.id
       WHERE pa.user_id = ?
       ORDER BY pa.id DESC`,
            [user_id]
        );
        return rows;
    },

    deleteAllocation: async (id) => {
        const [result] = await pool.query(
            `DELETE FROM project_allocation WHERE id = ?`,
            [id]
        );
        return result;
    },

};

module.exports = ProjectModel;