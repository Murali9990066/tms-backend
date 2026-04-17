const pool = require('../../config/db');

const VendorModel = {

    create: async (data) => {
        const { company_code, name, email } = data;
        const [result] = await pool.query(
            `INSERT INTO vendor (company_code, name, email) VALUES (?, ?, ?)`,
            [company_code, name, email]
        );
        return result;
    },

    findAll: async () => {
        const [rows] = await pool.query(`SELECT * FROM vendor ORDER BY created_at DESC`);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await pool.query(`SELECT * FROM vendor WHERE id = ?`, [id]);
        return rows[0];
    },

    findByCompanyCode: async (company_code) => {
        const [rows] = await pool.query(`SELECT * FROM vendor WHERE company_code = ?`, [company_code]);
        return rows[0];
    },

    findByEmail: async (email) => {
        const [rows] = await pool.query(`SELECT * FROM vendor WHERE email = ?`, [email]);
        return rows[0];
    },

    update: async (id, data) => {
        const {
            name,
            email,
            upload_mandatory,
            allocation_enforced,
            locking_enabled,
            escalation_enabled,
            allow_proxy_submission,
            manual_entry_days,
        } = data;
        const [result] = await pool.query(
            `UPDATE vendor SET
        name = ?,
        email = ?,
        upload_mandatory = ?,
        allocation_enforced = ?,
        locking_enabled = ?,
        escalation_enabled = ?,
        allow_proxy_submission = ?,
        manual_entry_days = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [
                name,
                email,
                upload_mandatory,
                allocation_enforced,
                locking_enabled,
                escalation_enabled,
                allow_proxy_submission,
                manual_entry_days,
                id,
            ]
        );
        return result;
    },

};

module.exports = VendorModel;