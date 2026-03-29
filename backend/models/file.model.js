const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true
    },
    s3Key: {
        type: String,
        required: true,
        unique: true
    },
    size: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('File', FileSchema);
