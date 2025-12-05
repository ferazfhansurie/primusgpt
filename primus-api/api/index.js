import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Global state for lazy loading
let dbInitialized = false;
let database = null;
let authApi = null;
let paymentApi = null;

// CORS configuration - allow all origins for now
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Stripe webhook endpoint needs raw body
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Database initialization middleware
async function initializeDatabase() {
  if (!dbInitialized) {
    try {
      const dbModule = await import('../src/db/database.js');
      database = dbModule.default;
      await database.initialize();
      dbInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }
  return database;
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PRIMUS GPT API',
    version: '1.0.0',
    status: 'running',
    message: 'API is working!',
    endpoints: {
      auth: '/api/auth',
      payment: '/api/payment',
      health: '/api/health'
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'PRIMUS GPT API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasStripe: !!process.env.STRIPE_SECRET_KEY,
      hasOpenAI: !!process.env.OPENAI_API_KEY
    }
  });
});

// Auth routes with lazy loading and DB initialization
app.use('/api/auth', async (req, res, next) => {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Load auth API if not loaded
    if (!authApi) {
      const authModule = await import('../src/api/authApi.js');
      authApi = authModule.default;
    }
    
    return authApi(req, res, next);
  } catch (error) {
    console.error('Error in auth route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process auth request', 
      details: error.message 
    });
  }
});

// Payment routes with lazy loading and DB initialization
app.use('/api/payment', async (req, res, next) => {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Load payment API if not loaded
    if (!paymentApi) {
      const paymentModule = await import('../src/api/paymentApi.js');
      paymentApi = paymentModule.default;
    }
    
    return paymentApi(req, res, next);
  } catch (error) {
    console.error('Error in payment route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process payment request', 
      details: error.message 
    });
  }
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
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Export for Vercel
export default app;
