-- Enhanced Analytics Events Tracking
-- Adds additional columns for more detailed visitor tracking

-- Add new columns to analytics_events table
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS page_title VARCHAR(500);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS region VARCHAR(100) DEFAULT 'unknown';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS viewport_width INTEGER;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS viewport_height INTEGER;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS languages TEXT;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 0;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS device_type VARCHAR(20);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS browser VARCHAR(50);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS os VARCHAR(50);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS connection_type VARCHAR(20);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS is_returning BOOLEAN DEFAULT false;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS color_depth INTEGER;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS pixel_ratio DECIMAL(4,2);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS touch_support BOOLEAN DEFAULT false;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);

-- Add indexes for new commonly queried columns
CREATE INDEX IF NOT EXISTS idx_analytics_events_device_type ON analytics_events(device_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_browser ON analytics_events(browser);
CREATE INDEX IF NOT EXISTS idx_analytics_events_os ON analytics_events(os);
CREATE INDEX IF NOT EXISTS idx_analytics_events_is_returning ON analytics_events(is_returning);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
