const express = require('express');
const router = express.Router();
const ProjectController = require('./project.controller');
const authorize = require('../../shared/middleware/rbac.middleware');

// ─── TASK ──────────────────────────────────────────────
// must be before /:id routes to avoid conflict

// GET    /project/tasks
router.get('/tasks', authorize('ADMIN', 'SUPER_ADMIN'), ProjectController.getAllTasks);

// GET    /project/tasks/vendor?vendor_id=1
router.get('/tasks/vendor', authorize('ADMIN', 'PM', 'EMPLOYEE'), ProjectController.getVendorTasks);

// PATCH  /project/tasks/:id/status
router.patch('/tasks/:id/status', authorize('SUPER_ADMIN'), ProjectController.updateTaskStatus);

// PATCH  /project/tasks/:id/visibility
router.patch('/tasks/:id/visibility', authorize('ADMIN'), ProjectController.updateTaskVisibility);

// ─── ALLOCATION ────────────────────────────────────────
// must be before /:id routes to avoid conflict

// POST   /project/allocation
router.post('/allocation', authorize('ADMIN'), ProjectController.createAllocation);

// GET    /project/allocation?project_id=1 or ?user_id=1
router.get('/allocation', authorize('ADMIN', 'PM'), ProjectController.getAllocations);

// DELETE /project/allocation/:id
router.delete('/allocation/:id', authorize('ADMIN'), ProjectController.deleteAllocation);

// ─── PROJECT ───────────────────────────────────────────

// POST   /project
router.post('/', authorize('ADMIN'), ProjectController.createProject);

// GET    /project?vendor_id=1
router.get('/', authorize('ADMIN', 'PM'), ProjectController.getAllProjects);

// GET    /project/:id
router.get('/:id', authorize('ADMIN', 'PM'), ProjectController.getProjectById);

// PUT    /project/:id
router.put('/:id', authorize('ADMIN'), ProjectController.updateProject);

// PATCH  /project/:id/status
router.patch('/:id/status', authorize('ADMIN'), ProjectController.updateProjectStatus);

module.exports = router;