from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.routers.auth import _user_out
from app.schemas import JobPreferences, SetPasswordInput, UserOut
from app.security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])


class UserPatch(BaseModel):
    onboarded: bool | None = None
    fullName: str | None = None


@router.patch("/me/preferences", response_model=UserOut)
async def update_preferences(
    prefs: JobPreferences,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    user.preferences = prefs.model_dump()
    await db.commit()
    await db.refresh(user)
    return _user_out(user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    patch: UserPatch,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    if patch.onboarded is not None:
        user.onboarded = patch.onboarded
    if patch.fullName is not None:
        user.full_name = patch.fullName
    await db.commit()
    await db.refresh(user)
    return _user_out(user)


@router.post("/me/password", response_model=UserOut)
async def set_password(
    body: SetPasswordInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    """Set or change the account password.

    Accounts that already have a password must supply the correct current one.
    Passwordless accounts (e.g. created via Google) can set their first password
    without it.
    """
    if user.hashed_password:
        if not body.currentPassword or not verify_password(body.currentPassword, user.hashed_password):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Your current password is incorrect")
    user.hashed_password = hash_password(body.newPassword)
    await db.commit()
    await db.refresh(user)
    return _user_out(user)
