const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cloudshield_v2';
        console.log(`[DEBUG] Attempting to connect to MongoDB URI: ${uri.replace(/:([^:@]{3,})@/, ':***@')}`);
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Database Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Database Connection Failed: ${error.message}`);
        console.log(`Make sure MongoDB is running or MONGODB_URI is correct in .env`);
        // We will not exit the process immediately so server stays up for debugging
    }
};

module.exports = connectDB;
