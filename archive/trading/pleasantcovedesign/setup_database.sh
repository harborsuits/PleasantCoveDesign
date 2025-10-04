#!/bin/bash

# Pleasant Cove Design Database Setup Script
# This script creates tables and seeds initial data in your Railway PostgreSQL

echo "🚀 Pleasant Cove Design Database Setup"
echo "=====================================\n"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    echo ""
    echo "To fix this:"
    echo "1. Go to your Railway project dashboard"
    echo "2. Click on your Postgres service"
    echo "3. Go to the 'Connect' tab"
    echo "4. Copy the DATABASE_URL"
    echo "5. Run: export DATABASE_URL='your-database-url-here'"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Function to run SQL file
run_sql_file() {
    local file=$1
    local description=$2
    
    echo "📄 Running: $description"
    if [ -f "$file" ]; then
        psql "$DATABASE_URL" -f "$file" -v ON_ERROR_STOP=1
        if [ $? -eq 0 ]; then
            echo "✅ Success: $description"
        else
            echo "❌ Failed: $description"
            exit 1
        fi
    else
        echo "⚠️  File not found: $file"
    fi
    echo ""
}

# Create tables
run_sql_file "pleasantcovedesign/server/schema.sql" "Creating database schema"

# Add conversation threads migration
run_sql_file "pleasantcovedesign/server/migrations/add_conversation_threads.sql" "Adding conversation threads"

# Seed sample data
echo "🌱 Would you like to seed the database with sample data? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    run_sql_file "pleasantcovedesign/server/seed_data.sql" "Seeding sample data"
fi

echo ""
echo "✨ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy to Railway: railway up"
echo "2. Check the admin UI at: https://pleasantcovedesign-production.up.railway.app"
echo "3. The Project Workspace should now show sample projects!"
