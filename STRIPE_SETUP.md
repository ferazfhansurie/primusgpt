# Stripe Payment Integration Setup Guide

## Overview
This guide explains how to set up and use the Stripe payment integration for PRIMUS GPT registration.

## Features Implemented
- ✅ Stripe Checkout integration for one-time payments
- ✅ Secure payment processing ($10 registration fee)
- ✅ Automatic user registration after successful payment
- ✅ Webhook handler for payment confirmation
- ✅ Payment status tracking in database
- ✅ Success/failure page handling

## Setup Instructions

### 1. Install Dependencies
Dependencies have been installed:
- **Backend**: `stripe` package
- **Frontend**: `@stripe/stripe-js` package

### 2. Environment Variables

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000
VITE_BOT_USERNAME=primusgpt_ai_bot
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

#### Backend (.env)
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Database Migration

Run the migration to add payment columns:

```bash
cd primus-api
psql $DATABASE_URL -f src/db/migrations/add-payment-columns.sql
```

This adds:
- `payment_status` (VARCHAR) - tracks payment state
- `stripe_payment_id` (VARCHAR) - stores Stripe payment intent ID
- `payment_amount` (INTEGER) - amount paid in cents
- `paid_at` (TIMESTAMP) - when payment was completed

### 4. Stripe Webhook Setup

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint**: `https://your-api-domain.com/api/payment/webhook`
3. **Select events to listen to**:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. **Copy the Webhook Secret** and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### 5. Test the Webhook Locally

For local testing, use Stripe CLI:

```bash
# Install Stripe CLI (if not installed)
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/payment/webhook
```

This will give you a webhook secret for testing. Use this in your local `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Payment Flow

### 1. User Registration
1. User visits `/register`
2. Fills in: email, phone, first name, last name
3. Clicks "Proceed to Payment"

### 2. Payment Processing
1. Frontend calls `POST /api/payment/create-checkout-session`
2. Backend validates data and checks for existing users
3. Creates Stripe Checkout Session
4. User redirected to Stripe Checkout page
5. User completes payment with credit card

### 3. Payment Completion
1. Stripe redirects to `/register/success?session_id=xxx`
2. Frontend calls `GET /api/payment/verify-session/:sessionId`
3. Backend verifies payment and creates user account
4. User sees success message and Telegram bot link

### 4. Webhook (Backup)
- Stripe sends webhook to `/api/payment/webhook`
- Backend processes `checkout.session.completed` event
- Creates user if not already created
- Provides redundancy for registration

## API Endpoints

### POST /api/payment/create-checkout-session
Creates a Stripe Checkout Session for registration payment.

**Request:**
```json
{
  "email": "user@example.com",
  "phone": "+60123456789",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/xxxxx"
}
```

### GET /api/payment/verify-session/:sessionId
Verifies payment and completes registration.

**Response:**
```json
{
  "success": true,
  "message": "Registration successful!",
  "user": {
    "email": "user@example.com",
    "phone": "+60123456789",
    "first_name": "John",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/payment/webhook
Handles Stripe webhook events (internal use only).

## Testing

### Test Card Numbers
Use these test cards in Stripe Checkout:

**Success:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Failure:**
- Card: `4000 0000 0000 0002`
- This will simulate a card decline

### Test the Complete Flow

1. **Start both servers:**
```bash
# Terminal 1 - API Server
cd primus-api
npm run dev

# Terminal 2 - Web Server
cd primus-web
npm run dev

# Terminal 3 (optional) - Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/payment/webhook
```

2. **Test registration:**
   - Visit http://localhost:5173/register
   - Fill in test data
   - Use test card: 4242 4242 4242 4242
   - Complete payment
   - Verify redirect to success page
   - Check database for new user entry

3. **Verify database:**
```bash
psql $DATABASE_URL
SELECT email, phone, payment_status, stripe_payment_id FROM users;
```

## Production Deployment

### 1. Update Environment Variables
Replace test keys with live keys from Stripe Dashboard:

**Frontend:**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_API_URL=https://your-production-api.com
```

**Backend:**
```
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (from production webhook)
WEB_URL=https://your-production-web.com
```

### 2. Configure Production Webhook
1. Go to Stripe Dashboard (live mode)
2. Add webhook endpoint: `https://your-api-domain.com/api/payment/webhook`
3. Select same events as test mode
4. Copy webhook secret to production environment

### 3. Test in Production
- Use a real card (will be charged $10)
- Or use Stripe test mode in production for final testing

## Pricing Configuration

To change the registration price, edit `primus-api/src/api/paymentApi.js`:

```javascript
// Price in cents ($10.00 = 1000 cents)
const REGISTRATION_PRICE = 1000;
```

## Security Considerations

1. ✅ Stripe keys are stored in environment variables
2. ✅ Webhook signature verification implemented
3. ✅ Duplicate registration prevention
4. ✅ Payment verification before account creation
5. ✅ HTTPS required in production (handled by hosting)

## Troubleshooting

### Payment not completing
- Check Stripe Dashboard → Logs for errors
- Verify webhook secret is correct
- Check API server logs for errors

### Duplicate registrations
- System checks for existing email/phone before creating session
- Webhook handler checks for existing user before creating

### User not created after payment
- Check webhook is configured correctly
- Verify webhook secret in environment
- Check API server logs for webhook events
- Use `/api/payment/verify-session/:sessionId` as backup

## Support

For issues or questions:
1. Check Stripe Dashboard → Logs
2. Check API server logs
3. Verify environment variables
4. Test webhook with Stripe CLI

## Next Steps

1. ✅ Test locally with test cards
2. ⏳ Set up production webhook
3. ⏳ Deploy to production
4. ⏳ Test with real card (small amount)
5. ⏳ Update marketing materials with pricing
6. ⏳ Monitor Stripe Dashboard for payments
