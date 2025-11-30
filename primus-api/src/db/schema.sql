-- Users table for authentication and tracking
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    telegram_username VARCHAR(255),
    telegram_first_name VARCHAR(255),
    telegram_last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analysis history table
CREATE TABLE IF NOT EXISTS analysis_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    pair VARCHAR(20) NOT NULL,
    strategy VARCHAR(50) NOT NULL,
    market_category VARCHAR(50),
    signal VARCHAR(20),
    confidence DECIMAL(5,2),
    is_valid BOOLEAN,
    trend VARCHAR(50),
    pattern VARCHAR(100),
    zone_low DECIMAL(15,5),
    zone_high DECIMAL(15,5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login attempts table (for security tracking)
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    success BOOLEAN DEFAULT false,
    attempt_type VARCHAR(50),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table (for remembering logged-in users)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_analysis_telegram_id ON analysis_history(telegram_id);
CREATE INDEX IF NOT EXISTS idx_analysis_created_at ON analysis_history(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_telegram_id ON user_sessions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
