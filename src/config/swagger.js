const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Timesheet Management System API',
            version: '1.0.0',
            description: 'TMS API Documentation',
        },
        servers: [{ url: 'http://localhost:3000', description: 'Local server' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
            schemas: {
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'success' },
                        statusCode: { type: 'integer', example: 200 },
                        message: { type: 'string', example: 'Operation successful' },
                        data: { type: 'object' },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'error' },
                        statusCode: { type: 'integer', example: 400 },
                        message: { type: 'string', example: 'Something went wrong' },
                    },
                },
                Vendor: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        company_code: { type: 'string', example: 'TMS' },
                        name: { type: 'string', example: 'Test Company' },
                        email: { type: 'string', example: 'admin@testcompany.com' },
                        upload_mandatory: { type: 'boolean', example: true },
                        allocation_enforced: { type: 'boolean', example: false },
                        locking_enabled: { type: 'boolean', example: false },
                        escalation_enabled: { type: 'boolean', example: false },
                        allow_proxy_submission: { type: 'boolean', example: false },
                        manual_entry_days: { type: 'integer', example: null },
                        created_at: { type: 'string', example: '2026-04-06 10:00:00' },
                        updated_at: { type: 'string', example: '2026-04-06 10:00:00' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        vendor_id: { type: 'integer', example: 1 },
                        display_employee_id: { type: 'string', example: 'TMS-EMP-001' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john@testcompany.com' },
                        role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'PM', 'EMPLOYEE'], example: 'EMPLOYEE' },
                        timezone: { type: 'string', example: 'Asia/Kolkata' },
                        reporting_manager_id: { type: 'integer', example: null },
                        is_active: { type: 'boolean', example: true },
                        is_first_login: { type: 'boolean', example: true },
                    },
                },
                Project: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        vendor_id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'TMS Development' },
                        project_type: { type: 'string', example: 'Internal' },
                        client_name: { type: 'string', example: 'Internal Team' },
                        is_active: { type: 'boolean', example: true },
                    },
                },
                Task: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Development' },
                        is_active_globally: { type: 'boolean', example: true },
                    },
                },
                Timesheet: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        week_start: { type: 'string', example: '2026-04-06' },
                        week_end: { type: 'string', example: '2026-04-12' },
                        status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], example: 'DRAFT' },
                    },
                },
                TimesheetEntry: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        date: { type: 'string', example: '2026-04-07' },
                        project_id: { type: 'integer', example: 1 },
                        project_name: { type: 'string', example: 'TMS Development' },
                        task_id: { type: 'integer', example: 1 },
                        task_name: { type: 'string', example: 'Development' },
                        hours: { type: 'number', example: 8.00 },
                        comment: { type: 'string', example: 'Initial setup' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
        paths: {

            // ─── AUTH ─────────────────────────────────────────────

            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', example: 'superadmin@tms.com' },
                                        password: { type: 'string', example: 'SuperAdmin@TMS123' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Login successful' },
                        401: { description: 'Invalid credentials' },
                        403: { description: 'Account deactivated' },
                    },
                },
            },

            '/auth/logout': {
                post: {
                    tags: ['Auth'],
                    summary: 'Logout',
                    responses: { 200: { description: 'Logged out successfully' } },
                },
            },

            '/auth/change-password': {
                post: {
                    tags: ['Auth'],
                    summary: 'Change password — first login only',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['new_password', 'confirm_password'],
                                    properties: {
                                        new_password: { type: 'string', example: 'NewPass@123' },
                                        confirm_password: { type: 'string', example: 'NewPass@123' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Password changed successfully' },
                        400: { description: 'Validation error or same password' },
                        403: { description: 'Not first login' },
                    },
                },
            },

            '/auth/update-password': {
                post: {
                    tags: ['Auth'],
                    summary: 'Update password — logged in user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['current_password', 'new_password', 'confirm_password'],
                                    properties: {
                                        current_password: { type: 'string', example: 'CurrentPass@123' },
                                        new_password: { type: 'string', example: 'NewPass@123' },
                                        confirm_password: { type: 'string', example: 'NewPass@123' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Password updated successfully' },
                        400: { description: 'Same password or validation error' },
                        401: { description: 'Current password incorrect' },
                    },
                },
            },

            '/auth/forgot-password': {
                post: {
                    tags: ['Auth'],
                    summary: 'Forgot password — sends reset link',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email'],
                                    properties: { email: { type: 'string', example: 'john@testcompany.com' } },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Reset link sent (check terminal for now)' } },
                },
            },

            '/auth/reset-password': {
                post: {
                    tags: ['Auth'],
                    summary: 'Reset password using token from link',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['token', 'new_password', 'confirm_password'],
                                    properties: {
                                        token: { type: 'string', example: 'abc123xyz...' },
                                        new_password: { type: 'string', example: 'Reset@123' },
                                        confirm_password: { type: 'string', example: 'Reset@123' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Password reset successfully' },
                        400: { description: 'Invalid or expired token' },
                    },
                },
            },

            // ─── VENDOR ───────────────────────────────────────────

            '/vendor': {
                post: {
                    tags: ['Vendor'],
                    summary: 'Create vendor — SUPER_ADMIN only',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['company_code', 'name', 'email'],
                                    properties: {
                                        company_code: { type: 'string', example: 'TMS' },
                                        name: { type: 'string', example: 'Test Company' },
                                        email: { type: 'string', example: 'admin@testcompany.com' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Vendor created with admin credentials' },
                        400: { description: 'Duplicate company code or email' },
                    },
                },
                get: {
                    tags: ['Vendor'],
                    summary: 'Get all vendors — SUPER_ADMIN only',
                    responses: { 200: { description: 'Vendors fetched successfully' } },
                },
            },

            '/vendor/{id}': {
                get: {
                    tags: ['Vendor'],
                    summary: 'Get vendor by ID — SUPER_ADMIN only',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: {
                        200: { description: 'Vendor fetched successfully' },
                        404: { description: 'Vendor not found' },
                    },
                },
                put: {
                    tags: ['Vendor'],
                    summary: 'Update vendor — SUPER_ADMIN only',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'email'],
                                    properties: {
                                        name: { type: 'string', example: 'Updated Company' },
                                        email: { type: 'string', example: 'updated@testcompany.com' },
                                        upload_mandatory: { type: 'boolean', example: true },
                                        allocation_enforced: { type: 'boolean', example: false },
                                        locking_enabled: { type: 'boolean', example: false },
                                        escalation_enabled: { type: 'boolean', example: false },
                                        allow_proxy_submission: { type: 'boolean', example: false },
                                        manual_entry_days: { type: 'integer', example: 7 },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Vendor updated successfully' },
                        404: { description: 'Vendor not found' },
                    },
                },
            },

            // ─── USER ─────────────────────────────────────────────

            '/user': {
                post: {
                    tags: ['User'],
                    summary: 'Create user — ADMIN only',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['vendor_id', 'display_employee_id', 'name', 'email', 'role', 'timezone'],
                                    properties: {
                                        vendor_id: { type: 'integer', example: 1 },
                                        display_employee_id: { type: 'string', example: 'TMS-EMP-001' },
                                        name: { type: 'string', example: 'John Doe' },
                                        email: { type: 'string', example: 'john@testcompany.com' },
                                        role: { type: 'string', enum: ['ADMIN', 'PM', 'EMPLOYEE'], example: 'EMPLOYEE' },
                                        timezone: { type: 'string', example: 'Asia/Kolkata' },
                                        reporting_manager_id: { type: 'integer', example: null },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'User created with temporary password' },
                        400: { description: 'Validation error' },
                    },
                },
                get: {
                    tags: ['User'],
                    summary: 'Get all users — ADMIN, SUPER_ADMIN',
                    parameters: [
                        { name: 'vendor_id', in: 'query', required: true, schema: { type: 'integer' } },
                        { name: 'role', in: 'query', required: false, schema: { type: 'string', enum: ['ADMIN', 'PM', 'EMPLOYEE'] } },
                    ],
                    responses: { 200: { description: 'Users fetched successfully' } },
                },
            },

            '/user/{id}': {
                get: {
                    tags: ['User'],
                    summary: 'Get user by ID',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: {
                        200: { description: 'User fetched successfully' },
                        404: { description: 'User not found' },
                    },
                },
                put: {
                    tags: ['User'],
                    summary: 'Update user — ADMIN only',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'email', 'timezone'],
                                    properties: {
                                        name: { type: 'string', example: 'John Updated' },
                                        email: { type: 'string', example: 'johnupdated@testcompany.com' },
                                        timezone: { type: 'string', example: 'America/New_York' },
                                        reporting_manager_id: { type: 'integer', example: null },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'User updated successfully' },
                        404: { description: 'User not found' },
                    },
                },
            },

            '/user/{id}/status': {
                patch: {
                    tags: ['User'],
                    summary: 'Activate or deactivate user — ADMIN only',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['is_active'],
                                    properties: { is_active: { type: 'boolean', example: false } },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'User status updated' } },
                },
            },

            // ─── PROJECT ──────────────────────────────────────────

            '/project': {
                post: {
                    tags: ['Project'],
                    summary: 'Create project — ADMIN only',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['vendor_id', 'name', 'project_type'],
                                    properties: {
                                        vendor_id: { type: 'integer', example: 1 },
                                        name: { type: 'string', example: 'TMS Development' },
                                        project_type: { type: 'string', example: 'Internal' },
                                        client_name: { type: 'string', example: 'Internal Team' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 201: { description: 'Project created successfully' } },
                },
                get: {
                    tags: ['Project'],
                    summary: 'Get all projects — ADMIN, PM',
                    parameters: [{ name: 'vendor_id', in: 'query', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Projects fetched successfully' } },
                },
            },

            '/project/{id}': {
                get: {
                    tags: ['Project'],
                    summary: 'Get project by ID — ADMIN, PM',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: {
                        200: { description: 'Project fetched successfully' },
                        404: { description: 'Project not found' },
                    },
                },
                put: {
                    tags: ['Project'],
                    summary: 'Update project — ADMIN only',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'project_type'],
                                    properties: {
                                        name: { type: 'string', example: 'TMS Development Updated' },
                                        project_type: { type: 'string', example: 'External' },
                                        client_name: { type: 'string', example: 'ABC Corp' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Project updated successfully' } },
                },
            },

            '/project/{id}/status': {
                patch: {
                    tags: ['Project'],
                    summary: 'Activate or deactivate project — ADMIN only',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['is_active'],
                                    properties: { is_active: { type: 'boolean', example: false } },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Project status updated' } },
                },
            },

            // ─── TASK ─────────────────────────────────────────────

            '/project/tasks': {
                get: {
                    tags: ['Task'],
                    summary: 'Get all global tasks — ADMIN, SUPER_ADMIN',
                    responses: { 200: { description: 'Tasks fetched successfully' } },
                },
            },

            '/project/tasks/vendor': {
                get: {
                    tags: ['Task'],
                    summary: 'Get vendor tasks — ADMIN, PM, EMPLOYEE',
                    parameters: [{ name: 'vendor_id', in: 'query', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Vendor tasks fetched successfully' } },
                },
            },

            '/project/tasks/{id}/status': {
                patch: {
                    tags: ['Task'],
                    summary: 'Activate or deactivate task globally — SUPER_ADMIN only',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['is_active_globally'],
                                    properties: { is_active_globally: { type: 'boolean', example: false } },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Task status updated globally' } },
                },
            },

            '/project/tasks/{id}/visibility': {
                patch: {
                    tags: ['Task'],
                    summary: 'Enable or disable task visibility per vendor — ADMIN only',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['vendor_id', 'is_visible'],
                                    properties: {
                                        vendor_id: { type: 'integer', example: 1 },
                                        is_visible: { type: 'boolean', example: false },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Task visibility updated' } },
                },
            },

            // ─── ALLOCATION ───────────────────────────────────────

            '/project/allocation': {
                post: {
                    tags: ['Allocation'],
                    summary: 'Allocate employee to project — ADMIN only',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['project_id', 'user_id'],
                                    properties: {
                                        project_id: { type: 'integer', example: 1 },
                                        user_id: { type: 'integer', example: 2 },
                                        start_date: { type: 'string', example: '2026-04-01' },
                                        end_date: { type: 'string', example: null },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'User allocated successfully' },
                        400: { description: 'Already allocated' },
                    },
                },
                get: {
                    tags: ['Allocation'],
                    summary: 'Get allocations by project or user — ADMIN, PM',
                    parameters: [
                        { name: 'project_id', in: 'query', required: false, schema: { type: 'integer' } },
                        { name: 'user_id', in: 'query', required: false, schema: { type: 'integer' } },
                    ],
                    responses: { 200: { description: 'Allocations fetched successfully' } },
                },
            },

            '/project/allocation/{id}': {
                delete: {
                    tags: ['Allocation'],
                    summary: 'Remove allocation — ADMIN only',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: {
                        200: { description: 'Allocation removed successfully' },
                        404: { description: 'Allocation not found' },
                    },
                },
            },

            // ─── TIMESHEET ────────────────────────────────────────

            '/timesheet/save': {
                post: {
                    tags: ['Timesheet'],
                    summary: 'Save or update timesheet draft — EMPLOYEE',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['week_start', 'entries'],
                                    properties: {
                                        week_start: { type: 'string', example: '2026-04-06' },
                                        entries: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    date: { type: 'string', example: '2026-04-07' },
                                                    project_id: { type: 'integer', example: 1 },
                                                    task_id: { type: 'integer', example: 1 },
                                                    hours: { type: 'number', example: 8 },
                                                    comment: { type: 'string', example: 'Initial setup' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Timesheet saved successfully' } },
                },
            },

            '/timesheet': {
                get: {
                    tags: ['Timesheet'],
                    summary: 'Get timesheet by week — EMPLOYEE',
                    parameters: [{ name: 'week_start', in: 'query', required: true, schema: { type: 'string' }, example: '2026-04-06' }],
                    responses: { 200: { description: 'Timesheet fetched successfully' } },
                },
            },

        },
    },
    apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;