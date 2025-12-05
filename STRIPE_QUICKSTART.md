# Quick Start Guide - Stripe Payment Integration

## ✅ What's Been Implemented

1. **Stripe Checkout Integration** - Users pay $10 to register
2. **Payment API Endpoints** - Create checkout, verify payment, webhook handler
3. **Updated Registration Flow** - Payment required before account creation
4. **Database Schema** - Payment tracking columns added
5. **Success Page** - Redirect after payment completion

## 🚀 Quick Start (Local Testing)

### 1. Run Database Migration
```bash
cd primus-api
chmod +x migrate-payment.sh
./migrate-payment.sh
```

Or manually:
```bash
psql $DATABASE_URL -f src/db/migrations/add-payment-columns.sql
```

### 2. Start the Servers

**Terminal 1 - API Server:**
```bash
cd primus-api
npm run dev
```

**Terminal 2 - Web Server:**
```bash
cd primus-web
npm run dev
```

**Terminal 3 - Stripe Webhook (Optional for local testing):**
```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```
Copy the webhook secret and update `primus-api/.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 3. Test the Payment Flow

1. Go to http://localhost:5173/register
2. Fill in the form:
   - Email: test@example.com
   - Phone: +60123456789
   - First Name: Test
   - Last Name: User
3. Click "Proceed to Payment"
4. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
5. Complete payment
6. You'll be redirected to success page
7. Check database: User should be created with `payment_status = 'paid'`

## 🔑 Stripe Keys (Test Mode)

Already configured in `.env` files:

**Publishable Key (Frontend):**
```
pk_test_51SYCn0BXs32c86pTO6qxOBhJK2h62JQj3SEA7xHBlLWepJh6IPUH47l4aNdSgJvycsoJgXPb5AIgF0514nYHWfNr00vGdtkwqk
```

**Secret Key (Backend):**
```
sk_test_your_stripe_secret_key_here
```

## 📝 Test Cards

**Successful Payment:**
- `4242 4242 4242 4242` - Visa
- `5555 5555 5555 4444` - Mastercard

**Declined Payment:**
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

## 🔍 Verify Everything Works

### Check Database
```bash
psql $DATABASE_URL
SELECT email, phone, first_name, payment_status, stripe_payment_id FROM users ORDER BY created_at DESC LIMIT 5;
```

### Check Stripe Dashboard
1. Go to https://dashboard.stripe.com/test/payments
2. You should see your test payments
3. Check the metadata for user information

## 📂 Files Changed

### New Files Created:
- `primus-api/src/api/paymentApi.js` - Payment endpoints
- `primus-api/src/db/migrations/add-payment-columns.sql` - DB migration
- `primus-web/src/components/RegisterWithPayment.tsx` - New registration with payment
- `primus-web/src/components/RegisterSuccess.tsx` - Success page after payment
- `primus-api/migrate-payment.sh` - Migration script
- `STRIPE_SETUP.md` - Detailed setup guide

### Modified Files:
- `primus-api/src/server.js` - Added payment routes
- `primus-api/.env` - Added Stripe keys
- `primus-web/.env` - Added Stripe publishable key
- `primus-web/src/App.tsx` - Added payment routes
- `primus-web/src/components/Register.css` - Added payment styles

## 🎯 Next Steps for Production

1. **Set up Production Webhook:**
   - Go to Stripe Dashboard (live mode)
   - Add webhook: `https://your-api-domain.com/api/payment/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook secret

2. **Update Environment Variables (Production):**
   ```bash
   # Frontend
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   VITE_API_URL=https://your-api-domain.com
   
   # Backend
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx (from production webhook)
   WEB_URL=https://your-web-domain.com
   ```

3. **Test with Real Card:**
   - Start with a small amount if possible (for testing)
   - Or continue using test mode in production initially

4. **Monitor:**
   - Watch Stripe Dashboard for payments
   - Check API logs for any errors
   - Verify users are being created correctly

## 💰 Changing the Price

Edit `primus-api/src/api/paymentApi.js`:
```javascript
// Change this value (amount in cents)
const REGISTRATION_PRICE = 1000; // $10.00 USD
```

## 🐛 Troubleshooting

**Problem: Payment succeeds but user not created**
- Check webhook is configured
- Verify webhook secret is correct
- Check API logs for errors

**Problem: Stripe Checkout not loading**
- Verify publishable key is correct
- Check browser console for errors
- Ensure API is running

**Problem: Webhook not receiving events**
- Use `stripe listen` for local testing
- Check webhook secret matches
- Verify endpoint URL is correct

## 📞 Support Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Test Cards:** https://stripe.com/docs/testing
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Setup Guide:** See `STRIPE_SETUP.md` for detailed documentation

## ✨ Features

- ✅ Secure payment with Stripe
- ✅ One-time $10 payment for lifetime access
- ✅ Automatic user creation after payment
- ✅ Duplicate registration prevention
- ✅ Payment verification before access
- ✅ Webhook backup for reliability
- ✅ Test mode for development
- ✅ Success/failure handling
