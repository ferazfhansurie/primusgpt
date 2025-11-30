# Quick Update Guide for Existing Vercel Deployment

## Update Web App (primusgpt-ai on Vercel)

### 1. Update Environment Variables

Go to: https://vercel.com/juta-softwares-projects/primusgpt-ai/settings/environment-variables

Add/Update these variables:
```
VITE_API_URL = https://your-api-domain.vercel.app
VITE_BOT_USERNAME = primusgpt_ai_bot
```

### 2. Redeploy Web App

**Option A: Auto-deploy (Recommended)**
- Just push to your GitHub repo
- Vercel will auto-deploy

**Option B: Manual deploy**
```bash
cd primus-web
git add .
git commit -m "Update to email/phone authentication"
git push

# Or use Vercel CLI
vercel --prod
```

---

## Deploy API Server (New)

### 1. Create New Vercel Project for API

**Via Vercel Dashboard:**

1. Go to https://vercel.com/new
2. Import your Git repository
3. **Important:** Set "Root Directory" to `trading-analyzer-api`
4. Project Name: `primus-gpt-api` (or your choice)
5. Framework Preset: Other
6. Click "Deploy"

### 2. Add Environment Variables to API Project

Go to your new API project → Settings → Environment Variables

Add these (get values from your .env file):
```
DATABASE_URL = postgresql://user:password@host/db?ssl=true
TELEGRAM_BOT_TOKEN = your_bot_token
OPENAI_API_KEY = your_openai_key
TWELVE_DATA_API_KEY = your_twelve_data_key
WEB_REGISTRATION_URL = https://primusgpt.com/register
API_PORT = 3000
```

### 3. Get Your API URL

After deployment, you'll get a URL like:
```
https://primus-gpt-api.vercel.app
```

### 4. Update Web App with New API URL

Go back to your web app project:
https://vercel.com/juta-softwares-projects/primusgpt-ai/settings/environment-variables

Update:
```
VITE_API_URL = https://primus-gpt-api.vercel.app
```

Then redeploy the web app (it will auto-redeploy on next git push).

---

## Deploy Telegram Bot (Cannot Run on Vercel)

### Option 1: Railway.app (Easiest for Bots)

1. Sign up at https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Click "Add variables" and add all environment variables
5. In settings, set:
   - Root Directory: `trading-analyzer-api`
   - Start Command: `npm run bot`
6. Deploy!

### Option 2: Render.com

1. Sign up at https://render.com
2. New → "Background Worker"
3. Connect your GitHub repo
4. Settings:
   - Root Directory: `trading-analyzer-api`
   - Build Command: `npm install`
   - Start Command: `npm run bot`
5. Add environment variables
6. Deploy!

### Option 3: VPS (Most Reliable)

```bash
# SSH into your server
ssh user@your-server.com

# Install Node.js if not installed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/ferazfhansurie/primusgpt.git
cd primusgpt/trading-analyzer-api

# Install dependencies
npm install

# Install PM2 for process management
sudo npm install -g pm2

# Create .env file
nano .env
# Paste your environment variables and save (Ctrl+X, Y, Enter)

# Start bot
pm2 start src/bot/telegramBot.js --name primus-bot

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the instructions printed

# Check status
pm2 status
pm2 logs primus-bot
```

---

## Testing Everything

### 1. Test API
```bash
curl https://primus-gpt-api.vercel.app/api/auth/health
```

Should return:
```json
{"success":true,"status":"healthy","timestamp":"..."}
```

### 2. Test Web Registration
- Go to https://primusgpt.com/register
- Fill in email, phone, first name
- Submit
- Should show success message

### 3. Test Telegram Bot
- Open your bot in Telegram
- Send `/start`
- Should prompt you to register if not registered
- After admin links your telegram_id, you should be able to login

---

## Admin Task: Link User Telegram Account

After a user registers on the web, you need to manually link their Telegram account:

### Method 1: Using Database GUI (e.g., TablePlus, pgAdmin)

1. User gives you their Telegram ID (they can get it from @userinfobot)
2. Find the user in the database:
   ```sql
   SELECT * FROM users WHERE email = 'user@example.com';
   ```
3. Update their telegram_id:
   ```sql
   UPDATE users 
   SET telegram_id = 123456789 
   WHERE email = 'user@example.com';
   ```

### Method 2: Create Admin Endpoint (Future Enhancement)

You could create an admin API endpoint to do this automatically.

---

## Quick Commands Summary

```bash
# Deploy web app
cd primus-web
vercel --prod

# Deploy API
cd trading-analyzer-api
vercel --prod

# Run bot locally
cd trading-analyzer-api
npm run bot

# Check Vercel logs
vercel logs

# Check PM2 status (if using VPS)
pm2 status
pm2 logs primus-bot
```

---

## Troubleshooting

### Web app can't connect to API
- ✅ Check VITE_API_URL is set correctly
- ✅ Check CORS settings in server.js
- ✅ Verify API is deployed and running

### Bot not responding
- ✅ Check bot is running (Railway, Render, or VPS)
- ✅ Verify TELEGRAM_BOT_TOKEN is correct
- ✅ Check bot logs for errors

### Registration fails
- ✅ Check DATABASE_URL is correct
- ✅ Verify database schema is up to date
- ✅ Check API logs in Vercel dashboard

### User can't login to bot
- ✅ Verify user is registered in database
- ✅ Check if telegram_id is linked to user
- ✅ Have user try `/start` again

---

## Files Changed

### New Files:
- `trading-analyzer-api/vercel.json` - Vercel configuration for API
- `trading-analyzer-api/VERCEL_DEPLOYMENT.md` - Detailed deployment guide
- `trading-analyzer-api/AUTHENTICATION_FLOW.md` - New auth flow documentation
- `primus-web/.env.example` - Updated with API_URL

### Modified Files:
- `trading-analyzer-api/src/db/schema.sql` - Made first_name optional, removed username requirement
- `trading-analyzer-api/src/api/authApi.js` - Email/phone based registration
- `trading-analyzer-api/src/db/database.js` - Added getUserByEmail, getUserByPhone
- `trading-analyzer-api/src/bot/telegramBot.js` - Updated login to check telegram_id instead of username
- `primus-web/src/components/Register.tsx` - Removed username field

---

## Need Help?

- Check logs: `vercel logs` or `pm2 logs`
- Read full guide: `VERCEL_DEPLOYMENT.md`
- Check authentication flow: `AUTHENTICATION_FLOW.md`
