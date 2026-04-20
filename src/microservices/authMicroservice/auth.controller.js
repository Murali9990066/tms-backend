const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../../config/db');
const AuthModel = require('./auth.model');
const sendResponse = require('../../shared/utils/response.util');

const AuthController = {

    // POST /auth/login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return sendResponse(res, 400, 'Email and password are required');
            }

            const user = await AuthModel.findUserWithAuthByEmail(email);
            if (!user) {
                return sendResponse(res, 401, 'Invalid email or password');
            }

            if (!user.is_active) {
                return sendResponse(res, 403, 'Your account has been deactivated. Please contact admin');
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return sendResponse(res, 401, 'Invalid email or password');
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    vendor_id: user.vendor_id,
                    role: user.role,
                    email: user.email,
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
            );

            await AuthModel.updateLastLogin(user.id);

            const { password: _, auth_id: __, ...safeUser } = user;

            return sendResponse(res, 200, 'Login successful', {
                token,
                is_first_login: user.is_first_login,
                user: safeUser,
            });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // POST /auth/logout
    logout: async (req, res) => {
        try {
            return sendResponse(res, 200, 'Logged out successfully');
        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // POST /auth/change-password (first login only)
    changePassword: async (req, res) => {
        try {
            const { new_password, confirm_password } = req.body;
            const user_id = req.user.id;

            if (!new_password || !confirm_password) {
                return sendResponse(res, 400, 'new_password and confirm_password are required');
            }

            if (new_password !== confirm_password) {
                return sendResponse(res, 400, 'Passwords do not match');
            }

            if (new_password.length < 8) {
                return sendResponse(res, 400, 'Password must be at least 8 characters');
            }

            const [userRows] = await pool.query(
                `SELECT is_first_login FROM \`user\` WHERE id = ?`, [user_id]
            );
            if (!userRows[0]) {
                return sendResponse(res, 404, 'User not found');
            }
            if (!userRows[0].is_first_login) {
                return sendResponse(res, 403, 'Password has already been set. Use forgot password to reset it');
            }

            const auth = await AuthModel.findByUserId(user_id);
            if (!auth) {
                return sendResponse(res, 404, 'User auth record not found');
            }

            const isSamePassword = await bcrypt.compare(new_password, auth.password);
            if (isSamePassword) {
                return sendResponse(res, 400, 'New password must be different from your previous password');
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);
            await AuthModel.updatePassword(user_id, hashedPassword);
            await AuthModel.updateFirstLogin(user_id);

            return sendResponse(res, 200, 'Password changed successfully. Please login again');

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // POST /auth/update-password (logged in user knows current password)
    updatePassword: async (req, res) => {
        try {
            const { current_password, new_password, confirm_password } = req.body;
            const user_id = req.user.id;

            if (!current_password || !new_password || !confirm_password) {
                return sendResponse(res, 400, 'current_password, new_password and confirm_password are required');
            }

            if (new_password !== confirm_password) {
                return sendResponse(res, 400, 'Passwords do not match');
            }

            if (new_password.length < 8) {
                return sendResponse(res, 400, 'Password must be at least 8 characters');
            }

            const auth = await AuthModel.findByUserId(user_id);
            if (!auth) {
                return sendResponse(res, 404, 'User auth record not found');
            }

            const isMatch = await bcrypt.compare(current_password, auth.password);
            if (!isMatch) {
                return sendResponse(res, 401, 'Current password is incorrect');
            }

            const isSamePassword = await bcrypt.compare(new_password, auth.password);
            if (isSamePassword) {
                return sendResponse(res, 400, 'New password must be different from your current password');
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);
            await AuthModel.updatePassword(user_id, hashedPassword);

            return sendResponse(res, 200, 'Password updated successfully');

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // POST /auth/forgot-password
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return sendResponse(res, 400, 'Email is required');
            }

            const user = await AuthModel.findUserWithAuthByEmail(email);
            if (!user) {
                return sendResponse(res, 200, 'If this email exists you will receive a password reset link shortly');
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiryUTC = new Date(Date.now() + 60 * 60 * 1000)
                .toISOString()
                .slice(0, 19)
                .replace('T', ' ');

            await AuthModel.saveResetToken(user.id, resetToken, expiryUTC);

            console.log('─────────────────────────────────────');
            console.log('📧 Password Reset Link');
            console.log(`Email  : ${email}`);
            console.log(`Link   : http://localhost:3000/reset-password?token=${resetToken}`);
            console.log(`Expiry : 1 hour`);
            console.log('─────────────────────────────────────');

            console.log('Current UTC time:', new Date().toISOString());
            console.log('Expiry UTC:', expiryUTC);

            return sendResponse(res, 200, 'If this email exists you will receive a password reset link shortly');

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // POST /auth/reset-password
    resetPassword: async (req, res) => {
        try {
            const { token, new_password, confirm_password } = req.body;

            if (!token || !new_password || !confirm_password) {
                return sendResponse(res, 400, 'token, new_password and confirm_password are required');
            }

            if (new_password !== confirm_password) {
                return sendResponse(res, 400, 'Passwords do not match');
            }

            if (new_password.length < 8) {
                return sendResponse(res, 400, 'Password must be at least 8 characters');
            }

            const record = await AuthModel.findByResetToken(token);
            if (!record) {
                return sendResponse(res, 400, 'Invalid or expired reset link');
            }

            const isSamePassword = await bcrypt.compare(new_password, record.password);
            if (isSamePassword) {
                return sendResponse(res, 400, 'New password must be different from your previous password');
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);
            await AuthModel.updatePassword(record.id, hashedPassword);
            await AuthModel.clearResetToken(record.id);

            return sendResponse(res, 200, 'Password reset successfully. Please login with your new password');

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

};

module.exports = AuthController;