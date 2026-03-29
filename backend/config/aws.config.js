const { S3Client } = require('@aws-sdk/client-s3');
const { KMSClient } = require('@aws-sdk/client-kms');
require('dotenv').config();

const region = process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock'
    }
});

const kmsClient = new KMSClient({
    region,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock'
    }
});

module.exports = { s3Client, kmsClient };
