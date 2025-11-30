#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authApi from './api/authApi.js';
import database from './db/database.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.WEB_URL || '*',
  credentials: true
}));
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PRIMUS GPT API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
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
  logger.info(`CORS enabled for: ${process.env.WEB_URL || '*'}`);
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
