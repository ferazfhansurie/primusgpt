# PRIMUS GPT API - Vercel Deployment Guide

## Overview
This guide will help you deploy the PRIMUS GPT API (server.js) to Vercel.

**Note:** The Telegram bot (telegramBot.js) **cannot** run on Vercel because:
- Vercel serverless functions have a 10-second timeout
- The bot needs to run continuously with long polling
- The bot needs persistent connections

**Solution:** Run the Telegram bot separately on a VPS, cloud instance, or local server.

## Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm install -g vercel`
3. PostgreSQL database (e.g., Neon, Supabase, or Railway)

## Deployment Steps

### 1. Prepare Environment Variables

You need to set these environment variables in Vercel:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database?ssl=true
TELEGRAM_BOT_TOKEN=your_bot_token_here
OPENAI_API_KEY=your_openai_api_key
TWELVE_DATA_API_KEY=your_twelve_data_api_key
WEB_REGISTRATION_URL=https://primusgpt.com/register
API_PORT=3000
```

### 2. Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository
4. Select `trading-analyzer-api` folder as the root directory
5. Add all environment variables in the "Environment Variables" section
6. Click "Deploy"

#### Option B: Via Vercel CLI

```bash
# Login to Vercel
vercel login

# Navigate to API directory
cd trading-analyzer-api

# Deploy to production
vercel --prod

# Add environment variables (do this for each variable)
vercel env add DATABASE_URL
vercel env add TELEGRAM_BOT_TOKEN
vercel env add OPENAI_API_KEY
vercel env add TWELVE_DATA_API_KEY
vercel env add WEB_REGISTRATION_URL
```

### 3. Update Web App Configuration

After deploying the API, update the web app's environment variables:

**In Vercel Dashboard for primus-web:**
- Add/Update: `VITE_API_URL=https://your-api-url.vercel.app`

**Or locally in `.env`:**
```bash
VITE_API_URL=https://your-api-url.vercel.app
```

Then redeploy the web app:
```bash
cd primus-web
vercel --prod
```

### 4. Running the Telegram Bot

Since the bot cannot run on Vercel, you have these options:

#### Option A: Run on VPS/Cloud Instance (Recommended)

```bash
# SSH into your server
ssh user@your-server.com

# Clone repository
git clone https://github.com/ferazfhansurie/primusgpt.git
cd primusgpt/trading-analyzer-api

# Install dependencies
npm install

# Create .env file with your environment variables
nano .env

# Run bot with PM2 (process manager)
npm install -g pm2
pm2 start src/bot/telegramBot.js --name primus-bot
pm2 save
pm2 startup
```

#### Option B: Run Locally (Development)

```bash
cd trading-analyzer-api
npm run bot
```

#### Option C: Deploy to Railway.app or Render.com

These platforms support long-running processes:

**Railway.app:**
1. Sign up at https://railway.app
2. Create new project from GitHub repo
3. Set root directory to `trading-analyzer-api`
4. Add environment variables
5. Add start command: `npm run bot`

**Render.com:**
1. Sign up at https://render.com
2. Create new "Background Worker"
3. Connect GitHub repo
4. Set root directory to `trading-analyzer-api`
5. Add environment variables
6. Set start command: `npm run bot`

## Vercel Configuration

The `vercel.json` file is already configured:

```json
{
  "version": 2,
  "name": "primus-gpt-api",
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ]
}
```

## Testing Your Deployment

### Test API Endpoints

```bash
# Health check
curl https://your-api-url.vercel.app/api/auth/health

# Expected response:
# {"success":true,"status":"healthy","timestamp":"2025-11-30T..."}

# Test registration
curl -X POST https://your-api-url.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+60123456789",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### Test Web Registration

1. Go to https://primusgpt.com/register
2. Fill in the registration form
3. Check if data is saved to database

### Test Telegram Bot

1. Open your bot in Telegram
2. Send `/start`
3. Check if authentication works

## Troubleshooting

### API Returns 500 Error
- Check Vercel logs: `vercel logs`
- Verify DATABASE_URL is correct
- Check if database is accessible from Vercel's IP

### Bot Not Working
- Make sure bot is running (check with `pm2 status` if using PM2)
- Verify TELEGRAM_BOT_TOKEN is correct
- Check bot logs for errors

### Registration Not Working
- Check if API is deployed correctly
- Verify CORS settings in server.js
- Check browser console for errors

## Environment Variables Checklist

- [ ] DATABASE_URL (PostgreSQL connection string)
- [ ] TELEGRAM_BOT_TOKEN (from @BotFather)
- [ ] OPENAI_API_KEY (for AI analysis)
- [ ] TWELVE_DATA_API_KEY (for market data)
- [ ] WEB_REGISTRATION_URL (your registration page URL)
- [ ] API_PORT (3000 or leave default)

## Links

- Vercel Dashboard: https://vercel.com/dashboard
- Web App: https://primusgpt.com
- API (after deployment): https://your-api-url.vercel.app

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check database connectivity
3. Verify all environment variables are set
4. Contact support if needed
