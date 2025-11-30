# Web Registration Integration Guide

## Overview

The authentication system uses **Telegram Username** for registration:

- **Registration**: Done via the web interface at `primus-web` using Telegram username
- **Login**: Done via Telegram bot after registration (bot auto-links the username to telegram_id)

## Architecture

```
User Journey:
1. User visits website → Registers with Telegram username, email, phone
2. Backend creates user account in Neon database (telegram_id is null initially)
3. User opens Telegram bot → Sends /start
4. Bot reads username from Telegram → Finds user in database by username
5. Bot updates telegram_id field → Creates session
6. User can now use all bot features
```

## Backend Setup (trading-analyzer-api)

### 1. Install Dependencies

```bash
cd trading-analyzer-api
npm install express cors pg
```

### 2. Run Migration

Add to `.env`:

```env
# Database
DATABASE_URL=postgresql://your_connection_string

# API Server
API_PORT=3000
WEB_URL=http://localhost:5173
WEB_REGISTRATION_URL=http://localhost:5173/register

# Bot
TELEGRAM_BOT_TOKEN=your_bot_token
```

### 4. Start the API Server
# Database
DATABASE_URL=postgresql://your_connection_string

# API Server
API_PORT=3000
WEB_URL=http://localhost:5173
WEB_REGISTRATION_URL=http://localhost:5173/register

# Bot
TELEGRAM_BOT_TOKEN=your_bot_token
```

### 3. Start the API Server

```bash
npm run server
```

The API server will run on port 3000 and provide these endpoints:

#### Registration Endpoint
```
POST /api/auth/register
Body: {
  telegram_username: string (required) - with or without @
  email: string (required)
  phone: string (required)
  first_name: string (required)
  last_name: string (optional)
}
```

#### Check Registration Status
```
GET /api/auth/check/:telegram_username
Response: { success: true, registered: boolean, user: {...} }
```

#### Check Email Availability
```
GET /api/auth/check-email/:email
Response: { success: true, exists: boolean }
```

#### Get User Stats
```
GET /api/auth/stats/:telegram_id
Response: { success: true, user: {...}, stats: {...} }
```

#### Health Check
```
GET /api/auth/health
Response: { success: true, status: "healthy" }
```

### 4. Start the Bot

In a separate terminal:

```bash
npm run bot
```

## Frontend Setup (primus-web)

### 1. Copy Registration Components

Copy these files to your `primus-web/src` directory:

```
trading-analyzer-api/web-components/
├── Register.tsx → primus-web/src/components/Register.tsx
└── Register.css → primus-web/src/components/Register.css
```

### 2. Configure Environment

Create or update `primus-web/.env.local`:

```env
VITE_API_URL=http://localhost:3000
VITE_BOT_USERNAME=your_bot_username
```

### 3. Add Route

Update your router in `primus-web/src/App.tsx`:

```tsx
import Register from './components/Register';

// In your routes:
<Route path="/register" element={<Register />} />
```

### 4. Install Dependencies (if needed)

```bash
cd primus-web
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

## User Registration Flow
## User Registration Flow

### Step 1: Get Telegram Username

Users need to have a Telegram username:

1. Open Telegram
2. Go to Settings
3. Username appears under your name
4. If you don't have one, tap "Username" to create it

### Step 2: Register on Website

1. Visit `http://localhost:5173/register`
2. Enter Telegram username (with or without @)
3. Click "Check" to verify availability
4. Fill in email, phone, and name
5. Submit registration

### Step 3: Login via Telegram

1. Open Telegram
2. Search for your bot
3. Send `/start`
4. Bot reads your username and finds your account
5. Bot links your telegram_id to your account
6. You're logged in and can access all features
## Bot Commands

- `/start` - Login (requires web registration)
- `/profile` - View profile and statistics
- `/logout` - End current session

## API Response Examples

### Successful Registration

```json
{
  "success": true,
  "message": "Registration successful! You can now login via Telegram bot.",
  "user": {
    "telegram_username": "johndoe",
    "email": "user@example.com",
    "first_name": "John",
    "created_at": "2025-11-30T10:30:00.000Z"
  }
}
```

