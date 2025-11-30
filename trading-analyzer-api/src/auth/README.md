# Authentication System

This directory contains the authentication and user management system for the PRIMUS GPT Telegram bot.

## Overview

The authentication system provides:
- User registration and login via Telegram
- Session management (users stay logged in for 30 days)
- User profile tracking
- Analysis history logging
- Security tracking (login attempts)

## Components

### `authService.js`
Main authentication service that handles:
- User login/registration
- Session token generation
- Authentication checks
- Email/phone validation
- User profile retrieval

### Database Tables

#### `users`
Stores user account information:
- `telegram_id` - Unique Telegram user ID
- `telegram_username` - Telegram username
- `telegram_first_name`, `telegram_last_name` - User's name
- `email`, `phone` - Contact information
- `is_active` - Account status
- `created_at` - Registration date
- `last_login` - Last login timestamp

#### `user_sessions`
Manages user sessions:
- `telegram_id` - User identifier
- `session_token` - Unique session token
- `expires_at` - Session expiration date (30 days)
- `last_activity` - Last activity timestamp

#### `analysis_history`
Logs all trading analyses:
- `telegram_id` - User who requested analysis
- `pair` - Trading pair analyzed
- `strategy` - Strategy used (swing/scalping)
- `market_category` - Market type (forex/gold)
- `signal` - Buy/sell signal
- `confidence` - AI confidence score
- `is_valid` - Setup validity
- `trend`, `pattern` - Market conditions
- `zone_low`, `zone_high` - Price zones

#### `login_attempts`
Tracks authentication events:
- `telegram_id` - User attempting login
- `success` - Login success/failure
- `attempt_type` - Type of attempt (login/registration/logout)
- `created_at` - Timestamp

## User Flow

### First-Time User
1. User sends `/start` command
2. Bot checks if user is authenticated (no session found)
3. Bot creates user account in database
4. Bot requests email address
5. User provides email
6. Bot requests phone number
7. User provides phone
8. Registration complete - session created
9. User can now access all features

### Returning User
1. User sends `/start` command
2. Bot checks session (valid session found)
3. User immediately proceeds to market selection
4. No login required

### Session Expiry
- Sessions last 30 days from last activity
- After expiry, user must re-authenticate
- User data is preserved, only needs to re-verify

## Commands

- `/start` - Login or register
- `/profile` - View profile and statistics
- `/logout` - End current session

## Security Features

1. **Session Tokens**: SHA-256 hashed tokens for secure sessions
2. **Session Expiry**: Automatic expiry after 30 days
3. **Login Tracking**: All login attempts are logged
4. **Email/Phone Validation**: Input validation for contact info
5. **SSL/TLS**: Secure database connections

## Usage Example

```javascript
import authService from './auth/authService.js';

// Initialize
await authService.initialize();

// Login user
const result = await authService.loginUser(telegramId, {
  username: 'john_doe',
  first_name: 'John',
  last_name: 'Doe'
});

// Check authentication
const isAuth = await authService.isAuthenticated(telegramId);

// Get user profile
const profile = await authService.getUserProfile(telegramId);

// Logout
await authService.logoutUser(telegramId);
```

## Database Configuration

Add to your `.env` file:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

## Statistics Tracked

For each user:
- Total number of analyses
- Number of valid setups
- Buy vs sell signal distribution
- Average confidence score
- First and last analysis dates
- Member since date
- Last login date

## Future Enhancements

Potential improvements:
- Email verification
- Phone number verification via SMS
- Two-factor authentication
- Password-based authentication option
- Export analysis history
- Custom alerts/notifications
- Premium user tiers
