# Quick Setup: Username-Based Authentication

## 🎯 What Changed

The system now uses **Telegram Username** instead of Telegram ID for registration:

- ✅ Users register on website with their **@username**
- ✅ Bot automatically links username to telegram_id on first login
- ✅ More user-friendly (no need to find telegram_id)

## 🚀 Quick Start

### 1. Run Database Migration

```bash
cd c:/Repositories/primus/trading-analyzer-api
node migrate-to-username.js
```

### 2. Update Environment Variables

Make sure your `.env` has:

```env
DATABASE_URL=postgresql://neondb_owner:npg_5XWomFw2Nsyd@ep-delicate-hill-a126awws-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
WEB_REGISTRATION_URL=http://localhost:5173/register
TELEGRAM_BOT_TOKEN=your_bot_token
```

### 3. Start Services

**Terminal 1 - API Server:**
```bash
cd c:/Repositories/primus/trading-analyzer-api
npm run server
```

**Terminal 2 - Telegram Bot:**
```bash
cd c:/Repositories/primus/trading-analyzer-api
npm run bot
```

**Terminal 3 - Web (primus-web):**
```bash
cd c:/Repositories/primus/primus-web
npm run dev
```

## 📝 User Flow

### Registration (Web)

1. User visits `http://localhost:5173/register`
2. Enters their Telegram username (e.g., `@johndoe` or `johndoe`)
3. Enters email, phone, and name
4. Clicks "Register"
5. Account created (telegram_id is null initially)

### Login (Telegram Bot)

1. User must have a Telegram username set
2. Opens bot and sends `/start`
3. Bot reads username from Telegram user object
4. Bot finds user in database by username
5. Bot updates telegram_id field with chat_id
6. User is logged in!

## 🔑 Key Features

- **Username Validation**: Bot checks if user has set a username
- **Auto-Linking**: telegram_id is automatically filled on first bot interaction
- **Duplicate Prevention**: Both username and email are checked for duplicates
- **Session Management**: 30-day persistent sessions
- **Full Tracking**: Login attempts, analysis history, user stats

## 📊 Database Schema

```sql
users table:
- telegram_id BIGINT (nullable, filled on first bot login)
- telegram_username VARCHAR(255) UNIQUE NOT NULL
- email VARCHAR(255) UNIQUE
- phone VARCHAR(50)
- telegram_first_name, telegram_last_name
- created_at, last_login, updated_at
```

## 🌐 API Endpoints

- `POST /api/auth/register` - Register with username
- `GET /api/auth/check/:telegram_username` - Check if username registered
- `GET /api/auth/check-email/:email` - Check email availability
- `GET /api/auth/stats/:telegram_id` - Get user statistics
- `GET /api/auth/health` - API health check

## 🎨 Web Registration

The registration form is at:
- **Component**: `primus-web/src/components/Register.tsx`
- **Route**: `/register`
- **URL**: `http://localhost:5173/register`

Features:
- Real-time username availability check
- Email and phone validation
- Responsive design
- Success screen with next steps

## ⚠️ Troubleshooting

### "Username Required" Error

User needs to set a Telegram username:
1. Open Telegram Settings
2. Tap profile
3. Tap "Username"
4. Create username
5. Try again

### "Account Not Found" Error

User needs to register on website first:
1. Visit registration page
2. Register with Telegram username
3. Return to bot and use /start

### Username Already Registered

User already has an account - direct them to login via bot.

## 📱 Bot Commands

- `/start` - Login (checks username and creates session)
- `/profile` - View profile and statistics
- `/logout` - End current session

## 🎉 Benefits

1. **Easier for Users**: No need to find telegram_id
2. **More Intuitive**: Everyone knows their @username
3. **Auto-Linking**: telegram_id populated automatically
4. **Flexible**: Works with or without @ symbol
5. **Validated**: Bot ensures user has username before allowing login

## 📖 Full Documentation

See `WEB_REGISTRATION_GUIDE.md` for complete details.
