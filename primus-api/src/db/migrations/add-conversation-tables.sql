-- Migration: Add Conversation and AI Features Tables
-- Created: 2025-11-30
-- Purpose: Enable AI text responses, conversation tracking, and admin management

-- ============================================
-- 1. CONVERSATIONS TABLE
-- ============================================
-- Stores all messages between users and bot (text and button interactions)
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    message_id BIGINT,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'bot', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast conversation retrieval
CREATE INDEX IF NOT EXISTS idx_conversations_telegram_id ON conversations(telegram_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_telegram_created ON conversations(telegram_id, created_at DESC);

-- ============================================
-- 2. CONVERSATION_SESSIONS TABLE
-- ============================================
-- Tracks user session states (current button step, context)
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    current_state VARCHAR(50), -- 'market', 'pair', 'strategy', etc.
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    context JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_conv_sessions_telegram_id ON conversation_sessions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_conv_sessions_last_activity ON conversation_sessions(last_activity);

-- ============================================
-- 3. ANALYSIS_REFERENCES TABLE
-- ============================================
-- Links users to their analysis results so AI can reference them
CREATE TABLE IF NOT EXISTS analysis_references (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    analysis_id INTEGER REFERENCES analysis_history(id) ON DELETE CASCADE,
    reference_key VARCHAR(50) UNIQUE NOT NULL,
    full_analysis JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_analysis_refs_telegram_id ON analysis_references(telegram_id);
CREATE INDEX IF NOT EXISTS idx_analysis_refs_reference_key ON analysis_references(reference_key);
CREATE INDEX IF NOT EXISTS idx_analysis_refs_active ON analysis_references(telegram_id, is_active, created_at DESC);

-- ============================================
-- 4. AI_GUIDELINES TABLE
-- ============================================
-- Admin-configurable AI behavior and prompts
CREATE TABLE IF NOT EXISTS ai_guidelines (
    id SERIAL PRIMARY KEY,
    guideline_key VARCHAR(100) UNIQUE NOT NULL,
    guideline_type VARCHAR(50) NOT NULL CHECK (guideline_type IN ('system', 'prompt', 'response_template', 'behavior')),
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guidelines_key ON ai_guidelines(guideline_key);
CREATE INDEX IF NOT EXISTS idx_guidelines_type_active ON ai_guidelines(guideline_type, is_active);

-- ============================================
-- 5. ADMIN_USERS TABLE
-- ============================================
-- Admin authentication and access control
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- ============================================
-- 6. ADMIN_SESSIONS TABLE
-- ============================================
-- Admin authentication sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);

-- ============================================
-- SEED DATA: Default AI Guidelines
-- ============================================

-- System Prompt (Base AI Personality)
INSERT INTO ai_guidelines (guideline_key, guideline_type, content, is_active, priority) VALUES
('system_prompt', 'system', 
'You are PRIMUS GPT, an AI trading assistant specializing in forex and gold analysis.

Core Personality:
- Professional yet approachable
- Patient and educational
- Risk-aware and cautious
- Honest about limitations

Key Behaviors:
- Always prioritize user''s risk management
- Explain technical concepts clearly
- Reference specific analysis results when discussing them
- Guide users to make informed decisions (never force trades)
- Stay focused on trading topics
- When uncertain, admit it and offer to analyze data

Rules:
- Never guarantee profits or predict exact price movements
- Always mention risk warnings when discussing trades
- Encourage users to do their own research
- Be concise but thorough
- Use emojis sparingly for readability', 
true, 1);

-- Response Guidelines for Questions
INSERT INTO ai_guidelines (guideline_key, guideline_type, content, is_active, priority) VALUES
('question_response', 'behavior',
'When answering user questions:
1. Check if there''s a recent analysis to reference
2. Be specific with price levels and details
3. Explain the reasoning behind signals
4. Always include risk warnings for trade-related questions
5. Guide users back to buttons if they need to start new analysis',
true, 2);

-- Analysis Explanation Template
INSERT INTO ai_guidelines (guideline_key, guideline_type, content, is_active, priority) VALUES
('analysis_explanation', 'response_template',
'When explaining analysis results:
- State the pair, strategy, and signal clearly
- Reference specific price levels from the analysis
- Explain why the signal was generated (trend, pattern, zone)
- Mention the confidence score
- Provide entry, stop loss, and take profit if asked
- Always remind about risk management',
true, 3);

-- Risk Warning Template
INSERT INTO ai_guidelines (guideline_key, guideline_type, content, is_active, priority) VALUES
('risk_warning', 'response_template',
'⚠️ Trading involves significant risk. Never risk more than you can afford to lose. This analysis is for educational purposes and should not be considered financial advice.',
true, 4);

-- Greeting Template
INSERT INTO ai_guidelines (guideline_key, guideline_type, content, is_active, priority) VALUES
('greeting', 'response_template',
'Welcome back! 👋 Ready to analyze the markets?

You can:
• Use the buttons to start a new analysis
• Ask me questions about trading
• Type /profile to see your stats

How can I help you today?',
true, 5);

-- Invalid Setup Explanation
INSERT INTO ai_guidelines (guideline_key, guideline_type, content, is_active, priority) VALUES
('invalid_setup_guidance', 'behavior',
'When discussing invalid setups:
- Explain why the setup didn''t meet validation criteria
- Be educational, not discouraging
- Suggest what to look for in valid setups
- Encourage trying different pairs or timeframes
- Maintain positive, helpful tone',
true, 6);

-- COMMENT
COMMENT ON TABLE conversations IS 'Stores all user-bot message interactions';
COMMENT ON TABLE conversation_sessions IS 'Tracks current session state for each user';
COMMENT ON TABLE analysis_references IS 'Links users to their analysis results for AI context';
COMMENT ON TABLE ai_guidelines IS 'Admin-configurable AI behavior and prompts';
COMMENT ON TABLE admin_users IS 'Admin user accounts for dashboard access';
COMMENT ON TABLE admin_sessions IS 'Admin authentication sessions';
