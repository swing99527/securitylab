"""
Test database connection and create tables manually
"""
import asyncio
import sys
sys.path.insert(0, '/Users/chenshangwei/code/securityLab/backend')

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models import Base

# Use synchronous psycopg2 for this test
sync_url = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')

print(f"Connecting to: {sync_url}")

try:
    engine = create_engine(sync_url)
    
    # Test connection
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print(f"✅ Connected to PostgreSQL:")
        print(f"   {version}")
        
        # Check current user
        result = conn.execute(text("SELECT current_user, current_database();"))
        user, db = result.fetchone()
        print(f"✅ Current user: {user}")
        print(f"✅ Current database: {db}")
    
    # Create all tables
    print("\n🔧 Creating all tables...")
    Base.metadata.create_all(engine)
    print("✅ All tables created!")
    
    # Verify tables
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
        """))
        tables = [row[0] for row in result.fetchall()]
        print(f"\n📊 Created {len(tables)} tables:")
        for table in tables:
            print(f"   - {table}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
