#!/usr/bin/env node

/**
 * Run Conversation Features Migration
 * 
 * This script runs the database migration to add AI conversation features.
 * Run with: node run-conversation-migration.js
 */

import database from './src/db/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    logger.info('🚀 Starting conversation features migration...');

    // Connect to database
    await database.connect();
    logger.success('✓ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'src/db/migrations/add-conversation-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    logger.info('✓ Loaded migration file');

    // Run migration
    await database.query(migrationSQL);
    logger.success('✓ Migration executed successfully');

    // Verify tables exist
    const tableCheck = await database.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'conversations', 
        'conversation_sessions', 
        'analysis_references', 
        'ai_guidelines',
        'admin_users',
        'admin_sessions'
      )
      ORDER BY table_name;
    `);

    logger.info('\n📊 Tables created:');
    tableCheck.rows.forEach(row => {
      logger.success(`  ✓ ${row.table_name}`);
    });

    // Check seed data
    const guidelineCount = await database.query('SELECT COUNT(*) FROM ai_guidelines');
    logger.info(`\n📝 Seed data: ${guidelineCount.rows[0].count} AI guidelines loaded`);

    logger.success('\n🎉 Migration completed successfully!');
    logger.info('\nNext steps:');
    logger.info('1. Start the bot: node src/bot/telegramBot.js');
    logger.info('2. Test AI features: Send a text message to your bot');
    logger.info('3. See QUICK_START_AI_FEATURES.md for testing guide');

    await database.close();
    process.exit(0);

  } catch (error) {
    logger.error('❌ Migration failed:', error);
    logger.error('\nTroubleshooting:');
    logger.error('1. Check DATABASE_URL environment variable');
    logger.error('2. Verify database connection');
    logger.error('3. Check PostgreSQL version (requires JSONB support)');
    
    await database.close();
    process.exit(1);
  }
}

// Run migration
runMigration();
