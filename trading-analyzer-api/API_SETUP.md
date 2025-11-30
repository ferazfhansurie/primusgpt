# PRIMUS GPT API Setup

This API server provides authentication and registration services for the PRIMUS GPT Telegram bot.

## Overview

The API has two main components:
1. **Web Registration API** (`/api/auth/*`) - Allows users to register via the website
2. **Telegram Bot** (`src/bot/telegramBot.js`) - Handles user interactions on Telegram

## Architecture

```
User Registration Flow:
1. User fills out form on website (primus-web)
2. Website calls POST /api/auth/register
3. User record created with telegram_username (no telegram_id yet)
4. User clicks "Open Telegram Bot"
5. User sends /start to bot
6. Bot checks username against database
7. Bot links telegram_id to user record
8. User can now use bot features
```

## Quick Start

### Prerequisites

1. Node.js 18+
2. PostgreSQL database (get one free at https://console.prisma.io)
3. Required API keys:
   - Telegram Bot Token (from @BotFather)
   - TwelveData API key (for market data)
   - OpenAI API key (for AI analysis)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
BOT_TOKEN=your_bot_token_here  # Alternative name for compatibility

# Web Registration
WEB_REGISTRATION_URL=https://primusgpt.com/register
WEB_URL=https://primusgpt.com

# API Server
API_PORT=3000

# Trading APIs
TWELVE_DATA_API_KEY=your_twelvedata_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Running the Services

**Development:**

```bash
# Start API server (for web registration)
npm run dev

# In another terminal, start the Telegram bot
npm run bot
```

**Production:**

```bash
# Start API server
npm start

# In another terminal or process manager, start the bot
npm run bot
```

## API Endpoints

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "telegram_username": "johndoe",
  "email": "john@example.com",
  "phone": "+60123456789",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful! You can now login via Telegram bot.",
  "user": {
    "telegram_username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "created_at": "2025-11-30T10:30:00.000Z"
  }
}
```

**Error Response (409):**
```json
{
  "success": false,
  "error": "User already registered with this Telegram username"
}
```

### GET /api/auth/check/:telegram_username

Check if a username is already registered.

**Success Response:**
```json
{
  "success": true,
  "registered": true,
  "user": {
    "telegram_username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "created_at": "2025-11-30T10:30:00.000Z"
  }
}
```

### GET /api/auth/health

Health check endpoint.

**Success Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-11-30T10:30:00.000Z"
}
```

## Telegram Bot Commands

- `/start` - Login or register with the bot
- `/profile` - View your profile and statistics
- `/logout` - End your session

## Database Schema

The API uses PostgreSQL with the following main tables:

- `users` - User accounts (linked by telegram_username, then telegram_id)
- `user_sessions` - Active user sessions
- `analysis_history` - Trading analysis records
- `login_attempts` - Login/registration audit log

See `src/db/schema.sql` for the complete schema.

## Deployment

### API Server

Deploy to any Node.js hosting platform:
- Vercel (serverless)
- Heroku
- Railway
- DigitalOcean
- AWS

**Environment variables must be set in your hosting platform.**

### Telegram Bot

The bot needs to run continuously:
- Use a process manager like PM2
- Deploy to a VPS or container service
- Use a service like Railway or Render

**Note:** The bot cannot be serverless as it uses polling.

## Development Scripts

```bash
npm run dev          # Start API server with auto-reload
npm run bot          # Start Telegram bot
npm run analyze      # Run trading analysis (testing)
npm test             # Run tests
```

## Troubleshooting

### "User not found" error on /start

**Cause:** User hasn't registered via website yet.

**Solution:** Direct user to register at your website first.

### "Username Required" error

**Cause:** Telegram user doesn't have a username set.

**Solution:** User needs to set a Telegram username in Settings.

### Database connection errors

**Cause:** Invalid DATABASE_URL or database not accessible.

**Solution:** Check your connection string and firewall rules.

### CORS errors from website

**Cause:** API_URL not matching in primus-web .env

**Solution:** Ensure VITE_API_URL in primus-web matches your API server URL.

## Security Notes

1. **Never commit .env files** - Add to .gitignore
2. **Use HTTPS in production** - Especially for API endpoints
3. **Rate limiting** - Consider adding rate limiting for production
4. **Database backups** - Regular backups recommended
5. **API key rotation** - Rotate keys periodically

## Support

For issues or questions:
1. Check the logs: bot logs user actions and API errors
2. Review the authentication flow in `BOT_FLOW.md`
3. Check database connectivity with health endpoint
