# Stripe Subscription Integration - Complete Setup

## ✅ Subscription Plans Implemented

Based on your pricing structure:

| Plan | Price | Per Month | Discount | Billing |
|------|-------|-----------|----------|---------|
| **Monthly** | $29.90 | - | - | Every month |
| **Quarterly** ⭐ | $80.70 | $26.90/mo | 10% off | Every 3 months |
| **6-Months** | $152.50 | $25.40/mo | 15% off | Every 6 months |
| **Annual** | $287.00 | $23.90/mo | 20% off | Every year |

## 🎁 Free Trial

- **7-day free trial** included with all plans
- No charge during trial period
- Full access to all features during trial
- Can cancel anytime during trial at no cost
- Payment starts automatically after trial ends

## 🚀 Quick Setup Steps

### 1. Run Database Migration

```bash
cd primus-api
psql $DATABASE_URL -f src/db/migrations/add-payment-columns.sql
```

This adds:
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Stripe subscription ID
- `subscription_plan` - Plan type (monthly/quarterly/6-months/annual)
- `subscription_status` - Status (active/trialing/canceled/past_due)
- `payment_status` - Payment status (active/inactive/payment_failed)

### 2. Start Servers

```bash
# Terminal 1 - API
cd primus-api && npm run dev

# Terminal 2 - Web
cd primus-web && npm run dev

# Terminal 3 (optional) - Stripe webhook testing
stripe listen --forward-to localhost:3000/api/payment/webhook
```

### 3. Test Registration Flow

1. Visit: http://localhost:5173/register
2. Select a plan (Quarterly is pre-selected)
3. Fill in registration details
4. Click "Start 7-Day Free Trial"
5. Enter test card: `4242 4242 4242 4242`
6. Complete checkout
7. Redirected to success page
8. Access Telegram bot immediately

## 💳 Payment Flow

### User Journey:
1. User selects subscription plan
2. Enters personal information
3. Redirected to Stripe Checkout
4. Enters payment details
5. **7-day free trial begins immediately**
6. Full bot access during trial
7. After 7 days, first payment processes automatically
8. Recurring billing continues based on plan

### What Users See:
- **Trial Period**: "Start 7-Day Free Trial (Then $80.70)"
- **During Trial**: Full access, no charges
- **After Trial**: Automatic billing starts
- **Can Cancel**: Anytime, even during trial

## 📊 Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create user account with trial |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Mark as canceled |
| `invoice.payment_succeeded` | Log successful payment |
| `invoice.payment_failed` | Mark payment as failed |

## 🗄️ Database Schema

New columns in `users` table:

```sql
stripe_customer_id VARCHAR(255)      -- Stripe customer ID
stripe_subscription_id VARCHAR(255)  -- Stripe subscription ID
subscription_plan VARCHAR(50)        -- monthly/quarterly/6-months/annual
subscription_status VARCHAR(50)      -- active/trialing/canceled/past_due
payment_status VARCHAR(20)           -- active/inactive/payment_failed
```

## 🔧 Configuration

### API Configuration (`primus-api/src/api/paymentApi.js`)

Plans are configured in the code:

```javascript
const SUBSCRIPTION_PLANS = {
  monthly: {
    price: 2990, // $29.90 in cents
    interval: 'month',
    interval_count: 1,
  },
  quarterly: {
    price: 8070, // $80.70 in cents
    interval: 'month',
    interval_count: 3,
  },
  '6-months': {
    price: 15250, // $152.50 in cents
    interval: 'month',
    interval_count: 6,
  },
  annual: {
    price: 28700, // $287.00 in cents
    interval: 'year',
    interval_count: 1,
  },
};
```

### Frontend Configuration (`primus-web/src/components/RegisterWithPayment.tsx`)

Plan display configuration matches backend.

## 🎨 UI Features

- ✅ Plan selection cards with visual feedback
- ✅ "Most Popular" badge on Quarterly plan
- ✅ Discount percentages displayed
- ✅ Per-month price breakdown shown
- ✅ Trial information clearly visible
- ✅ Selected plan highlighted
- ✅ Responsive design for mobile

## 🧪 Testing

### Test Cards (Stripe Test Mode)

