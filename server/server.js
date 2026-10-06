const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const investigationRoutes = require('./routes/investigations');
const evidenceRoutes = require('./routes/evidence');
const analysisRoutes = require('./routes/analysis');
const reportRoutes = require('./routes/reports');

// Initialize Express app
const app = express();

// Connect to MongoDB (non-blocking)
connectDB().catch(err => console.warn('DB connection skipped:', err.message));

// Security Middleware
// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS Configuration
// Development allows localhost, production uses CLIENT_URL
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Request Size Limits
// Prevent extremely large submissions
const REQUEST_LIMIT = '10mb'; // Reasonable limit for evidence content + file metadata
app.use(bodyParser.json({ limit: REQUEST_LIMIT }));
app.use(bodyParser.urlencoded({ limit: REQUEST_LIMIT, extended: true }));

// Request logging middleware (simple, production-safe)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  
  // Log only method and path, no request body or sensitive data
  if (process.env.NODE_ENV !== 'production' || path.startsWith('/api/health')) {
    console.log(`${timestamp} - ${method} ${path}`);
  }
  next();
});

// Routes
app.use('/api/investigations', investigationRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Digital Forensic Analysis API is running',
    phase: 'Phase 5 - Production Verification',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Digital Forensic Social Media Analysis API',
    version: '1.0.0',
    status: 'running',
    phase: 'Phase 5 - Production Verification',
    endpoints: {
      health: '/api/health',
      investigations: '/api/investigations',
      evidence: '/api/evidence',
      analysis: '/api/analysis',
      reports: '/api/reports'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    message: 'The requested endpoint does not exist'
  });
});

// Error handling middleware
// Production: Safe error messages
// Development: Include stack traces for debugging
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  // Log error (including details for debugging)
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${timestamp}] Error:`, err);
  } else {
    // Production: log error ID for support reference, but not stack trace
    console.error(`[${timestamp}] Error ID: ${err.id || 'unknown'}`, err.message);
  }

  // Determine status code
  const status = err.status || err.statusCode || 500;
  
  // Prepare safe error response
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    timestamp: timestamp,
    path: req.path
  };

  // Add stack trace only in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  res.status(status).json(errorResponse);
});

// Start server
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${NODE_ENV}`);
  console.log(`✓ CORS Origin: ${corsOptions.origin}`);
  console.log(`✓ Request Size Limit: ${REQUEST_LIMIT}`);
  console.log(`✓ Security: Helmet enabled`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (NODE_ENV === 'development') {
    console.log('Available endpoints:');
    console.log(`  GET  /`);
    console.log(`  GET  /api/health`);
    console.log(`  GET  /api/investigations`);
    console.log(`  POST /api/investigations`);
    console.log(`  GET  /api/investigations/:id`);
    console.log(`  PUT  /api/investigations/:id`);
    console.log(`  DELETE /api/investigations/:id`);
    console.log(`  (and all evidence, analysis, report endpoints)\n`);
  }
});
