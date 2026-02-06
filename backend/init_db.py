#!/usr/bin/env python3
"""
Database initialization script - creates all tables
"""
import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.models import Base

async def init_database():
    """Create all database tables"""
    print("Connecting to database...")
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    print("Creating all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database tables created successfully!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_database())
