# Setup Guide - Authentication System

## Quick Start

### 1. Install Dependencies

The PostgreSQL client has already been installed. Verify with:

```bash
npm list pg
```

### 2. Configure Environment Variables

Copy the database URL to your `.env` file:

```bash
# If .env doesn't exist, create it from the example
cp .env.example .env
```

Then add or update the `DATABASE_URL` in your `.env`:

```env
DATABASE_URL=postgresql://neondb_owner:npg_5XWomFw2Nsyd@ep-delicate-hill-a126awws-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 3. Initialize Database Schema

The database schema is automatically initialized when the bot starts. The schema includes:
- Users table
- Sessions table
- Analysis history table
- Login attempts table

### 4. Start the Bot

```bash
npm run bot
```

The authentication system will:
- Connect to Neon database
- Create all necessary tables
- Initialize the auth service
- Start accepting user registrations

## User Experience

### First-Time Users

1. User sends `/start` to the bot
2. Bot creates their account automatically
3. Bot asks for email address
4. User provides email
5. Bot asks for phone number
6. User provides phone number
7. Registration complete! User can now use all features

### Returning Users

1. User sends `/start` to the bot
2. Bot recognizes their session (30-day validity)
3. User immediately proceeds to market selection
4. No re-login needed!

## Testing the System

### Test New User Registration

1. Open Telegram and find your bot
2. Send `/start`
3. Provide email when prompted
4. Provide phone number when prompted
5. Verify you can access the market selection

### Test Returning User

1. Close and reopen Telegram
2. Send `/start` again
3. Verify you're immediately taken to market selection (no login prompt)

### Test User Profile

1. Send `/profile` command
2. Verify you see:
   - Your name and contact info
   - Total analyses count
   - Valid setups count
   - Buy/sell signal distribution
   - Average confidence score
   - Member since date
   - Last login date

### Test Logout

1. Send `/logout` command
2. Send `/start` again
3. Verify you need to re-authenticate

## Database Verification

### Check if tables were created

You can verify the tables in your Neon dashboard:
1. Go to https://console.neon.tech/
2. Select your project
3. Go to SQL Editor
4. Run:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check users
SELECT * FROM users LIMIT 5;

-- Check sessions
SELECT * FROM user_sessions LIMIT 5;

-- Check analysis history
SELECT * FROM analysis_history LIMIT 5;
```

## Troubleshooting

### Issue: "DATABASE_URL environment variable is not set"

**Solution**: Ensure `.env` file exists in the root directory with the DATABASE_URL variable.

### Issue: Database connection timeout

**Solution**: 
1. Check if your Neon database is active (free tier databases may go to sleep)
2. Verify the connection string is correct
3. Check your internet connection
4. Verify SSL settings in connection string

### Issue: User registration fails

**Solution**:
1. Check database logs for errors
2. Verify all tables are created correctly
3. Check if email/phone validation is passing

### Issue: Session not persisting

**Solution**:
1. Check `user_sessions` table for the user's telegram_id
2. Verify `expires_at` timestamp is in the future
3. Check for any database connection issues

## Database Management

### View User Statistics

```sql
-- Total registered users
SELECT COUNT(*) FROM users;

-- Active users (logged in within last 30 days)
SELECT COUNT(*) FROM users 
WHERE last_login > NOW() - INTERVAL '30 days';

-- Total analyses performed
SELECT COUNT(*) FROM analysis_history;

-- Most active users
SELECT 
  u.telegram_username,
  COUNT(a.id) as analysis_count
FROM users u
LEFT JOIN analysis_history a ON u.telegram_id = a.telegram_id
GROUP BY u.telegram_id, u.telegram_username
ORDER BY analysis_count DESC
LIMIT 10;
```

### Cleanup Old Sessions

```sql
-- Delete expired sessions
DELETE FROM user_sessions 
WHERE expires_at < NOW();
```

### Export User Data

```sql
-- Export all user data
SELECT 
  u.*,
  COUNT(a.id) as total_analyses
FROM users u
LEFT JOIN analysis_history a ON u.telegram_id = a.telegram_id
GROUP BY u.id;
```

## Security Best Practices

1. **Keep DATABASE_URL Secret**: Never commit `.env` to version control
2. **Monitor Login Attempts**: Regularly check `login_attempts` table for suspicious activity
3. **Session Expiry**: Current setting is 30 days - adjust in `authService.js` if needed
4. **Database Backups**: Enable automatic backups in Neon dashboard
5. **SSL Connections**: Always use `sslmode=require` in connection string

## Performance Optimization

1. **Connection Pooling**: Currently set to max 20 connections
2. **Indexes**: Database includes indexes on frequently queried columns
3. **Query Optimization**: All queries use parameterized statements
4. **Session Cleanup**: Consider periodic cleanup of expired sessions

## Monitoring

### Key Metrics to Track

1. **User Growth**: New registrations per day
2. **Active Users**: Daily/weekly/monthly active users
3. **Analysis Volume**: Analyses performed per user
4. **Session Duration**: Average session length
5. **Login Success Rate**: Successful vs failed attempts

### Useful Queries

```sql
-- Daily new users
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_users
FROM users
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;

-- Daily analysis volume
SELECT 
  DATE(created_at) as date,
  COUNT(*) as analyses
FROM analysis_history
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;

-- Popular trading pairs
SELECT 
  pair,
  COUNT(*) as count
FROM analysis_history
GROUP BY pair
ORDER BY count DESC;
```

## Next Steps

After setup is complete:

1. ✅ Test the authentication flow with a test user
2. ✅ Monitor the database for any errors
3. ✅ Set up regular database backups
4. ✅ Consider adding email verification (future enhancement)
5. ✅ Monitor user growth and engagement metrics

## Support

For issues or questions:
1. Check the logs in the terminal
2. Verify database connection in Neon dashboard
3. Review the authentication flow in `src/bot/telegramBot.js`
4. Check `src/auth/authService.js` for authentication logic
