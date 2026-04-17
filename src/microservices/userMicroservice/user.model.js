const pool = require('../../config/db');

const UserModel = {

    create: async (data) => {
        const { vendor_id, display_employee_id, name, email, role, timezone, reporting_manager_id } = data;
        const [result] = await pool.query(
            `INSERT INTO \`user\` (vendor_id, display_employee_id, name, email, role, timezone, reporting_manager_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [vendor_id, display_employee_id, name, email, role, timezone, reporting_manager_id || null]
        );
        return result;
    },

    findById: async (id) => {
        const [rows] = await pool.query(
            `SELECT id, vendor_id, display_employee_id, name, email, role, timezone, 
              reporting_manager_id, is_active, is_first_login, created_at, updated_at 
       FROM \`user\` WHERE id = ?`,
            [id]
        );
        return rows[0];
    },

    findByEmail: async (email) => {
        const [rows] = await pool.query(
            `SELECT * FROM \`user\` WHERE email = ?`,
            [email]
        );
        return rows[0];
    },

    findByEmailAndVendor: async (email, vendor_id) => {
        const [rows] = await pool.query(
            `SELECT * FROM \`user\` WHERE email = ? AND vendor_id = ?`,
            [email, vendor_id]
        );
        return rows[0];
    },

    findByDisplayEmployeeId: async (display_employee_id) => {
        const [rows] = await pool.query(
            `SELECT * FROM \`user\` WHERE display_employee_id = ?`,
            [display_employee_id]
        );
        return rows[0];
    },

    findAllByVendor: async (vendor_id) => {
        const [rows] = await pool.query(
            `SELECT id, vendor_id, display_employee_id, name, email, role, timezone,
              reporting_manager_id, is_active, is_first_login, created_at, updated_at
       FROM \`user\` WHERE vendor_id = ? ORDER BY created_at DESC`,
            [vendor_id]
        );
        return rows;
    },

    findAllByVendorAndRole: async (vendor_id, role) => {
        const [rows] = await pool.query(
            `SELECT id, vendor_id, display_employee_id, name, email, role, timezone,
              reporting_manager_id, is_active, is_first_login, created_at, updated_at
       FROM \`user\` WHERE vendor_id = ? AND role = ? ORDER BY created_at DESC`,
            [vendor_id, role]
        );
        return rows;
    },

    update: async (id, data) => {
        const { name, email, timezone, reporting_manager_id } = data;
        const [result] = await pool.query(
            `UPDATE \`user\` SET name = ?, email = ?, timezone = ?, 
       reporting_manager_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [name, email, timezone, reporting_manager_id || null, id]
        );
        return result;
    },

    updateStatus: async (id, is_active) => {
        const [result] = await pool.query(
            `UPDATE \`user\` SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [is_active, id]
        );
        return result;
    },

    updatePassword: async (id, password) => {
        const [result] = await pool.query(
            `UPDATE \`user\` SET password = ?, is_first_login = false, 
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [password, id]
        );
        return result;
    },

};

module.exports = UserModel;