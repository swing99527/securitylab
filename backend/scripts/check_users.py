#!/usr/bin/env python3
"""
Quick script to check/create test user
"""
import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def main():
    async with AsyncSessionLocal() as db:
        # Check existing users
        from sqlalchemy import select
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        print("📋 Existing users in database:")
        if not users:
            print("  ❌ No users found!")
        else:
            for user in users:
                print(f"  ✅ Email: {user.email}, Active: {user.is_active}, Admin: {user.is_superuser}")
        
        # Create test user if not exists
        test_email = "admin@example.com"
        result = await db.execute(select(User).where(User.email == test_email))
        existing_user = result.scalar_one_or_none()
        
        if not existing_user:
            print(f"\n🔧 Creating test user: {test_email}")
            test_user = User(
                email=test_email,
                username="admin",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                is_superuser=True
            )
            db.add(test_user)
            await db.commit()
            print(f"✅ Created test user: {test_email} / admin123")
        else:
            print(f"\n✅ Test user exists: {test_email}")
            print("   Password should be: admin123")
            print("   (If login fails, user might have different password)")

if __name__ == "__main__":
    asyncio.run(main())
