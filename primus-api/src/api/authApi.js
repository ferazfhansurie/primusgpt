import express from 'express';
import cors from 'cors';
import database from '../db/database.js';
import authService from '../auth/authService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Register a new user
 * POST /api/auth/register
 * Body: { telegram_id, email, phone, first_name, last_name, username }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, phone, first_name, last_name } = req.body;

    // Validate required fields
    if (!email || !authService.validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required'
      });
    }

    if (!phone || !authService.validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Valid phone number is required (include country code)'
      });
    }

    // Check if email already exists
    const emailCheck = await database.getUserByEmail(email);
    if (emailCheck) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Check if phone already exists
    const phoneCheck = await database.getUserByPhone(phone);
    if (phoneCheck) {
      return res.status(409).json({
        success: false,
        error: 'Phone number already registered'
      });
    }

    // Create user (without telegram_id yet)
    const query = `
      INSERT INTO users (
        email,
        phone,
        first_name,
        last_name
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const result = await database.query(query, [
      email,
      phone,
      first_name || null,
      last_name || null
    ]);

    const user = result.rows[0];

    // Log successful registration
    await database.query(
      'INSERT INTO login_attempts (telegram_id, success, attempt_type) VALUES ($1, $2, $3)',
      [0, true, 'web_registration']
    );

    logger.success(`New user registered via web: ${email} (${phone})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now login via Telegram bot.',
      user: {
        email: user.email,
        phone: user.phone,
        first_name: user.first_name,
        created_at: user.created_at
      }
    });

  } catch (error) {
    logger.error('Registration API error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again later.'
    });
  }
});

/**
 * Check if email or phone is already registered
 * POST /api/auth/check
 * Body: { email?, phone? }
 */
router.post('/check', async (req, res) => {
  try {
    const { email, phone } = req.body;
    let user = null;

    if (email) {
      user = await database.getUserByEmail(email);
    } else if (phone) {
      user = await database.getUserByPhone(phone);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Email or phone is required'
      });
    }

    res.json({
      success: true,
      registered: !!user,
      user: user ? {
        email: user.email,
        phone: user.phone,
        first_name: user.first_name,
        created_at: user.created_at
      } : null
    });

  } catch (error) {
    logger.error('Check user API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check user status'
    });
  }
});

/**
 * Check if email is already registered
 * GET /api/auth/check-email/:email
 */
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const result = await database.query(
      'SELECT telegram_id FROM users WHERE email = $1',
      [email]
    );

    res.json({
      success: true,
      exists: result.rows.length > 0
    });

  } catch (error) {
    logger.error('Check email API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check email'
    });
  }
});

/**
 * Get user stats (public endpoint for profile display)
 * GET /api/auth/stats/:telegram_id
 */
router.get('/stats/:telegram_id', async (req, res) => {
  try {
    const { telegram_id } = req.params;

    const user = await database.getUserByTelegramId(telegram_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const stats = await database.getUserStats(telegram_id);

    res.json({
      success: true,
      user: {
        telegram_id: user.telegram_id,
        first_name: user.telegram_first_name || user.first_name,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        last_login: user.last_login
      },
      stats: {
        total_analyses: parseInt(stats.total_analyses) || 0,
        valid_setups: parseInt(stats.valid_setups) || 0,
        buy_signals: parseInt(stats.buy_signals) || 0,
        sell_signals: parseInt(stats.sell_signals) || 0,
        avg_confidence: parseFloat(stats.avg_confidence) || 0,
        first_analysis: stats.first_analysis,
        last_analysis: stats.last_analysis
      }
    });

  } catch (error) {
    logger.error('Stats API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user stats'
    });
  }
});

/**
 * Health check
 * GET /api/auth/health
 */
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await database.query('SELECT NOW()');
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;
