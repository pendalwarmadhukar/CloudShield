const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Main API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// CORS Bypass Proxy: Takes the S3 Expiring URL and fetches securely via NodeJS wrapper
app.post('/api/proxy-s3', async (req, res) => {
    try {
        const response = await fetch(req.body.url);
        if (!response.ok) throw new Error('S3 fetch refused');
        const textData = await response.text();
        res.status(200).send(textData);
    } catch (err) {
        console.error('Proxy Error:', err);
        res.status(500).send('CORS proxy blocked');
    }
});

if (process.env.MOCK_AWS === 'true') {
    app.get('/mock/download/*', (req, res) => {
        const fs = require('fs');
        const path = require('path');
        const s3Key = req.params[0];
        const mockFilePath = path.join(__dirname, 'mock_s3', s3Key.replace(/\//g, '-'));
        
        if (fs.existsSync(mockFilePath)) {
            res.sendFile(mockFilePath);
        } else {
            res.status(200).send(`
                <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: #6366f1;">Mock Secure File Decryption</h2>
                    <p>In a production environment, this link would automatically download the AES-256 decrypted file.</p>
                    <p style="color: #666; font-size: 0.9em;">Requested Key: ${s3Key} (File not found on disk)</p>
                </div>
            `);
        }
    });
}

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'CloudShield Secure API is running' });
});

// --- SERVE FRONTEND ---
const frontendPath = path.join(__dirname, '../frontend/dist');
console.log('Serving frontend from:', frontendPath);

// Static files
app.use(express.static(frontendPath));

// Catch-all route
app.get('*', (req, res) => {
    const indexPath = path.resolve(frontendPath, 'index.html');
    console.log('Request for:', req.url, '| Sending:', indexPath);
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(404).send('Frontend not built yet. Run "npm run build" in the frontend folder.');
        }
    });
});


// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`CloudShield Server running on port ${PORT}`);
});

