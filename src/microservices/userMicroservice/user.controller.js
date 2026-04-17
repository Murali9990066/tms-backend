const bcrypt = require('bcryptjs');
const UserModel = require('./user.model');
const VendorModel = require('../vendorMicroservice/vendor.model');
const AuthModel = require('../authMicroservice/auth.model');
const sendResponse = require('../../shared/utils/response.util');

const UserController = {

    // POST /api/user
    createUser: async (req, res) => {
        try {
            const {
                vendor_id,
                display_employee_id,
                name,
                email,
                role,
                timezone,
                reporting_manager_id,
            } = req.body;

            // validation
            if (!vendor_id || !display_employee_id || !name || !email || !role || !timezone) {
                return sendResponse(res, 400, 'vendor_id, display_employee_id, name, email, role and timezone are required');
            }

            // validate role
            const allowedRoles = ['ADMIN', 'PM', 'EMPLOYEE'];
            if (!allowedRoles.includes(role)) {
                return sendResponse(res, 400, 'Invalid role. Allowed values: ADMIN, PM, EMPLOYEE');
            }

            // check vendor exists
            const vendor = await VendorModel.findById(vendor_id);
            if (!vendor) {
                return sendResponse(res, 404, 'Vendor not found');
            }

            // check email duplicate within vendor
            const existingEmail = await UserModel.findByEmailAndVendor(email, vendor_id);
            if (existingEmail) {
                return sendResponse(res, 400, 'Email already exists for this vendor');
            }

            // check display_employee_id duplicate
            const existingEmpId = await UserModel.findByDisplayEmployeeId(display_employee_id);
            if (existingEmpId) {
                return sendResponse(res, 400, 'Display employee ID already exists');
            }

            // check reporting manager exists if provided
            if (reporting_manager_id) {
                const manager = await UserModel.findById(reporting_manager_id);
                if (!manager) {
                    return sendResponse(res, 404, 'Reporting manager not found');
                }
            }

            // auto generate temp password
            const tempPassword = `User@${display_employee_id}123`;
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            await UserModel.create({
                vendor_id,
                display_employee_id,
                name,
                email,
                role,
                timezone,
                reporting_manager_id: reporting_manager_id || null,
            });

            const newUser = await UserModel.findByEmailAndVendor(email, vendor_id);

            // create auth record
            await AuthModel.create({
                user_id: newUser.id,
                password: hashedPassword,
            });

            // console log credentials — replace with email service later
            console.log('─────────────────────────────────────');
            console.log('📧 User Account Created');
            console.log(`Name    : ${name}`);
            console.log(`Email   : ${email}`);
            console.log(`Role    : ${role}`);
            console.log(`Password: ${tempPassword}`);
            console.log('Please login and change your password');
            console.log('─────────────────────────────────────');

            return sendResponse(res, 201, 'User created successfully', {
                user: newUser,
                temporary_password: tempPassword,
                note: 'Please change your password on first login',
            });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /api/user?vendor_id=xxx&role=PM
    getAllUsers: async (req, res) => {
        try {
            const { vendor_id, role } = req.query;

            if (!vendor_id) {
                return sendResponse(res, 400, 'vendor_id is required');
            }

            const vendor = await VendorModel.findById(vendor_id);
            if (!vendor) {
                return sendResponse(res, 404, 'Vendor not found');
            }

            const users = role
                ? await UserModel.findAllByVendorAndRole(vendor_id, role)
                : await UserModel.findAllByVendor(vendor_id);

            return sendResponse(res, 200, 'Users fetched successfully', { users });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /api/user/:id
    getUserById: async (req, res) => {
        try {
            const user = await UserModel.findById(req.params.id);
            if (!user) {
                return sendResponse(res, 404, 'User not found');
            }
            return sendResponse(res, 200, 'User fetched successfully', { user });
        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // PUT /api/user/:id
    updateUser: async (req, res) => {
        try {
            const { name, email, timezone, reporting_manager_id } = req.body;

            if (!name || !email || !timezone) {
                return sendResponse(res, 400, 'name, email and timezone are required');
            }

            const user = await UserModel.findById(req.params.id);
            if (!user) {
                return sendResponse(res, 404, 'User not found');
            }

            // check email conflict within same vendor
            if (email !== user.email) {
                const existingEmail = await UserModel.findByEmailAndVendor(email, user.vendor_id);
                if (existingEmail) {
                    return sendResponse(res, 400, 'Email already exists for this vendor');
                }
            }

            // check reporting manager exists if provided
            if (reporting_manager_id) {
                const manager = await UserModel.findById(reporting_manager_id);
                if (!manager) {
                    return sendResponse(res, 404, 'Reporting manager not found');
                }
            }

            await UserModel.update(req.params.id, { name, email, timezone, reporting_manager_id });
            const updated = await UserModel.findById(req.params.id);
            return sendResponse(res, 200, 'User updated successfully', { user: updated });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // PATCH /api/user/:id/status
    updateUserStatus: async (req, res) => {
        try {
            const { is_active } = req.body;

            if (is_active === undefined) {
                return sendResponse(res, 400, 'is_active is required');
            }

            const user = await UserModel.findById(req.params.id);
            if (!user) {
                return sendResponse(res, 404, 'User not found');
            }

            await UserModel.updateStatus(req.params.id, is_active);
            const updated = await UserModel.findById(req.params.id);
            return sendResponse(res, 200, `User ${is_active ? 'activated' : 'deactivated'} successfully`, { user: updated });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

};

module.exports = UserController;