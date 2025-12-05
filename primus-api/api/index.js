import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authApi from '../src/api/authApi.js';
import paymentApi from '../src/api/paymentApi.js';
import database from '../src/db/database.js';
import logger from '../src/utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  process.env.WEB_URL,
  'https://primusgpt-ai.vercel.app',
  'https://primusgpt-kxom01q8d-juta-softwares-projects.vercel.app',
  /https:\/\/primusgpt-.*\.vercel\.app$/
].filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Stripe webhook endpoint needs raw body
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Database initialization middleware
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await database.initialize();
      dbInitialized = true;
      logger.success('Database initialized');
    } catch (error) {
      logger.error('Database initialization failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Database initialization failed'
      });
    }
  }
  next();
});

// Routes
app.use('/api/auth', authApi);
app.use('/api/payment', paymentApi);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PRIMUS GPT API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      payment: '/api/payment',
      health: '/api/auth/health'
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'PRIMUS GPT API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      payment: '/api/payment',
      health: '/api/auth/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Export for Vercel
export default app;
