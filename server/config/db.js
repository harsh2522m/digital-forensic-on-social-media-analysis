const mongoose = require('mongoose');

let isConnected = false;
const inMemoryStore = {
  investigations: [],
  evidence: []
};

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/digital-forensics';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 3000,
    });

    isConnected = true;
    console.log(`✓ MongoDB connected: ${mongoURI}`);
  } catch (error) {
    console.warn('⚠ MongoDB connection warning:', error.message);
    console.warn('⚠ Running in DEMO MODE (in-memory storage only)');
    isConnected = false;
    // Enable demo mode
    process.env.DEMO_MODE = 'true';
  }
};

const getConnectionStatus = () => isConnected;
const getInMemoryStore = () => inMemoryStore;

module.exports = connectDB;
module.exports.getConnectionStatus = getConnectionStatus;
module.exports.getInMemoryStore = getInMemoryStore;
