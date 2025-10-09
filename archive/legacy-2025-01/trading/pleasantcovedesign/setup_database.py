#!/usr/bin/env python3
"""
Pleasant Cove Design Database Setup Script
Sets up PostgreSQL database schema and optionally seeds data
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def setup_database():
    # Get database URL from environment or command line
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if not DATABASE_URL and len(sys.argv) > 1:
        DATABASE_URL = sys.argv[1]
    
    if not DATABASE_URL:
        print("❌ ERROR: No DATABASE_URL provided!")
        print("\nUsage:")
        print("  python setup_database.py 'postgresql://...'")
        print("  or")
        print("  export DATABASE_URL='postgresql://...' && python setup_database.py")
        sys.exit(1)
    
    print("🚀 Pleasant Cove Design Database Setup")
    print("=" * 40)
    print(f"\n✅ Connecting to database...")
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Drop existing tables first to ensure clean setup
        print("\n🗑️  Dropping existing tables...")
        drop_sql = """
        DROP TABLE IF EXISTS canvas_versions CASCADE;
        DROP TABLE IF EXISTS canvas_data CASCADE;
        DROP TABLE IF EXISTS scrape_runs CASCADE;
        DROP TABLE IF EXISTS leads CASCADE;
        DROP TABLE IF EXISTS orders CASCADE;
        DROP TABLE IF EXISTS progress_entries CASCADE;
        DROP TABLE IF EXISTS templates CASCADE;
        DROP TABLE IF EXISTS campaigns CASCADE;
        DROP TABLE IF EXISTS businesses CASCADE;
        DROP TABLE IF EXISTS appointments CASCADE;
        DROP TABLE IF EXISTS activities CASCADE;
        DROP TABLE IF EXISTS project_files CASCADE;
        DROP TABLE IF EXISTS project_messages CASCADE;
        DROP TABLE IF EXISTS projects CASCADE;
        DROP TABLE IF EXISTS proposals CASCADE;
        DROP TABLE IF EXISTS companies CASCADE;
        """
        cur.execute(drop_sql)
        print("✅ Existing tables dropped!")
        
        # Read and execute schema.sql
        print("\n📄 Creating database schema...")
        schema_path = os.path.join(os.path.dirname(__file__), 'server', 'schema.sql')
        if os.path.exists(schema_path):
            with open(schema_path, 'r') as f:
                schema_sql = f.read()
                cur.execute(schema_sql)
                print("✅ Schema created successfully!")
        else:
            print(f"⚠️  Schema file not found at: {schema_path}")
        
        # Read and execute migrations
        migrations_path = os.path.join(os.path.dirname(__file__), 'server', 'migrations', 'add_conversation_threads.sql')
        if os.path.exists(migrations_path):
            print("\n📄 Running migrations...")
            with open(migrations_path, 'r') as f:
                migration_sql = f.read()
                cur.execute(migration_sql)
                print("✅ Migrations completed!")
        
        # Auto-seed data for now
        print("\n🌱 Seeding database with sample data...")
        seed_data = True
        
        if seed_data:
            seed_path = os.path.join(os.path.dirname(__file__), 'server', 'seed_data.sql')
            if os.path.exists(seed_path):
                print("\n📄 Seeding sample data...")
                with open(seed_path, 'r') as f:
                    seed_sql = f.read()
                    cur.execute(seed_sql)
                print("✅ Sample data seeded successfully!")
            else:
                print(f"⚠️  Seed file not found at: {seed_path}")
        
        # Check results
        print("\n📊 Database Status:")
        cur.execute("SELECT COUNT(*) FROM companies")
        company_count = cur.fetchone()[0]
        print(f"   Companies: {company_count}")
        
        cur.execute("SELECT COUNT(*) FROM projects")
        project_count = cur.fetchone()[0]
        print(f"   Projects: {project_count}")
        
        cur.execute("SELECT COUNT(*) FROM project_messages")
        message_count = cur.fetchone()[0]
        print(f"   Messages: {message_count}")
        
        # Close connection
        cur.close()
        conn.close()
        
        print("\n✨ Database setup complete!")
        print("\nNext steps:")
        print("1. Deploy to Railway: railway up")
        print("2. Check the admin UI at: https://pleasantcovedesign-production.up.railway.app")
        print("3. The Project Workspace should now show sample projects!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    setup_database()
