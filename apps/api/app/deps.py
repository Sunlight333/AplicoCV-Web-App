from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.models import User
from app.security import decode_token

bearer = HTTPBearer(auto_error=False)


def trial_ends_at(user: User) -> datetime:
    """When this account's free trial expires (signup + TRIAL_DAYS)."""
    created = user.created_at
    if created.tzinfo is None:  # SQLite may return naive datetimes
        created = created.replace(tzinfo=timezone.utc)
    return created + timedelta(days=settings.trial_days)


def premium_active(user: User) -> bool:
    """Premium features are unlocked for paying users and during the free trial."""
    if user.plan == "premium":
        return True
    return datetime.now(timezone.utc) < trial_ends_at(user)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user_id = decode_token(creds.credentials, expected_type="access")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def require_premium(user: User = Depends(get_current_user)) -> User:
    if not premium_active(user):
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, detail="Premium plan required")
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()
