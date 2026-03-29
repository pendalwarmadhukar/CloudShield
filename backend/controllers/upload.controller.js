const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/aws.config');
const File = require('../models/file.model');
require('dotenv').config();

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const fileKey = `uploads/${Date.now()}_${file.originalname}`;

        if (process.env.MOCK_AWS === 'true') {
            console.log('--- MOCK UPLOAD ENABLED ---');
            console.log(`Bypassing S3 Upload for: ${file.originalname}`);
        } else {
            const bucketName = process.env.S3_BUCKET_NAME;
            const kmsKeyId = process.env.KMS_KEY_ID;

            const params = {
                Bucket: bucketName,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
                ServerSideEncryption: 'aws:kms',
                SSEKMSKeyId: kmsKeyId,
            };

            const command = new PutObjectCommand(params);
            await s3Client.send(command);
        }

        // Save metadata to MongoDB (This works even in mock mode)
        const newFile = await File.create({
            originalName: file.originalname,
            s3Key: fileKey,
            size: file.size ? (file.size / 1024).toFixed(2) + ' KB' : '0 KB',
            mimeType: file.mimetype
        });

        res.status(200).json({
            message: process.env.MOCK_AWS === 'true' 
                ? 'File metadata saved in Mock Mode (Bypassed AWS Cloud)' 
                : 'File uploaded securely and indexed in MongoDB',
            file: newFile
        });
    } catch (error) {
        console.error('--- UPLOAD ERROR ---');
        console.error(error);
        res.status(500).json({ 
            error: 'Failed to upload and index file', 
            details: error.message 
        });
    }
};

const getFiles = async (req, res) => {
    try {
        const files = await File.find().sort({ uploadedAt: -1 });
        res.status(200).json(files);
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ error: 'Failed to retrieve files from database' });
    }
};

const generatePresignedUrl = async (req, res) => {
    try {
        const { fileKey } = req.body;
        if (!fileKey) {
            return res.status(400).json({ error: 'File key is required' });
        }

        if (process.env.MOCK_AWS === 'true') {
            // Return a dummy link in mock mode
            return res.status(200).json({ 
                url: `https://example.com/mock-download/${fileKey}`,
                message: 'Mock download link generated' 
            });
        }

        const bucketName = process.env.S3_BUCKET_NAME;
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
        });

        // URL expires in 15 minutes (900 seconds)
        const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });

        res.status(200).json({ url });
    } catch (error) {
        console.error('Presigned URL Error:', error);
        res.status(500).json({ error: 'Failed to generate secure access link' });
    }
};

module.exports = {
    uploadFile,
    getFiles,
    generatePresignedUrl
};
