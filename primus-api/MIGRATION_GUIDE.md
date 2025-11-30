# Database Migration: Add Name Columns

## Problem
The `users` table is missing the `first_name` and `last_name` columns, causing registration errors.

## Solution
Run the following SQL commands on your production database.

### Option 1: Using Railway/Vercel Dashboard

1. Go to your database dashboard (Railway, Supabase, etc.)
2. Open the SQL query console
3. Run these commands:

```sql
-- Add first_name column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);

-- Add last_name column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Verify the columns were added
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('first_name', 'last_name')
ORDER BY column_name;
```

### Option 2: Using Node.js Script

1. Make sure your `DATABASE_URL` environment variable is set
2. Run the migration script:

```bash
cd trading-analyzer-api
node run-migration.js
```

### Option 3: Using psql CLI

```bash
psql $DATABASE_URL -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);"
psql $DATABASE_URL -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);"
```

## Verification

After running the migration, verify it worked by checking if you can register a new user through the web form.

## Rollback (if needed)

If something goes wrong, you can remove the columns:

```sql
ALTER TABLE users DROP COLUMN IF EXISTS first_name;
ALTER TABLE users DROP COLUMN IF EXISTS last_name;
```

## Notes

- The columns are nullable, so existing users won't be affected
- The web registration form requires these fields
- The Telegram bot can still function without these columns (it uses telegram_first_name and telegram_last_name)
