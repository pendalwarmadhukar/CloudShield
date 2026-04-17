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
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    isEncrypted: {
        type: Boolean,
        default: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('File', FileSchema);
