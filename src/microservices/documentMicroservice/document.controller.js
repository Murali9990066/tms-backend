const path = require('path');
const fs = require('fs');
const DocumentModel = require('./document.model');
const sendResponse = require('../../shared/utils/response.util');

const BLOCKED_STATUSES = ['SUBMITTED', 'APPROVED'];

const DocumentController = {

    // POST /document/:timesheetId
    uploadDocuments: async (req, res) => {
        try {
            const { timesheetId } = req.params;
            const uploadedBy = req.user.id;

            // Check timesheet exists
            const timesheet = await DocumentModel.findTimesheetById(timesheetId);
            if (!timesheet) {
                if (req.files?.length) {
                    req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
                }
                return sendResponse(res, 404, 'Timesheet not found');
            }

            // Block upload if timesheet is SUBMITTED or APPROVED
            if (BLOCKED_STATUSES.includes(timesheet.status)) {
                if (req.files?.length) {
                    req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
                }
                return sendResponse(res, 403, `Cannot upload documents when timesheet is ${timesheet.status}`);
            }

            // No files sent
            if (!req.files || req.files.length === 0) {
                return sendResponse(res, 400, 'No files uploaded');
            }

            // Check existing doc count + new uploads don't exceed 5
            const existingCount = await DocumentModel.countByTimesheetId(timesheetId);
            if (Number(existingCount) + req.files.length > 5) {
                req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
                return sendResponse(res, 400, `Cannot upload ${req.files.length} file(s). Max 5 documents allowed per timesheet. Currently has ${existingCount}.`);
            }

            // Insert each uploaded file into DB
            const inserted = [];
            for (const file of req.files) {
                const fileType = path.extname(file.originalname).toLowerCase().replace('.', '');
                const docId = await DocumentModel.create({
                    timesheetId,
                    uploadedBy,
                    fileName: file.originalname,
                    fileType,
                    storagePath: file.path
                });
                inserted.push({ id: docId, file_name: file.originalname, file_type: fileType });
            }

            return sendResponse(res, 201, 'Documents uploaded successfully', { uploaded: inserted });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // GET /document/:timesheetId
    getDocuments: async (req, res) => {
        try {
            const { timesheetId } = req.params;

            const timesheet = await DocumentModel.findTimesheetById(timesheetId);
            if (!timesheet) return sendResponse(res, 404, 'Timesheet not found');

            const documents = await DocumentModel.findByTimesheetId(timesheetId);

            return sendResponse(res, 200, 'Documents fetched successfully', { documents });

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    },

    // DELETE /document/:documentId
    deleteDocument: async (req, res) => {
        try {
            const { documentId } = req.params;

            // Check document exists
            const document = await DocumentModel.findById(documentId);
            if (!document) return sendResponse(res, 404, 'Document not found');

            // Check timesheet status
            const timesheet = await DocumentModel.findTimesheetById(document.timesheet_id);
            if (!timesheet) return sendResponse(res, 404, 'Timesheet not found');

            if (BLOCKED_STATUSES.includes(timesheet.status)) {
                return sendResponse(res, 403, `Cannot delete documents when timesheet is ${timesheet.status}`);
            }

            // Delete file from disk
            if (fs.existsSync(document.storage_path)) {
                fs.unlinkSync(document.storage_path);
            }

            // Delete from DB
            await DocumentModel.deleteById(documentId);

            return sendResponse(res, 200, 'Document deleted successfully');

        } catch (err) {
            return sendResponse(res, 500, err.message);
        }
    }

};

module.exports = DocumentController;