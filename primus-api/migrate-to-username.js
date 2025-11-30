#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import database from './src/db/database.js';
import logger from './src/utils/logger.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

/**
 * Migration script to update database schema for username-based authentication
 * This script:
 * 1. Makes telegram_username UNIQUE and NOT NULL
 * 2. Makes telegram_id nullable (will be filled on first bot login)
 * 3. Adds index on telegram_username
 */

async function migrate() {
  try {
    logger.info('Starting migration to username-based authentication...');

    await database.connect();

    // Step 1: Add unique constraint to telegram_username if not exists
    logger.info('Adding unique constraint to telegram_username...');
    await database.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'users_telegram_username_key'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_telegram_username_key UNIQUE (telegram_username);
        END IF;
      END $$;
    `);

    // Step 2: Make telegram_id nullable (if it's not already)
    logger.info('Making telegram_id nullable...');
    await database.query(`
      ALTER TABLE users ALTER COLUMN telegram_id DROP NOT NULL;
    `);

    // Step 3: Add index on telegram_username if not exists
    logger.info('Adding index on telegram_username...');
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_users_telegram_username ON users(telegram_username);
    `);

    // Step 4: Verify migration
    logger.info('Verifying migration...');
    const result = await database.query(`
      SELECT 
        column_name, 
        is_nullable, 
        data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN ('telegram_id', 'telegram_username');
    `);

    logger.info('Column info after migration:');
    result.rows.forEach(row => {
      logger.info(`  ${row.column_name}: ${row.data_type}, nullable: ${row.is_nullable}`);
    });

    logger.success('✅ Migration completed successfully!');
    logger.info('\nNext steps:');
    logger.info('1. Users can now register with their Telegram username');
    logger.info('2. telegram_id will be populated when they first login via bot');
    logger.info('3. Update your registration form to collect Telegram username');

  } catch (error) {
    logger.error('Migration failed:', error);
    logger.error('Please check your database connection and try again.');
    process.exit(1);
  } finally {
    await database.close();
  }
}

migrate();
