const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const isProduction = process.env.NODE_ENV === 'production';
const PRESIGNED_URL_EXPIRY = 30 * 60; // 30 minutes in seconds

const generateFileUrl = async (storagePath) => {
    if (!storagePath) return null;

    if (isProduction) {
        // Generate presigned URL for S3
        const s3 = new S3Client({ region: process.env.AWS_REGION });
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: storagePath
        });
        const url = await getSignedUrl(s3, command, { expiresIn: PRESIGNED_URL_EXPIRY });
        return url;
    } else {
        // Local URL for development
        const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
        const normalizedPath = storagePath.replace(/\\/g, '/');
        return `${BASE_URL}/${normalizedPath}`;
    }
};

module.exports = { generateFileUrl };