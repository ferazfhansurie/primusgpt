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
   * Get user by telegram username (kept for backward compatibility)
   */
  async getUserByUsername(username) {
    // Remove @ if present
    const cleanUsername = username.replace('@', '');
    const query = 'SELECT * FROM users WHERE telegram_username = $1 AND is_active = true';
    const result = await this.query(query, [cleanUsername]);
    return result.rows[0] || null;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    const result = await this.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Get user by phone
   */
  async getUserByPhone(phone) {
    const query = 'SELECT * FROM users WHERE phone = $1 AND is_active = true';
    const result = await this.query(query, [phone]);
    return result.rows[0] || null;
  }

  /**
   * Update user's telegram_id after first bot interaction (using email or phone)
   */
  async updateUserTelegramId(identifier, telegramId, identifierType = 'email') {
    let query;
    if (identifierType === 'email') {
      query = `
        UPDATE users 
        SET telegram_id = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE email = $2
        RETURNING *;
      `;
    } else if (identifierType === 'phone') {
      query = `
        UPDATE users 
        SET telegram_id = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE phone = $2
        RETURNING *;
      `;
    } else {
      // Backward compatibility for username
      const cleanUsername = identifier.replace('@', '');
      query = `
        UPDATE users 
        SET telegram_id = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE telegram_username = $2
        RETURNING *;
      `;
      const result = await this.query(query, [telegramId, cleanUsername]);
      return result.rows[0];
    }
    const result = await this.query(query, [telegramId, identifier]);
    return result.rows[0];
  }

  /**
   * Update user's telegram_id by user ID
   */
  async updateUserTelegramIdById(userId, telegramId) {
    const query = `
      UPDATE users 
      SET telegram_id = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING *;
    `;
    const result = await this.query(query, [telegramId, userId]);
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

  // ============================================
  // CONVERSATION METHODS
  // ============================================

  /**
   * Save a conversation message
   */
  async saveConversationMessage(telegramId, messageType, content, metadata = {}) {
    const query = `
      INSERT INTO conversations (telegram_id, message_type, content, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await this.query(query, [telegramId, messageType, content, JSON.stringify(metadata)]);
    return result.rows[0];
  }

  /**
   * Get recent conversation history
   */
  async getConversationHistory(telegramId, limit = 10) {
    const query = `
      SELECT * FROM conversations 
      WHERE telegram_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2;
    `;
    const result = await this.query(query, [telegramId, limit]);
    return result.rows.reverse(); // Return in chronological order
  }

  /**
   * Get all conversations (for admin dashboard)
   */
  async getAllConversations(limit = 100, offset = 0) {
    const query = `
      SELECT 
        c.*,
        u.telegram_first_name,
        u.telegram_username,
        u.email
      FROM conversations c
      LEFT JOIN users u ON c.telegram_id = u.telegram_id
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const result = await this.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Get or create conversation session
   */
  async getConversationSession(telegramId) {
    let query = 'SELECT * FROM conversation_sessions WHERE telegram_id = $1';
    let result = await this.query(query, [telegramId]);
    
    if (result.rows.length === 0) {
      // Create new session
      query = `
        INSERT INTO conversation_sessions (telegram_id, current_state, context)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      result = await this.query(query, [telegramId, null, JSON.stringify({})]);
    }
    
    return result.rows[0];
  }

  /**
   * Update conversation session
   */
  async updateConversationSession(telegramId, updates) {
    const { current_state, context, message_count } = updates;
    const query = `
      UPDATE conversation_sessions
      SET 
        current_state = COALESCE($2, current_state),
        context = COALESCE($3, context),
        message_count = COALESCE($4, message_count),
        last_activity = CURRENT_TIMESTAMP
      WHERE telegram_id = $1
      RETURNING *;
    `;
    const result = await this.query(query, [
      telegramId,
      current_state,
      context ? JSON.stringify(context) : null,
      message_count
    ]);
    return result.rows[0];
  }

  /**
   * Save analysis reference for AI context
   */
  async saveAnalysisReference(telegramId, analysisId, fullAnalysis) {
    // Generate unique reference key
    const referenceKey = `A${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    
    // Deactivate previous references for this user (keep only last 5 active)
    await this.query(`
      UPDATE analysis_references
      SET is_active = false
      WHERE telegram_id = $1
      AND id NOT IN (
        SELECT id FROM analysis_references
        WHERE telegram_id = $1 AND is_active = true
        ORDER BY created_at DESC
        LIMIT 4
      )
    `, [telegramId]);

    const query = `
      INSERT INTO analysis_references (telegram_id, analysis_id, reference_key, full_analysis)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await this.query(query, [
      telegramId,
      analysisId,
      referenceKey,
      JSON.stringify(fullAnalysis)
    ]);
    return result.rows[0];
  }

  /**
   * Get last analysis reference for user
   */
  async getLastAnalysisReference(telegramId) {
    const query = `
      SELECT * FROM analysis_references
      WHERE telegram_id = $1 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const result = await this.query(query, [telegramId]);
    return result.rows[0] || null;
  }

  /**
   * Get analysis by reference key
   */
  async getAnalysisByReference(referenceKey) {
    const query = 'SELECT * FROM analysis_references WHERE reference_key = $1';
    const result = await this.query(query, [referenceKey]);
    return result.rows[0] || null;
  }

  // ============================================
  // AI GUIDELINES METHODS
  // ============================================

  /**
   * Get all active guidelines
   */
  async getActiveGuidelines(type = null) {
    let query = 'SELECT * FROM ai_guidelines WHERE is_active = true';
    const params = [];
    
    if (type) {
      query += ' AND guideline_type = $1';
      params.push(type);
    }
    
    query += ' ORDER BY priority ASC, created_at ASC';
    const result = await this.query(query, params);
    return result.rows;
  }

  /**
   * Get guideline by key
   */
  async getGuideline(key) {
    const query = 'SELECT * FROM ai_guidelines WHERE guideline_key = $1';
    const result = await this.query(query, [key]);
    return result.rows[0] || null;
  }

  /**
   * Upsert guideline
   */
  async upsertGuideline(key, type, content, priority = 0, createdBy = null) {
    const query = `
      INSERT INTO ai_guidelines (guideline_key, guideline_type, content, priority, created_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (guideline_key)
      DO UPDATE SET
        content = EXCLUDED.content,
        priority = EXCLUDED.priority,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const result = await this.query(query, [key, type, content, priority, createdBy]);
    return result.rows[0];
  }

  /**
   * Toggle guideline active status
   */
  async toggleGuideline(key, isActive) {
    const query = `
      UPDATE ai_guidelines
      SET is_active = $2, updated_at = CURRENT_TIMESTAMP
      WHERE guideline_key = $1
      RETURNING *;
    `;
    const result = await this.query(query, [key, isActive]);
    return result.rows[0];
  }

  // ============================================
  // ADMIN USER METHODS
  // ============================================

  /**
   * Create admin user
   */
  async createAdminUser(username, passwordHash, email, role = 'admin') {
    const query = `
      INSERT INTO admin_users (username, password_hash, email, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, is_active, created_at;
    `;
    const result = await this.query(query, [username, passwordHash, email, role]);
    return result.rows[0];
  }

  /**
   * Get admin user by username
   */
  async getAdminByUsername(username) {
    const query = 'SELECT * FROM admin_users WHERE username = $1 AND is_active = true';
    const result = await this.query(query, [username]);
    return result.rows[0] || null;
  }

  /**
   * Create admin session
   */
  async createAdminSession(adminId, sessionToken, expiresInDays = 7) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const query = `
      INSERT INTO admin_sessions (admin_id, session_token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await this.query(query, [adminId, sessionToken, expiresAt]);
    return result.rows[0];
  }

  /**
   * Get admin session
   */
  async getAdminSession(sessionToken) {
    const query = `
      SELECT s.*, a.username, a.email, a.role
      FROM admin_sessions s
      JOIN admin_users a ON s.admin_id = a.id
      WHERE s.session_token = $1 
      AND s.expires_at > CURRENT_TIMESTAMP
      AND a.is_active = true;
    `;
    const result = await this.query(query, [sessionToken]);
    return result.rows[0] || null;
  }

  /**
   * Delete admin session
   */
  async deleteAdminSession(sessionToken) {
    const query = 'DELETE FROM admin_sessions WHERE session_token = $1';
    await this.query(query, [sessionToken]);
  }

  /**
   * Update admin last login
   */
  async updateAdminLastLogin(adminId) {
    const query = `
      UPDATE admin_users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;
    await this.query(query, [adminId]);
  }
}

// Export singleton instance
const database = new Database();
export default database;
