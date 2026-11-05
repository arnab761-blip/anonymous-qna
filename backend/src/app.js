const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Routes
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const likeRoutes = require('./routes/likeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Global error handler
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Security Headers
app.use(helmet());

// Gzip Compression
app.use(compression());

// CORS configuration (allow requests from frontend development & production)
const allowedOrigins = [
  'http://localhost:5173',
  'https://anonymous-qna.pages.dev'
];
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) allowedOrigins.push(trimmed);
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Payload size limit to prevent memory exhaustion attacks
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Telemetry metrics endpoint for load test monitoring
app.get('/metrics', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const status = await mongoose.connection.db.command({ serverStatus: 1 });
    res.status(200).json({
      success: true,
      connections: status.connections,
      opcounters: status.opcounters,
      mem: process.memoryUsage()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount API routes
app.use('/auth', authRoutes);
app.use('/questions', questionRoutes);
app.use('/like', likeRoutes);
app.use('/reports', reportRoutes);
app.use('/upload', uploadRoutes);
app.use('/admin', adminRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'অনুরোধকৃত রুট বা এন্ডপয়েন্টটি খুঁজে পাওয়া যায়নি।'
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
