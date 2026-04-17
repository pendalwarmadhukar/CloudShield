const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client } = require('@aws-sdk/client-s3');
const File = require('../models/File');
require('dotenv').config();

// Create S3 Client conditionally
let s3Client;
if (process.env.MOCK_AWS !== 'true') {
    s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
        }
    });
}

// @desc    Upload file and encrypt
// @route   POST /api/files/upload
// @access  Private
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const fileKey = `cloudshield/${req.user._id}/${Date.now()}_${file.originalname}`;

        if (process.env.MOCK_AWS === 'true') {
            console.log(`[MOCK AWS] Bypassing upload of: ${file.originalname}`);
        } else {
            const bucketName = process.env.S3_BUCKET_NAME;
            const kmsKeyId = process.env.KMS_KEY_ID;

            const params = {
                Bucket: bucketName,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
                ServerSideEncryption: (kmsKeyId && kmsKeyId !== 'your-kms-key-id') ? 'aws:kms' : 'AES256',
                ...((kmsKeyId && kmsKeyId !== 'your-kms-key-id') && { SSEKMSKeyId: kmsKeyId }),
            };

            const command = new PutObjectCommand(params);
            await s3Client.send(command);
        }

        // Save file document linked to User
        const newFile = await File.create({
            originalName: file.originalname,
            s3Key: fileKey,
            size: file.size ? (file.size / 1024).toFixed(2) + ' KB' : '0 KB',
            mimeType: file.mimetype,
            user: req.user._id, // Assign ownership
            isEncrypted: true
        });

        res.status(201).json({
            message: process.env.MOCK_AWS === 'true' ? 'Mock Upload successful' : 'Secure Upload successful',
            file: newFile
        });
    } catch (error) {
        console.error('File Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload and secure file' });
    }
};

// @desc    Get all files for current user
// @route   GET /api/files
// @access  Private
exports.getFiles = async (req, res) => {
    try {
        // Enforce ownership by passing user ID to find()
        const files = await File.find({ user: req.user._id }).sort({ uploadedAt: -1 });
        res.status(200).json(files);
    } catch (error) {
        console.error('Fetch Files Error:', error);
        res.status(500).json({ error: 'Failed to retrieve your secure files' });
    }
};

// @desc    Generate secure download link
// @route   POST /api/files/download
// @access  Private
exports.generatePresignedUrl = async (req, res) => {
    try {
        const { fileId } = req.body;
        
        if (!fileId) return res.status(400).json({ error: 'File ID is required' });

        const file = await File.findById(fileId);
        
        if (!file) return res.status(404).json({ error: 'File not found' });

        // Verify ownership
        if (file.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied: not your file' });
        }

        if (process.env.MOCK_AWS === 'true') {
            return res.status(200).json({ 
                url: `http://localhost:5000/mock/download/${file.s3Key}`,
                message: 'Mock secure link generated' 
            });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: file.s3Key,
        });

        // Explires in 5 minutes (300 seconds) - TEMPORARY access link requirement
        const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        res.status(200).json({ url });
    } catch (error) {
        console.error('Download Link Error:', error);
        res.status(500).json({ error: 'Failed to generate secure temporary link' });
    }
};

// @desc    Delete a file securely
// @route   DELETE /api/files/:id
// @access  Private
exports.deleteFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) return res.status(404).json({ error: 'File not found' });

        // Access control
        if (file.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'User not authorized to delete this file' });
        }

        // Delete from cloud
        if (process.env.MOCK_AWS !== 'true') {
            const command = new DeleteObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: file.s3Key,
            });
            await s3Client.send(command);
        }

        await file.deleteOne();

        res.status(200).json({ id: req.params.id, message: 'File securely deleted' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
};
