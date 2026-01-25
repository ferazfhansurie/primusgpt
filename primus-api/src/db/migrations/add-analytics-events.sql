-- Analytics Events Table
-- Tracks all visitor events for the website

CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL DEFAULT 'pageview',
    page_path VARCHAR(500) NOT NULL,
    referrer VARCHAR(1000) DEFAULT 'direct',
    user_agent TEXT,
    ip_address VARCHAR(45),
    country VARCHAR(100) DEFAULT 'unknown',
    city VARCHAR(100) DEFAULT 'unknown',
    screen_width INTEGER,
    screen_height INTEGER,
    language VARCHAR(20) DEFAULT 'unknown',
    timezone VARCHAR(100) DEFAULT 'unknown',
    visitor_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_path ON analytics_events(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_country ON analytics_events(country);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_date_visitor ON analytics_events(DATE(created_at), visitor_id);
