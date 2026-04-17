const pool = require('../../config/db');

const AuthModel = {

    // create auth record
    create: async (data) => {
        const { user_id, password } = data;
        const [result] = await pool.query(
            `INSERT INTO auth (user_id, password) VALUES (?, ?)`,
            [user_id, password]
        );
        return result;
    },

    // find auth by user_id
    findByUserId: async (user_id) => {
        const [rows] = await pool.query(
            `SELECT * FROM auth WHERE user_id = ?`,
            [user_id]
        );
        return rows[0];
    },

    // find user with auth by email (join)
    findUserWithAuthByEmail: async (email) => {
        const [rows] = await pool.query(
            `SELECT u.id, u.vendor_id, u.display_employee_id, u.name, u.email,
              u.role, u.timezone, u.reporting_manager_id, u.is_active,
              u.is_first_login, a.password, a.id as auth_id
       FROM \`user\` u
       INNER JOIN auth a ON u.id = a.user_id
       WHERE u.email = ?`,
            [email]
        );
        return rows[0];
    },

    // update password
    updatePassword: async (user_id, password) => {
        const [result] = await pool.query(
            `UPDATE auth SET password = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
            [password, user_id]
        );
        return result;
    },

    // save reset token
    saveResetToken: async (user_id, token, expiry) => {
        const [result] = await pool.query(
            `UPDATE auth SET reset_token = ?, reset_token_expiry = ?,
       updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
            [token, expiry, user_id]
        );
        return result;
    },

    // find by reset token
    findByResetToken: async (token) => {
        const [rows] = await pool.query(
            `SELECT u.id, u.email, a.password, a.reset_token, a.reset_token_expiry
       FROM \`user\` u
       INNER JOIN auth a ON u.id = a.user_id
       WHERE a.reset_token = ? AND a.reset_token_expiry > NOW()`,
            [token]
        );
        return rows[0];
    },

    // clear reset token after password reset
    clearResetToken: async (user_id) => {
        const [result] = await pool.query(
            `UPDATE auth SET reset_token = NULL, reset_token_expiry = NULL,
       updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
            [user_id]
        );
        return result;
    },

    // update last login
    updateLastLogin: async (user_id) => {
        const [result] = await pool.query(
            `UPDATE auth SET last_login = NOW(), updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
            [user_id]
        );
        return result;
    },

    // update is_first_login in user table
    updateFirstLogin: async (user_id) => {
        const [result] = await pool.query(
            `UPDATE \`user\` SET is_first_login = false,
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [user_id]
        );
        return result;
    },

};

module.exports = AuthModel;