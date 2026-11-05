const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedInitialData = require('./seed');

let isConnected = false;
let mongodInstance = null;

/**
 * Connect to MongoDB Atlas, with an automatic fallback to an embedded
 * in-memory MongoDB instance for immediate local execution without manual Atlas setup.
 */
const connectDB = async () => {
  if (isConnected) {
    return;
  }

  let mongoUri = process.env.MONGODB_URI;
  const isPlaceholder = !mongoUri || mongoUri.includes('<username>') || mongoUri.includes('<db_user>') || mongoUri.includes('cluster0.abcde.mongodb.net');

  if (isPlaceholder) {
    console.log('\n[MongoDB] Atlas M0 URI placeholder detected.');
    console.log('[MongoDB] Starting automatic embedded local MongoDB for instant zero-config preview...');
    try {
      mongodInstance = await MongoMemoryServer.create();
      mongoUri = mongodInstance.getUri();
      console.log(`[MongoDB] Embedded MongoDB running at: ${mongoUri}`);
    } catch (err) {
      console.error('[MongoDB] Failed to start embedded MongoDB:', err.message);
      process.exit(1);
    }
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: true
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);

    // Seed demo data if database is empty
    await seedInitialData();
  } catch (error) {
    console.error('[MongoDB] Connection error:', error.message);
    // If remote connection failed, try falling back to local memory server
    if (!mongodInstance) {
      console.log('[MongoDB] Falling back to embedded local MongoDB...');
      try {
        mongodInstance = await MongoMemoryServer.create();
        const fallbackUri = mongodInstance.getUri();
        await mongoose.connect(fallbackUri);
        isConnected = true;
        console.log(`[MongoDB] Embedded fallback running at: ${fallbackUri}`);
        await seedInitialData();
      } catch (innerErr) {
        console.error('[MongoDB] Fallback also failed:', innerErr.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
