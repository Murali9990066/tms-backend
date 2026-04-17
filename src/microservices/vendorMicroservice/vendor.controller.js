const bcrypt = require('bcryptjs');
const VendorModel = require('./vendor.model');
const UserModel = require('../userMicroservice/user.model');
const AuthModel = require('../authMicroservice/auth.model');
const sendResponse = require('../../shared/utils/response.util');

const VendorController = {

    // POST /vendor
    createVendor: async (req, res) => {
        try {
            const { company_code, name, email } = req.body;

            if (!company_code || !name || !email) {
                return sendResponse(res, 400, 'company_code, name and email are required');
            }

            const existingCode = await VendorModel.findByCompanyCode(company_code);
            if (existingCode) {
                return sendResponse(res, 400, 'Company code already exists');
            }

            const existingEmail = await VendorModel.findByEmail(email);
            if (existingEmail) {
                return sendResponse(res, 400, 'Vendor email already exists');
            }

            await VendorModel.create({ company_code, name, email });
            const newVendor = await VendorModel.findByCompanyCode(company_code);

            const tempPassword = `Admin@${company_code}123`;
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            const display_employee_id = `${company_code}-ADMIN-001`;

            await UserModel.create({
                vendor_id: newVendor.id,
                display_employee_id,
                name: `${name} Admin`,
                email,
                role: 'ADMIN',
                timezone: 'Asia/Kolkata',
            });

            const adminUser = await UserModel.findByEmailAndVendor(email, newVendor.id);

            await AuthModel.create({
                user_id: adminUser.id,
                password: hashedPassword,
            });

            console.log('─────────────────────────────────────');
            console.log('📧 Admin Account Created');
            console.log(`Vendor  : ${name}`);
            console.log(`Email   : ${email}`);
            console.log(`Password: ${tempPassword}`);
            console.log('Please login and change your password');
            console.log('─────────────────────────────────────');

            return sendResponse(res, 201, 'Vendor created successfully', {
                vendor: newVendor,
                admin_credentials: {
                    email,
                    temporary_password: tempPassword,
                    note: 'Please change your password on first login',
                },
            });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /vendor
    getAllVendors: async (req, res) => {
        try {
            const vendors = await VendorModel.findAll();
            return sendResponse(res, 200, 'Vendors fetched successfully', { vendors });
        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /vendor/:id
    getVendorById: async (req, res) => {
        try {
            const vendor = await VendorModel.findById(req.params.id);
            if (!vendor) {
                return sendResponse(res, 404, 'Vendor not found');
            }
            return sendResponse(res, 200, 'Vendor fetched successfully', { vendor });
        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // PUT /vendor/:id — update name, email and all config in one
    updateVendor: async (req, res) => {
        try {
            const {
                name,
                email,
                upload_mandatory,
                allocation_enforced,
                locking_enabled,
                escalation_enabled,
                allow_proxy_submission,
                manual_entry_days,
            } = req.body;

            if (!name || !email) {
                return sendResponse(res, 400, 'name and email are required');
            }

            const vendor = await VendorModel.findById(req.params.id);
            if (!vendor) {
                return sendResponse(res, 404, 'Vendor not found');
            }

            if (email !== vendor.email) {
                const existingEmail = await VendorModel.findByEmail(email);
                if (existingEmail) {
                    return sendResponse(res, 400, 'Email already in use');
                }
            }

            await VendorModel.update(req.params.id, {
                name,
                email,
                upload_mandatory: upload_mandatory !== undefined ? upload_mandatory : vendor.upload_mandatory,
                allocation_enforced: allocation_enforced !== undefined ? allocation_enforced : vendor.allocation_enforced,
                locking_enabled: locking_enabled !== undefined ? locking_enabled : vendor.locking_enabled,
                escalation_enabled: escalation_enabled !== undefined ? escalation_enabled : vendor.escalation_enabled,
                allow_proxy_submission: allow_proxy_submission !== undefined ? allow_proxy_submission : vendor.allow_proxy_submission,
                manual_entry_days: manual_entry_days !== undefined ? manual_entry_days : vendor.manual_entry_days,
            });

            const updated = await VendorModel.findById(req.params.id);
            return sendResponse(res, 200, 'Vendor updated successfully', { vendor: updated });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

};

module.exports = VendorController;