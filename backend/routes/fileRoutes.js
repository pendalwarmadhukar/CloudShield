const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile, getFiles, generatePresignedUrl, deleteFile } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');

// Multi-part file buffer for memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// All routes are protected via JWT
router.use(protect);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getFiles);
router.post('/download', generatePresignedUrl);
router.delete('/:id', deleteFile);

module.exports = router;
