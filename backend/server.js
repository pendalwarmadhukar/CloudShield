const express = require('express');
const cors = require('cors');
const multer = require('multer');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db.config');
const { uploadFile, getFiles, generatePresignedUrl } = require('./controllers/upload.controller');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Multi-part file upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'CloudShield API is running securely' });
});

// Fetch all files from MongoDB
app.get('/api/files', getFiles);

// Secure upload endpoint
app.post('/api/upload', upload.single('file'), uploadFile);

// Secure access endpoint (Pre-signed URL)
app.post('/api/download-link', generatePresignedUrl);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong on our secure server' });
});

app.listen(PORT, () => {
    console.log(`CloudShield Server running on http://localhost:${PORT}`);
});
