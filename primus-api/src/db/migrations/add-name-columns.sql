-- Migration: Add first_name and last_name columns to users table
-- Date: 2025-11-30
-- This migration adds support for storing user names separately from telegram names

-- Add first_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'first_name'
    ) THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
        RAISE NOTICE 'Added first_name column';
    ELSE
        RAISE NOTICE 'first_name column already exists';
    END IF;
END $$;

-- Add last_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_name'
    ) THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
        RAISE NOTICE 'Added last_name column';
    ELSE
        RAISE NOTICE 'last_name column already exists';
    END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('first_name', 'last_name')
ORDER BY column_name;
