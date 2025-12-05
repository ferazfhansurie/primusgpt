#!/bin/bash

# Run database migration to add payment columns
# This script adds the necessary payment tracking columns to the users table

echo "Running payment columns migration..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL is not set"
    echo "Please set DATABASE_URL in your .env file"
    exit 1
fi

# Run the migration
psql "$DATABASE_URL" -f src/db/migrations/add-payment-columns.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
