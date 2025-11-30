# Quick Start Guide - AI Bot Features

## 🚀 Get Started in 3 Steps

### Step 1: Run Database Migration

```bash
cd primus-api

# Option A: Using psql command line
psql $DATABASE_URL -f src/db/migrations/add-conversation-tables.sql

# Option B: Using Node.js
# Create a file: run-conversation-migration.js
import database from './src/db/database.js';
import fs from 'fs';

const migrationSQL = fs.readFileSync('./src/db/migrations/add-conversation-tables.sql', 'utf8');
await database.query(migrationSQL);
console.log('✅ Migration complete!');
await database.close();

# Then run:
node run-conversation-migration.js
```

### Step 2: Verify Migration

```bash
psql $DATABASE_URL

# Check tables exist:
\dt

# Should see new tables:
# - conversations
# - conversation_sessions
# - analysis_references
# - ai_guidelines
# - admin_users
# - admin_sessions

# Check seed data:
SELECT * FROM ai_guidelines;
# Should see 6 default guidelines

\q
```

### Step 3: Start the Bot

```bash
cd primus-api
node src/bot/telegramBot.js

# Should see:
# ✓ Database connected successfully
# ✓ Database schema initialized
# ✓ AI Responder: OpenAI API key is valid
# ✓ Telegram bot started (API version). Waiting for commands...
```

---

## 🧪 Testing the AI Features

### Test 1: Basic Conversation
1. Open Telegram and find your bot
2. Type: **"hello"**
3. Bot responds with AI greeting
4. ✅ AI text responses working!

### Test 2: Analysis + Question
1. Click `/start`
2. Click through buttons to get an analysis (existing flow)
3. After bot sends analysis, type: **"what's the stop loss?"**
4. Bot responds with specific details from that analysis
5. ✅ Context awareness working!

### Test 3: Button Guidance
1. Click `/start`
2. Bot shows Forex/Gold buttons
3. Type: **"I want to analyze gold"**
4. Bot explains which buttons to click
5. ✅ State awareness working!

### Test 4: Trading Questions
1. Type: **"how do I know if a setup is valid?"**
2. Bot explains validation criteria
3. ✅ Guidelines system working!

---

## 🔍 Verify in Database

```sql
-- Check conversations are being saved
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 10;

-- Check analysis references
SELECT * FROM analysis_references ORDER BY created_at DESC LIMIT 5;

-- Check session states
SELECT * FROM conversation_sessions;

-- Check guidelines
SELECT guideline_key, guideline_type, is_active FROM ai_guidelines;
```

---

## 🐛 Common Issues & Fixes

### Issue: "Table does not exist" error
**Fix:** Migration didn't run. Go back to Step 1.

### Issue: AI not responding to text messages
**Fix:** 
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Verify in code
node -e "import('openai').then(async ({default: OpenAI}) => { const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY}); await openai.models.list(); console.log('✅ API key valid'); })"
```

### Issue: Bot says "had trouble understanding"
**Fix:** This is the fallback. Check logs for actual error:
```bash
# In telegramBot.js logs, look for:
# "AI response failed:" followed by error details
```

### Issue: Context not working (AI doesn't know last analysis)
**Fix:** Check analysis_references table:
```sql
SELECT * FROM analysis_references WHERE telegram_id = YOUR_CHAT_ID;
```
If empty, analysis isn't being saved. Check `telegramBot.js` analysis logging section.

---

## 📊 Monitor Usage

### Check Conversation Activity
```sql
-- Messages per user
SELECT telegram_id, COUNT(*) as message_count 
FROM conversations 
GROUP BY telegram_id 
ORDER BY message_count DESC;

-- Recent activity
SELECT message_type, content, created_at 
FROM conversations 
WHERE telegram_id = YOUR_CHAT_ID 
ORDER BY created_at DESC 
LIMIT 20;
```

### Check AI Guideline Usage
```sql
-- Active guidelines
SELECT guideline_key, guideline_type, priority 
FROM ai_guidelines 
WHERE is_active = true 
ORDER BY priority;
```

---

## ⚙️ Customize AI Behavior

### Change System Prompt
```sql
UPDATE ai_guidelines 
SET content = 'Your custom personality here...'
WHERE guideline_key = 'system_prompt';
```

### Add New Guideline
```sql
INSERT INTO ai_guidelines (guideline_key, guideline_type, content, is_active, priority)
VALUES ('custom_rule', 'behavior', 'Never discuss politics or religion', true, 10);
```

### Disable Guideline
```sql
UPDATE ai_guidelines 
SET is_active = false 
WHERE guideline_key = 'greeting';
```

---

## 📈 What's Next?

Once everything is working:

1. **Generate Stickers** (Optional)
   - See `stickers/README.md` for prompts
   - Use tools like Lottie, Rive, or Canva Pro
   - Add to `stickers/` folder

2. **Build Admin Dashboard** (Phase 3)
   - View all conversations
   - Edit AI guidelines via UI
   - User management
   - Analytics

3. **Deploy**
   - Push to Railway/Heroku
   - Run migration on production DB
   - Monitor OpenAI costs

---

## 💡 Pro Tips

1. **Cache Busting**: If guidelines aren't updating, restart bot (cache is 5 minutes)

2. **Test Locally First**: Always test on local database before production

3. **Backup Database**: Before migration, backup your data:
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

4. **Monitor Costs**: Set up OpenAI usage alerts at platform.openai.com

5. **Rate Limiting**: Consider adding rate limits if users spam messages

---

## 🆘 Need Help?

Check these files:
- `IMPLEMENTATION_PHASE_1-2_COMPLETE.md` - Full implementation details
- `INTELLIGENT_BOT_UPGRADE_PLAN.md` - Overall architecture
- `src/conversation/README.md` - Module documentation
- Bot logs - Look for logger.info and logger.error messages

---

**You're all set! Enjoy your intelligent trading bot! 🎉**
