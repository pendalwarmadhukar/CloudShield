const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cloudshield_v2';
        console.log(`[DEBUG] Attempting to connect to MongoDB URI: ${uri.replace(/:([^:@]{3,})@/, ':***@')}`);
        const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log(`MongoDB Database Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Database Connection Failed: ${error.message}`);
        console.log(`Spinning up a local in-memory MongoDB database server as a fallback...`);
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create({
                instance: {
                    spawnTimeout: 60000
                },
                binary: {
                    version: '5.0.22'
                }
            });
            const memoryUri = mongoServer.getUri();
            console.log(`[DEBUG] In-Memory MongoDB Server started at: ${memoryUri}`);
            const conn = await mongoose.connect(memoryUri);
            console.log(`MongoDB Database (In-Memory Fallback) Connected: ${conn.connection.host}`);
        } catch (innerError) {
            console.error(`Failed to start/connect to In-Memory MongoDB Server: ${innerError.message}`);
        }
    }
};

module.exports = connectDB;
