import Stripe from 'stripe';
import express from 'express';
import database from '../db/database.js';
import logger from '../utils/logger.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 2990, // $29.90 in cents
    interval: 'month',
    interval_count: 1,
  },
  quarterly: {
    id: 'quarterly',
    name: 'Quarterly Plan',
    price: 8070, // $80.70 in cents
    interval: 'month',
    interval_count: 3,
  },
  '6-months': {
    id: '6-months',
    name: '6-Months Plan',
    price: 15250, // $152.50 in cents
    interval: 'month',
    interval_count: 6,
  },
  annual: {
    id: 'annual',
    name: 'Annual Plan',
    price: 28700, // $287.00 in cents
    interval: 'year',
    interval_count: 1,
  },
};

/**
 * Create a Stripe Checkout Session for subscription
 * POST /api/payment/create-checkout-session
 * Body: { email, phone, first_name, last_name, plan_id }
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { email, phone, first_name, last_name, plan_id = 'quarterly' } = req.body;

    // Validate required fields
    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Email and phone are required'
      });
    }

    // Validate plan
    const plan = SUBSCRIPTION_PLANS[plan_id];
    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
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

    // Create Stripe Checkout Session with subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `PRIMUS GPT - ${plan.name}`,
              description: 'AI-powered trading analysis with real-time signals',
            },
            unit_amount: plan.price,
            recurring: {
              interval: plan.interval,
              interval_count: plan.interval_count,
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          email,
          phone,
          first_name: first_name || '',
          last_name: last_name || '',
          plan_id: plan.id,
        },
      },
      success_url: `${process.env.WEB_URL}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.WEB_URL}/register?canceled=true`,
      customer_email: email,
      metadata: {
        email,
        phone,
        first_name: first_name || '',
        last_name: last_name || '',
        plan_id: plan.id,
      },
    });

    logger.info(`Stripe checkout session created for ${email} - ${plan.name}`);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    logger.error('Stripe checkout session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
});

/**
 * Verify payment and complete registration
 * GET /api/payment/verify-session/:sessionId
 */
router.get('/verify-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    // For subscriptions, check if subscription is active or trialing
    const isValidSubscription = session.subscription && 
      (session.subscription.status === 'active' || session.subscription.status === 'trialing');

    if (!isValidSubscription && session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed or subscription not active'
      });
    }

    const { email, phone, first_name, last_name, plan_id } = session.metadata;

    // Check if user already exists (prevent duplicate registration)
    const existingUser = await database.getUserByEmail(email);
    if (existingUser) {
      return res.json({
        success: true,
        message: 'User already registered',
        user: {
          email: existingUser.email,
          phone: existingUser.phone,
          first_name: existingUser.first_name,
        }
      });
    }

    // Create user in database
    const query = `
      INSERT INTO users (
        email,
        phone,
        first_name,
        last_name,
        payment_status,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_plan,
        subscription_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const result = await database.query(query, [
      email,
      phone,
      first_name || null,
      last_name || null,
      'active',
      session.customer,
      session.subscription?.id || null,
      plan_id || 'quarterly',
      session.subscription?.status || 'active'
    ]);

    const user = result.rows[0];

    // Log successful registration
    await database.query(
      'INSERT INTO login_attempts (telegram_id, success, attempt_type) VALUES ($1, $2, $3)',
      [0, true, 'web_registration_subscription']
    );

    logger.success(`New subscriber registered: ${email} (${phone}) - Plan: ${plan_id}`);

    res.json({
      success: true,
      message: 'Registration successful!',
      user: {
        email: user.email,
        phone: user.phone,
        first_name: user.first_name,
        plan: plan_id,
        trial_end: session.subscription?.trial_end ? new Date(session.subscription.trial_end * 1000) : null,
        created_at: user.created_at
      }
    });

  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
});

/**
 * Stripe Webhook Handler
 * POST /api/payment/webhook
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { email, phone, first_name, last_name, plan_id } = session.metadata;

      try {
        // Check if user already exists
        const existingUser = await database.getUserByEmail(email);
        if (!existingUser) {
          // Retrieve subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          
          // Create user in database
          const query = `
            INSERT INTO users (
              email,
              phone,
              first_name,
              last_name,
              payment_status,
              stripe_customer_id,
              stripe_subscription_id,
              subscription_plan,
              subscription_status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
          `;

          await database.query(query, [
            email,
            phone,
            first_name || null,
            last_name || null,
            'active',
            session.customer,
            subscription.id,
            plan_id || 'quarterly',
            subscription.status
          ]);

          logger.success(`User auto-registered via webhook: ${email} - Plan: ${plan_id}`);
        }
      } catch (error) {
        logger.error('Webhook user creation error:', error);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      try {
        // Update subscription status in database
        await database.query(
          'UPDATE users SET subscription_status = $1 WHERE stripe_subscription_id = $2',
          [subscription.status, subscription.id]
        );
        logger.info(`Subscription updated: ${subscription.id} - Status: ${subscription.status}`);
      } catch (error) {
        logger.error('Webhook subscription update error:', error);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      try {
        // Mark subscription as canceled
        await database.query(
          'UPDATE users SET subscription_status = $1, payment_status = $2 WHERE stripe_subscription_id = $3',
          ['canceled', 'inactive', subscription.id]
        );
        logger.info(`Subscription canceled: ${subscription.id}`);
      } catch (error) {
        logger.error('Webhook subscription cancelation error:', error);
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      logger.info(`Invoice payment succeeded: ${invoice.id}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      try {
        // Mark payment as failed
        await database.query(
          'UPDATE users SET payment_status = $1 WHERE stripe_customer_id = $2',
          ['payment_failed', invoice.customer]
        );
        logger.error(`Invoice payment failed: ${invoice.id}`);
      } catch (error) {
        logger.error('Webhook payment failed update error:', error);
      }
      break;
    }

    default:
      logger.info(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