**Successful Payment:**
```
Card: 4242 4242 4242 4242
Exp: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Test Scenarios:**

1. **Successful Subscription**
   - Card: 4242 4242 4242 4242
   - Result: Trial starts, subscription active

2. **Card Declined**
   - Card: 4000 0000 0000 0002
   - Result: Payment fails, registration blocked

3. **Insufficient Funds**
   - Card: 4000 0000 0000 9995
   - Result: Payment fails

### Verify in Database

```sql
SELECT 
  email, 
  subscription_plan, 
  subscription_status, 
  payment_status,
  stripe_subscription_id
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

## 📈 Stripe Dashboard Monitoring

Check these sections:

1. **Customers** - View all registered users
2. **Subscriptions** - Monitor active subscriptions
3. **Payments** - Track all payments
4. **Billing** - View upcoming charges

## 🔄 Subscription Management

### Trial Period
- Users get 7 days free trial
- Full access to bot during trial
- No payment required upfront
- Can cancel anytime during trial

### After Trial
- Automatic billing begins
- Charges based on selected plan
- Email receipts sent automatically
- Users can cancel anytime

### Cancellation
- Cancel via Stripe customer portal (can be added)
- Or contact support
- Access continues until period end
- No refunds for partial periods (configurable)

## 🚀 Production Deployment

### 1. Set up Stripe Webhook (Production)

1. Go to Stripe Dashboard (live mode)
2. Developers → Webhooks
3. Add endpoint: `https://your-api.com/api/payment/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook secret

### 2. Update Environment Variables

**Frontend (`primus-web/.env`):**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_API_URL=https://your-api-domain.com
```

**Backend (`primus-api/.env`):**
```bash
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
WEB_URL=https://your-web-domain.com
```

### 3. Test in Production

- Use test mode first
- Verify webhooks working
- Test full registration flow
- Check database updates correctly
- Monitor first few subscriptions

## 💰 Changing Prices

To update prices, edit `primus-api/src/api/paymentApi.js`:

```javascript
const SUBSCRIPTION_PLANS = {
  monthly: {
    price: 2990, // Change this (in cents)
    // ...
  },
  // ...
};
```

Also update frontend display in `RegisterWithPayment.tsx`:

```javascript
const plans = [
  {
    id: 'monthly',
    price: '29.90', // Change this
    // ...
  },
  // ...
];
```

## 📋 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/payment/create-checkout-session` | Create subscription checkout |
| GET | `/api/payment/verify-session/:sessionId` | Verify subscription created |
| POST | `/api/payment/webhook` | Handle Stripe webhook events |

### Create Checkout Session

```javascript
POST /api/payment/create-checkout-session
{
  "email": "user@example.com",
  "phone": "+60123456789",
  "first_name": "John",
  "last_name": "Doe",
  "plan_id": "quarterly" // monthly, quarterly, 6-months, annual
}
```

Response:
```javascript
{
  "success": true,
  "sessionId": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/xxxxx"
}
```

## ✨ Key Features

- ✅ 7-day free trial on all plans
- ✅ 4 subscription tiers
- ✅ Automatic recurring billing
- ✅ Secure Stripe integration
- ✅ No upfront payment required
- ✅ Cancel anytime
- ✅ Plan selection UI
- ✅ Subscription status tracking
- ✅ Failed payment handling
- ✅ Webhook backup system

## 🎯 User Benefits

1. **Try Before You Buy** - 7 days free
2. **Flexible Plans** - Choose what fits
3. **Save Money** - Discounts on longer plans
4. **Easy Cancellation** - No commitments
5. **Secure Payments** - Stripe protected
6. **Instant Access** - Immediate bot access

## 📞 Support & Troubleshooting

### Common Issues:

**Problem: Webhook not receiving events**
- Solution: Use `stripe listen` for local testing
- Verify webhook secret matches

**Problem: Subscription shows but user can't access bot**
- Check `subscription_status` is 'active' or 'trialing'
- Verify webhook processed successfully

**Problem: Trial not working**
- Confirm `trial_period_days: 7` in checkout session
- Check Stripe Dashboard for trial dates

## 📚 Documentation Files

- `STRIPE_SETUP.md` - Original one-time payment setup
- `STRIPE_QUICKSTART.md` - Quick start guide
- `PAYMENT_IMPLEMENTATION.md` - Implementation summary
- **This file** - Subscription-specific guide

## 🎉 You're Ready!

Your subscription system is complete with:
- 7-day free trial
- 4 pricing tiers
- Recurring billing
- Beautiful UI
- Secure payments

Run the migration, start the servers, and test your new subscription system!