### User Already Exists

```json
{
  "success": false,
  "error": "User already registered with this Telegram username"
}
```

### Email Already Used

```json
{
  "success": false,
  "error": "Email already registered"
}
```

## Testing

### 1. Test API Server

```bash
curl http://localhost:3000/api/auth/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-11-30T10:30:00.000Z"
}
```

### 2. Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_username": "johndoe",
    "email": "test@example.com",
    "phone": "+60123456789",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### 3. Test Bot Login

1. Register a user via API or web
2. Make sure the user has a Telegram username set
3. Open Telegram and send `/start` to bot
4. Bot will read your username and link your account
5. Verify you're logged in and can access features

### users
Stores registered user accounts:
- telegram_id (unique, nullable initially)
- telegram_username (unique, NOT NULL)
- email (unique)
- phone
- telegram_first_name, telegram_last_name
- is_active
- created_at, last_login, updated_atname, telegram_last_name
- is_active
- created_at, last_login, updated_at

### user_sessions
Manages active sessions:
- telegram_id (unique)
- session_token
- expires_at (30 days)
- last_activity

### analysis_history
Logs all trading analyses:
- user_id, telegram_id
- pair, strategy, market_category
- signal, confidence, is_valid
- trend, pattern, zones
- created_at

### login_attempts
Security tracking:
- telegram_id
- success
- attempt_type (web_registration, login, logout, etc.)
- created_at

## Security Features

1. **Email Validation**: RFC 5322 compliant
2. **Phone Validation**: International format with country code
3. **Duplicate Prevention**: Checks both Telegram ID and email
4. **Session Management**: 30-day sessions with automatic expiry
5. **Login Tracking**: All attempts logged for security
6. **CORS Protection**: Configured for specific domains
7. **SSL/TLS**: Secure database connections

## Production Deployment

### Backend (API + Bot)

1. Deploy to VPS or cloud service (e.g., Railway, Render, DigitalOcean)
2. Set environment variables
3. Run both services:
   ```bash
   npm run server  # API server
   npm run bot     # Telegram bot
   ```
4. Use PM2 for process management:
   ```bash
   pm2 start npm --name "primus-api" -- run server
   pm2 start npm --name "primus-bot" -- run bot
   ```

### Frontend (Web)

1. Update `.env.local` with production API URL:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   VITE_BOT_USERNAME=your_bot_username
   ```
2. Build and deploy:
   ```bash
   npm run build
   ```
3. Deploy to Vercel, Netlify, or similar

### Environment Variables for Production

```env
# Backend
DATABASE_URL=postgresql://production_url
API_PORT=3000
WEB_URL=https://yourdomain.com
WEB_REGISTRATION_URL=https://yourdomain.com/register
TELEGRAM_BOT_TOKEN=your_production_bot_token

# Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_BOT_USERNAME=your_bot_username
```
### Issue: "User already registered"

**Solution**: User already has an account. Direct them to login via Telegram bot.

### Issue: "Telegram username not found"

**Solution**: User needs to register on the website first with their Telegram username before using the bot.

### Issue: "Username Required" on bot

**Solution**: User doesn't have a Telegram username set. They need to:
1. Open Telegram Settings
2. Tap on their profile
3. Tap "Username"
4. Create a username
5. Register on website with that username
6. Try /start again on bot
### Issue: "Telegram ID not found"

**Solution**: User needs to register on the website first before using the bot.

### Issue: CORS error

**Solution**: 
1. Verify `WEB_URL` in backend `.env`
2. Check API server logs
3. Ensure frontend is using correct API_URL

### Issue: Database connection failed

**Solution**:
1. Verify DATABASE_URL is correct
2. Check if Neon database is active
3. Verify SSL settings in connection string

## Support

- Backend API: `src/server.js`, `src/api/authApi.js`
- Authentication Service: `src/auth/authService.js`
- Database Manager: `src/db/database.js`
- Telegram Bot: `src/bot/telegramBot.js`
- Frontend Component: `web-components/Register.tsx`
