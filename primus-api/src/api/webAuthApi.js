import express from 'express';
import crypto from 'crypto';
import database from '../db/database.js';
import logger from '../utils/logger.js';

const router = express.Router();

// In-memory session store (in production, use Redis or database)
const webSessions = new Map();
const SESSION_DURATION_HOURS = 24;

/**
 * Generate a secure session token
 */
function generateToken() {
  return crypto.randomBytes(48).toString('hex');
}

/**
 * Web Login - authenticate with email and phone
 * POST /api/web-auth/login
 * Body: { email, phone }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Email and phone are required'
      });
    }

    // Find user by email
    const user = await database.getUserByEmail(email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Account not found. Please register first.'
      });
    }

    // Verify phone matches
    const cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
    const userPhone = (user.phone || '').replace(/[\s\-()]/g, '');

    if (!userPhone || !cleanPhone.endsWith(userPhone.slice(-8))) {
      return res.status(401).json({
        success: false,
        error: 'Phone number does not match'
      });
    }

    // Check subscription status
    const subscriptionStatus = getSubscriptionStatus(user);

    if (subscriptionStatus.type === 'expired') {
      return res.status(403).json({
        success: false,
        error: 'Subscription expired',
        needsRenewal: true,
        subscriptionStatus
      });
    }

    // Generate session token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

    // Store session
    webSessions.set(token, {
      userId: user.id,
      email: user.email,
      expiresAt
    });

    // Update last login
    await database.updateLastLogin(user.telegram_id || user.id);

    logger.success(`Web login successful: ${email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      subscriptionStatus
    });

  } catch (error) {
    logger.error('Web login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

/**
 * Validate session token
 * GET /api/web-auth/validate
 * Header: Authorization: Bearer <token>
 */
router.get('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const session = webSessions.get(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    if (new Date() > session.expiresAt) {
      webSessions.delete(token);
      return res.status(401).json({
        success: false,
        error: 'Session expired'
      });
    }

    // Get fresh user data
    const user = await database.getUserByEmail(session.email);
    if (!user) {
      webSessions.delete(token);
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const subscriptionStatus = getSubscriptionStatus(user);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      subscriptionStatus
    });

  } catch (error) {
    logger.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed'
    });
  }
});

/**
 * Logout - invalidate session
 * POST /api/web-auth/logout
 * Header: Authorization: Bearer <token>
 */
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    webSessions.delete(token);
  }

  res.json({ success: true });
});

/**
 * Middleware to require authentication
 */
export async function requireWebAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.split(' ')[1];
    const session = webSessions.get(token);

    if (!session || new Date() > session.expiresAt) {
      if (session) webSessions.delete(token);
      return res.status(401).json({
        success: false,
        error: 'Session expired'
      });
    }

    // Get user
    const user = await database.getUserByEmail(session.email);
    if (!user) {
      webSessions.delete(token);
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check subscription
    const subscriptionStatus = getSubscriptionStatus(user);
    if (subscriptionStatus.type === 'expired') {
      return res.status(403).json({
        success: false,
        error: 'Subscription expired',
        needsRenewal: true,
        subscriptionStatus
      });
    }

    // Attach user to request
    req.user = user;
    req.subscriptionStatus = subscriptionStatus;
    next();

  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Get subscription status for a user
 */
function getSubscriptionStatus(user) {
  const now = new Date();

  // Check trial period first
  if (user.trial_end) {
    const trialEnd = new Date(user.trial_end);
    if (trialEnd > now) {
      const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      return {
        type: 'trial',
        daysLeft,
        endDate: trialEnd.toISOString(),
        plan: user.subscription_plan || 'Premium'
      };
    }
  }

  // Check subscription
  if (user.subscription_end) {
    const subEnd = new Date(user.subscription_end);
    const daysLeft = Math.ceil((subEnd - now) / (1000 * 60 * 60 * 24));

    if (daysLeft > 0) {
      return {
        type: 'subscription',
        daysLeft,
        endDate: subEnd.toISOString(),
        plan: user.subscription_plan || 'Premium',
        expiringSoon: daysLeft <= 7
      };
    }
  }

  // Expired
  return {
    type: 'expired',
    message: 'Subscription expired. Please renew to continue.'
  };
}

export default router;
