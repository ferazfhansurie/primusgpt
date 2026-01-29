#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authApi from './api/authApi.js';
import paymentApi from './api/paymentApi.js';
import webAuthApi from './api/webAuthApi.js';
import analysisApi from './api/analysisApi.js';
import database from './db/database.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.API_PORT || 3000;

// CORS configuration - allow both localhost and production
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',  // Local frontend
  'http://localhost:5174',  // Alternative Vite port
  process.env.WEB_URL,      // Production URL
  'https://primusgpt-ai.vercel.app',  // Production domain
  'https://primusgpt-ai.vercel.app'  // Vercel deployment
].filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
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

// Initialize database
await database.initialize();

// Routes
app.use('/api/auth', authApi);
app.use('/api/payment', paymentApi);
app.use('/api/web-auth', webAuthApi);
app.use('/api/analysis', analysisApi);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PRIMUS GPT API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      webAuth: '/api/web-auth',
      analysis: '/api/analysis',
      payment: '/api/payment',
      health: '/api/auth/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  logger.success(`API server running on port ${PORT}`);
  logger.info(`Allowed origins: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('API server shutting down...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('API server shutting down...');
  await database.close();
  process.exit(0);
});
