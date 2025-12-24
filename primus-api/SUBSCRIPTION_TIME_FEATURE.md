# Subscription Time Display Feature

This update adds subscription/trial time remaining information to the welcome message in the Telegram bot, along with renewal/subscribe buttons.

## Changes Made

### 1. Database Schema Updates

Added two new columns to the `users` table:
- `trial_end` (TIMESTAMP): When the trial period ends
- `subscription_end` (TIMESTAMP): When the paid subscription ends

**Migration file**: `src/db/migrations/add-payment-columns.sql`

### 2. Bot Welcome Message Updates

The bot now displays subscription information when users login via:
- `/start` command (already authenticated)
- `/start` command (new login)
- `/login` command (phone number)
- Auto-login on any message

**Display format**:
- Trial users: `🎁 Trial: X day(s) remaining`
- Subscribed users: `✅ Quarterly: X day(s) remaining`
- Active (no end date): `✅ Subscription: Active`
- Expired: `⚠️ Subscription: Expired`

### 3. Renewal/Subscribe Buttons

Buttons are automatically shown based on subscription status:
- **Subscribe Now**: Shown when subscription is expired or missing
- **Renew Subscription**: Shown when less than 7 days remaining
- Links to: `WEB_REGISTRATION_URL` environment variable

### 4. Payment API Updates

Updated to properly set subscription dates:
- `POST /api/payment/verify-payment`: Sets trial_end and subscription_end on registration
- `POST /api/payment/webhook`: Updates dates on subscription changes

## Running the Migration

For existing deployments, run the migration script once:

```bash
cd primus-api
node update-subscription-schema.js
```

This will:
1. Add the new columns if they don't exist
2. Set default dates for existing users based on their plan
3. Handle trialing, monthly, quarterly, and yearly plans

## New Helper Functions

Added to `telegramBot.js`:

### `getSubscriptionTimeRemaining(user)`
Calculates and formats subscription time remaining.

**Returns**:
```javascript
{
  type: 'trial' | 'subscription' | 'active' | 'expired',
  daysLeft: number,
  endDate: Date,
  message: string,
  needsRenewal: boolean
}
```

### `getSubscriptionKeyboard(subscriptionInfo)`
Builds inline keyboard with renewal/subscribe buttons based on subscription status.

## Testing

1. **New User Registration**:
   - Register via web → Login via Telegram
   - Should see trial/subscription time remaining
   - Should see subscribe button if expired

2. **Existing Users**:
   - Run migration script first
   - Login via `/start`
   - Should see subscription info

3. **Renewal Flow**:
   - When < 7 days remaining, should see "Renew Subscription" button
   - Button should link to registration page

## Environment Variables

Make sure `WEB_REGISTRATION_URL` is set in `.env`:
```env
WEB_REGISTRATION_URL=https://primusgpt-ai.vercel.app/register
```

## Future Enhancements

Potential improvements:
- Send notification when subscription is about to expire (3 days, 1 day)
- Add `/subscription` command to check status anytime
- Show usage stats (analyses used this period)
- Grace period after expiration before blocking access
