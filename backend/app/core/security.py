"""
Security utilities: JWT, password hashing, permissions
"""
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import jwt, JWTError
import bcrypt
from app.core.config import settings

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(user_id: str, role: str, **extra_data) -> str:
    """
    Create JWT access token
    
    Args:
        user_id: User ID to encode
        role: User role
        **extra_data: Additional claims to include
    
    Returns:
        Encoded JWT token
    """
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access",
        **extra_data
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    """Create JWT refresh token"""
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def verify_token(token: str, token_type: str = "access") -> Optional[Dict]:
    """
    Verify and decode JWT token
    
    Args:
        token: JWT token string
        token_type: Type of token ("access" or "refresh")
    
    Returns:
        Token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        # Verify token type matches
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None
