import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

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
    timestamp: new Date().toISOString()
  });
});

// Lazy load routes
app.use('/api/auth', async (req, res, next) => {
  try {
    const { default: authApi } = await import('../src/api/authApi.js');
    return authApi(req, res, next);
  } catch (error) {
    console.error('Error loading authApi:', error);
    res.status(500).json({ error: 'Failed to load auth API', details: error.message });
  }
});

app.use('/api/payment', async (req, res, next) => {
  try {
    const { default: paymentApi } = await import('../src/api/paymentApi.js');
    return paymentApi(req, res, next);
  } catch (error) {
    console.error('Error loading paymentApi:', error);
    res.status(500).json({ error: 'Failed to load payment API', details: error.message });
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
