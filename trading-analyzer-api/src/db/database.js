import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

class Database {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
  }

  /**
   * Initialize database connection pool
   */
  async connect() {
    if (this.pool) {
      return this.pool;
    }

    try {
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      logger.success('Database connected successfully');
      return this.pool;
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Initialize database schema
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.connect();

      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Execute schema
      await this.pool.query(schema);

      this.isInitialized = true;
      logger.success('Database schema initialized');
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query(text, params) {
    try {
      const start = Date.now();
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.info(`Query executed in ${duration}ms`);
      return res;
    } catch (error) {
      logger.error('Query failed:', error);
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient() {
    return await this.pool.connect();
  }

  /**
   * Close all connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
      logger.info('Database connections closed');
    }
  }

  /**
   * Create or update a user
   */
  async upsertUser(telegramId, userData = {}) {
    const query = `
      INSERT INTO users (
        telegram_id, 
        telegram_username, 
        telegram_first_name, 
        telegram_last_name,
        email,
        phone,
        last_login
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (telegram_id) 
      DO UPDATE SET
        telegram_username = COALESCE(EXCLUDED.telegram_username, users.telegram_username),
        telegram_first_name = COALESCE(EXCLUDED.telegram_first_name, users.telegram_first_name),
        telegram_last_name = COALESCE(EXCLUDED.telegram_last_name, users.telegram_last_name),
        email = COALESCE(EXCLUDED.email, users.email),
        phone = COALESCE(EXCLUDED.phone, users.phone),
        last_login = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      telegramId,
      userData.username || null,
      userData.first_name || null,
      userData.last_name || null,
      userData.email || null,
      userData.phone || null
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get user by telegram ID
   */
  async getUserByTelegramId(telegramId) {
    const query = 'SELECT * FROM users WHERE telegram_id = $1 AND is_active = true';
    const result = await this.query(query, [telegramId]);
    return result.rows[0] || null;
  }

  /**
   * Get user by telegram username
   */
  async getUserByUsername(username) {
    // Remove @ if present
    const cleanUsername = username.replace('@', '');
    const query = 'SELECT * FROM users WHERE telegram_username = $1 AND is_active = true';
    const result = await this.query(query, [cleanUsername]);
    return result.rows[0] || null;
  }

  /**
   * Update user's telegram_id after first bot interaction
   */
  async updateUserTelegramId(username, telegramId) {
    const cleanUsername = username.replace('@', '');
    const query = `
      UPDATE users 
      SET telegram_id = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE telegram_username = $2
      RETURNING *;
    `;
    const result = await this.query(query, [telegramId, cleanUsername]);
    return result.rows[0];
  }

  /**
   * Update last login time
   */
  async updateLastLogin(telegramId) {
    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE telegram_id = $1
      RETURNING *;
    `;
    const result = await this.query(query, [telegramId]);
    return result.rows[0];
  }

  /**
   * Log an analysis
   */
  async logAnalysis(telegramId, analysisData) {
    const query = `
      INSERT INTO analysis_history (
        telegram_id,
        user_id,
        pair,
        strategy,
        market_category,
        signal,
        confidence,
        is_valid,
        trend,
        pattern,
        zone_low,
        zone_high
      )
      VALUES (
        $1,
        (SELECT id FROM users WHERE telegram_id = $1),
        $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING *;
    `;

    const values = [
      telegramId,
      analysisData.pair,
      analysisData.strategy,
      analysisData.market_category || null,
      analysisData.signal || null,
      analysisData.confidence || null,
      analysisData.is_valid || false,
      analysisData.trend || null,
      analysisData.pattern || null,
      analysisData.zone_low || null,
      analysisData.zone_high || null
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get user's analysis history
   */
  async getUserAnalysisHistory(telegramId, limit = 10) {
    const query = `
      SELECT * FROM analysis_history 
      WHERE telegram_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2;
    `;
    const result = await this.query(query, [telegramId, limit]);
    return result.rows;
  }

  /**
   * Get user statistics
   */
  async getUserStats(telegramId) {
    const query = `
      SELECT 
        COUNT(*) as total_analyses,
        COUNT(CASE WHEN is_valid = true THEN 1 END) as valid_setups,
        COUNT(CASE WHEN signal = 'buy' THEN 1 END) as buy_signals,
        COUNT(CASE WHEN signal = 'sell' THEN 1 END) as sell_signals,
        AVG(confidence) as avg_confidence,
        MIN(created_at) as first_analysis,
        MAX(created_at) as last_analysis
      FROM analysis_history 
      WHERE telegram_id = $1;
    `;
    const result = await this.query(query, [telegramId]);
    return result.rows[0];
  }

  /**
   * Create or update user session
   */
  async createSession(telegramId, sessionToken, expiresInDays = 30) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const query = `
      INSERT INTO user_sessions (telegram_id, session_token, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (telegram_id)
      DO UPDATE SET
        session_token = EXCLUDED.session_token,
        expires_at = EXCLUDED.expires_at,
        last_activity = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await this.query(query, [telegramId, sessionToken, expiresAt]);
    return result.rows[0];
  }

  /**
   * Get session by telegram ID
   */
  async getSession(telegramId) {
    const query = `
      SELECT * FROM user_sessions 
      WHERE telegram_id = $1 
      AND expires_at > CURRENT_TIMESTAMP;
    `;
    const result = await this.query(query, [telegramId]);
    return result.rows[0] || null;
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(telegramId) {
    const query = `
      UPDATE user_sessions 
      SET last_activity = CURRENT_TIMESTAMP 
      WHERE telegram_id = $1
      RETURNING *;
    `;
    const result = await this.query(query, [telegramId]);
    return result.rows[0];
  }

  /**
   * Delete session (logout)
   */
  async deleteSession(telegramId) {
    const query = 'DELETE FROM user_sessions WHERE telegram_id = $1';
    await this.query(query, [telegramId]);
  }

  /**
   * Log login attempt
   */
  async logLoginAttempt(telegramId, success, attemptType = 'login') {
    const query = `
      INSERT INTO login_attempts (telegram_id, success, attempt_type)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await this.query(query, [telegramId, success, attemptType]);
    return result.rows[0];
  }
}

// Export singleton instance
const database = new Database();
export default database;
