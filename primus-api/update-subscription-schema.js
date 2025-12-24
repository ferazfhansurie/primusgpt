#!/usr/bin/env node

/**
 * Migration script to add trial_end and subscription_end columns
 * Run this once to update the database schema for existing deployments
 */

import dotenv from 'dotenv';
import database from './src/db/database.js';
import logger from './src/utils/logger.js';

dotenv.config();

async function migrateSubscriptionSchema() {
  try {
    logger.info('Starting subscription schema migration...');
    
    // Connect to database
    await database.connect();
    
    // Add trial_end and subscription_end columns if they don't exist
    await database.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP,
      ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP;
    `);
    
    logger.success('Successfully added trial_end and subscription_end columns');
    
    // Set default trial_end for existing users with trialing status
    // (7 days from created_at if they have trialing status)
    await database.query(`
      UPDATE users 
      SET trial_end = created_at + INTERVAL '7 days'
      WHERE subscription_status = 'trialing' 
        AND trial_end IS NULL;
    `);
    
    logger.success('Set default trial_end for existing trialing users');
    
    // Set subscription_end for trialing users based on their plan
    // (After trial, subscription continues for the billing period)
    await database.query(`
      UPDATE users 
      SET subscription_end = CASE 
        WHEN subscription_plan = 'monthly' THEN COALESCE(trial_end, created_at + INTERVAL '7 days') + INTERVAL '1 month'
        WHEN subscription_plan = 'quarterly' THEN COALESCE(trial_end, created_at + INTERVAL '7 days') + INTERVAL '3 months'
        WHEN subscription_plan = 'yearly' THEN COALESCE(trial_end, created_at + INTERVAL '7 days') + INTERVAL '1 year'
        ELSE COALESCE(trial_end, created_at + INTERVAL '7 days') + INTERVAL '3 months'
      END
      WHERE subscription_status = 'trialing' 
        AND subscription_end IS NULL;
    `);
    
    logger.success('Set default subscription_end for existing trialing users');
    
    // Set default subscription_end for existing users with active status
    // (3 months from created_at for quarterly plan)
    await database.query(`
      UPDATE users 
      SET subscription_end = created_at + INTERVAL '3 months'
      WHERE subscription_status = 'active' 
        AND subscription_plan = 'quarterly'
        AND subscription_end IS NULL;
    `);
    
    await database.query(`
      UPDATE users 
      SET subscription_end = created_at + INTERVAL '1 month'
      WHERE subscription_status = 'active' 
        AND subscription_plan = 'monthly'
        AND subscription_end IS NULL;
    `);
    
    await database.query(`
      UPDATE users 
      SET subscription_end = created_at + INTERVAL '1 year'
      WHERE subscription_status = 'active' 
        AND subscription_plan = 'yearly'
        AND subscription_end IS NULL;
    `);
    
    logger.success('Set default subscription_end for existing active users');
    
    logger.success('Migration completed successfully!');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await database.close();
  }
}

// Run migration
migrateSubscriptionSchema()
  .then(() => {
    logger.success('All done!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration error:', error);
    process.exit(1);
  });
