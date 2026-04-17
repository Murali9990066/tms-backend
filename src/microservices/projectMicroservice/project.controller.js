const ProjectModel = require('./project.model');
const UserModel = require('../userMicroservice/user.model');
const sendResponse = require('../../shared/utils/response.util');

const ProjectController = {

    // ─── PROJECT ───────────────────────────────────────────

    // POST /project
    createProject: async (req, res) => {
        try {
            const { vendor_id, name, project_type, client_name } = req.body;

            if (!vendor_id || !name || !project_type) {
                return sendResponse(res, 400, 'vendor_id, name and project_type are required');
            }

            // check duplicate project name within vendor
            const existing = await ProjectModel.findByNameAndVendor(name, vendor_id);
            if (existing) {
                return sendResponse(res, 400, 'Project with this name already exists for this vendor');
            }

            await ProjectModel.create({ vendor_id, name, project_type, client_name });
            const project = await ProjectModel.findByNameAndVendor(name, vendor_id);

            return sendResponse(res, 201, 'Project created successfully', { project });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /project?vendor_id=1
    getAllProjects: async (req, res) => {
        try {
            const { vendor_id } = req.query;

            if (!vendor_id) {
                return sendResponse(res, 400, 'vendor_id is required');
            }

            const projects = await ProjectModel.findAll(vendor_id);
            return sendResponse(res, 200, 'Projects fetched successfully', { projects });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /project/:id
    getProjectById: async (req, res) => {
        try {
            const project = await ProjectModel.findById(req.params.id);
            if (!project) {
                return sendResponse(res, 404, 'Project not found');
            }
            return sendResponse(res, 200, 'Project fetched successfully', { project });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // PUT /project/:id
    updateProject: async (req, res) => {
        try {
            const { name, project_type, client_name } = req.body;

            if (!name || !project_type) {
                return sendResponse(res, 400, 'name and project_type are required');
            }

            const project = await ProjectModel.findById(req.params.id);
            if (!project) {
                return sendResponse(res, 404, 'Project not found');
            }

            // check duplicate name within same vendor
            if (name !== project.name) {
                const existing = await ProjectModel.findByNameAndVendor(name, project.vendor_id);
                if (existing) {
                    return sendResponse(res, 400, 'Project with this name already exists for this vendor');
                }
            }

            await ProjectModel.update(req.params.id, { name, project_type, client_name });
            const updated = await ProjectModel.findById(req.params.id);
            return sendResponse(res, 200, 'Project updated successfully', { project: updated });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // PATCH /project/:id/status
    updateProjectStatus: async (req, res) => {
        try {
            const { is_active } = req.body;

            if (is_active === undefined) {
                return sendResponse(res, 400, 'is_active is required');
            }

            const project = await ProjectModel.findById(req.params.id);
            if (!project) {
                return sendResponse(res, 404, 'Project not found');
            }

            await ProjectModel.updateStatus(req.params.id, is_active);
            const updated = await ProjectModel.findById(req.params.id);
            return sendResponse(res, 200, `Project ${is_active ? 'activated' : 'deactivated'} successfully`, { project: updated });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // ─── TASK ──────────────────────────────────────────────

    // GET /project/tasks
    getAllTasks: async (req, res) => {
        try {
            const tasks = await ProjectModel.findAllTasks();
            return sendResponse(res, 200, 'Tasks fetched successfully', { tasks });
        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // PATCH /project/tasks/:id/status → SUPER_ADMIN only
    updateTaskStatus: async (req, res) => {
        try {
            const { is_active_globally } = req.body;

            if (is_active_globally === undefined) {
                return sendResponse(res, 400, 'is_active_globally is required');
            }

            const task = await ProjectModel.findTaskById(req.params.id);
            if (!task) {
                return sendResponse(res, 404, 'Task not found');
            }

            await ProjectModel.updateTaskStatus(req.params.id, is_active_globally);
            const updated = await ProjectModel.findTaskById(req.params.id);
            return sendResponse(res, 200, `Task ${is_active_globally ? 'activated' : 'deactivated'} globally`, { task: updated });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /project/tasks/vendor?vendor_id=1
    getVendorTasks: async (req, res) => {
        try {
            const { vendor_id } = req.query;

            if (!vendor_id) {
                return sendResponse(res, 400, 'vendor_id is required');
            }

            const tasks = await ProjectModel.findVendorTasks(vendor_id);
            return sendResponse(res, 200, 'Vendor tasks fetched successfully', { tasks });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // PATCH /project/tasks/:id/visibility → ADMIN only
    updateTaskVisibility: async (req, res) => {
        try {
            const { vendor_id, is_visible } = req.body;

            if (!vendor_id || is_visible === undefined) {
                return sendResponse(res, 400, 'vendor_id and is_visible are required');
            }

            const task = await ProjectModel.findTaskById(req.params.id);
            if (!task) {
                return sendResponse(res, 404, 'Task not found');
            }

            const vendorTask = await ProjectModel.findVendorTaskById(req.params.id, vendor_id);
            if (!vendorTask) {
                return sendResponse(res, 404, 'Task not found for this vendor');
            }

            await ProjectModel.updateTaskVisibility(req.params.id, vendor_id, is_visible);
            return sendResponse(res, 200, `Task ${is_visible ? 'enabled' : 'disabled'} for vendor`);

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // ─── ALLOCATION ────────────────────────────────────────

    // POST /project/allocation
    createAllocation: async (req, res) => {
        try {
            const { project_id, user_id, start_date, end_date } = req.body;

            if (!project_id || !user_id) {
                return sendResponse(res, 400, 'project_id and user_id are required');
            }

            const project = await ProjectModel.findById(project_id);
            if (!project) {
                return sendResponse(res, 404, 'Project not found');
            }

            const user = await UserModel.findById(user_id);
            if (!user) {
                return sendResponse(res, 404, 'User not found');
            }

            // check duplicate allocation
            const existing = await ProjectModel.findAllocationByProjectAndUser(project_id, user_id);
            if (existing) {
                return sendResponse(res, 400, 'User is already allocated to this project');
            }

            await ProjectModel.createAllocation({ project_id, user_id, start_date, end_date });
            const allocation = await ProjectModel.findAllocationByProjectAndUser(project_id, user_id);
            return sendResponse(res, 201, 'User allocated to project successfully', { allocation });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /project/allocation?project_id=1 or ?user_id=1
    getAllocations: async (req, res) => {
        try {
            const { project_id, user_id } = req.query;

            if (!project_id && !user_id) {
                return sendResponse(res, 400, 'project_id or user_id is required');
            }

            const allocations = project_id
                ? await ProjectModel.findAllocationsByProject(project_id)
                : await ProjectModel.findAllocationsByUser(user_id);

            return sendResponse(res, 200, 'Allocations fetched successfully', { allocations });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // DELETE /project/allocation/:id
    deleteAllocation: async (req, res) => {
        try {
            const allocation = await ProjectModel.findAllocationById(req.params.id);
            if (!allocation) {
                return sendResponse(res, 404, 'Allocation not found');
            }

            await ProjectModel.deleteAllocation(req.params.id);
            return sendResponse(res, 200, 'Allocation removed successfully');

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

};

module.exports = ProjectController;