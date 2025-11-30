# Authentication Flow - Email/Phone Based

## Overview

The authentication system now uses **email and phone number** as primary identifiers instead of Telegram username. This provides a more secure and flexible authentication approach.

## Registration Flow

### 1. Web Registration (Required First Step)
Users must register on the website first at `https://primusgpt.com/register`

**Required Fields:**
- ✅ Email (unique)
- ✅ Phone (unique, with country code)
- ✅ First Name
- ⚪ Last Name (optional)

**No longer required:**
- ❌ Telegram Username

### 2. Telegram Account Linking
After web registration, users need to contact support to link their Telegram account with their registered email/phone.

**Process:**
1. User registers on website with email/phone
2. Admin manually updates the `telegram_id` in the database for that user
3. User can then use `/start` in the Telegram bot to login

## Database Schema Changes

### Users Table
- `email` - UNIQUE, NOT NULL (primary identifier)
- `phone` - UNIQUE, NOT NULL (primary identifier)
- `telegram_username` - Optional (for reference only)
- `telegram_id` - Links to Telegram account (set after linking)
- `first_name` - Optional (populated from web or Telegram)
- `telegram_first_name` - Auto-populated from Telegram

## API Endpoints

### POST /api/auth/register
Register a new user with email and phone.

**Request Body:**
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
  "message": "Registration successful!",
  "user": {
    "email": "user@example.com",
    "phone": "+60123456789",
    "first_name": "John",
    "created_at": "2025-11-30T10:00:00.000Z"
  }
}
```

### POST /api/auth/check
Check if email or phone is already registered.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```
or
```json
{
  "phone": "+60123456789"
}
```

## Manual Telegram Linking (Admin Task)

To link a registered user's Telegram account:

```sql
-- Find user by email
SELECT id, email, phone, telegram_id FROM users WHERE email = 'user@example.com';

-- Update telegram_id (get this from the user)
UPDATE users 
SET telegram_id = 123456789, 
    telegram_username = 'username',  -- optional
    telegram_first_name = 'John',    -- optional
    updated_at = CURRENT_TIMESTAMP 
WHERE email = 'user@example.com';
```

## Bot Commands

### /start
- Checks if user is authenticated (has session)
- If not, checks if user exists in database (has telegram_id)
- If user doesn't exist, prompts to register on website

### /profile
Shows user profile including:
- Name (from Telegram or web registration)
- Email
- Phone number
- Statistics

### /logout
Logs out user and clears session.

## Migration from Username-based Auth

If you have existing users with username-based authentication:

1. Users with `telegram_username` but no `email/phone`:
   - Keep existing `telegram_id` 
   - Prompt users to add email/phone through support

2. Update schema with migration:
   ```bash
   psql $DATABASE_URL < src/db/schema.sql
   ```

## Security Benefits

1. **No Username Required**: Users don't need to create a Telegram username
2. **Email Verification**: Can add email verification in future
3. **Phone Verification**: Can add SMS verification in future
4. **Multiple Auth Factors**: Email AND phone both required
5. **Admin Control**: Manual linking prevents unauthorized access

## Future Enhancements

- [ ] Email verification during registration
- [ ] SMS OTP for phone verification
- [ ] Automatic Telegram linking with verification code
- [ ] Password-based web login
- [ ] Two-factor authentication
