const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_PATH)) {
    fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_PATH);
    },
    filename: (req, file, cb) => {
        const timesheetId = req.params.timesheetId;
        const originalName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${timesheetId}_${originalName}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.pdf', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, XLS, and XLSX files are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5                    // Max 5 files per upload
    }
});

module.exports = upload;