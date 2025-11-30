import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    
    console.log('✅ Connected to database');
    console.log('📝 Running migration: add-name-columns.sql');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'src', 'db', 'migrations', 'add-name-columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    const result = await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Show the results
    if (result.length > 0 && result[result.length - 1].rows) {
      console.log('\n📊 Current schema:');
      console.table(result[result.length - 1].rows);
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✨ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
