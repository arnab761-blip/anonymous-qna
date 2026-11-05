require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB Atlas (singleton pool with maxPoolSize: 10)
  await connectDB();

  const server = http.createServer(app);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Anonymous Q&A backend running on port: ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Closing HTTP server and MongoDB connections...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      try {
        await mongoose.connection.close();
        console.log('[MongoDB] Connection pool closed gracefully.');
        process.exit(0);
      } catch (err) {
        console.error('[MongoDB] Error during disconnect:', err.message);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
