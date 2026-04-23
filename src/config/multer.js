const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isProduction = process.env.NODE_ENV === 'production';

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

let storage;

if (isProduction) {
    // S3 storage for production
    const multerS3 = require('multer-s3');
    const { S3Client } = require('@aws-sdk/client-s3');

    const s3 = new S3Client({ region: process.env.AWS_REGION });

    storage = multerS3({
        s3,
        bucket: process.env.AWS_S3_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const timesheetId = req.params.timesheetId;
            const originalName = file.originalname.replace(/\s+/g, '_');
            const s3Key = `${process.env.AWS_S3_PREFIX}/${timesheetId}_${originalName}`;
            cb(null, s3Key);
        }
    });

} else {
    // Local disk storage for development
    const UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads';

    if (!fs.existsSync(UPLOAD_PATH)) {
        fs.mkdirSync(UPLOAD_PATH, { recursive: true });
    }

    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, UPLOAD_PATH);
        },
        filename: (req, file, cb) => {
            const timesheetId = req.params.timesheetId;
            const originalName = file.originalname.replace(/\s+/g, '_');
            cb(null, `${timesheetId}_${originalName}`);
        }
    });
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5                    // Max 5 files per upload
    }
});

module.exports = upload;