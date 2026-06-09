from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy import delete as sql_delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import (
    Application,
    CoverLetter,
    Credential,
    CreditAccount,
    CreditTransaction,
    Document,
    FaqAnswer,
    LlmUsage,
    Operation,
    Profile,
    Recommendation,
    User,
)
from app.routers.auth import REFRESH_COOKIE, _user_out
from app.schemas import JobPreferences, SetPasswordInput, UserOut
from app.security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])


class UserPatch(BaseModel):
    onboarded: bool | None = None
    fullName: str | None = None


# Profile sections the tool needs to work correctly. The user cannot finish
# onboarding until each has at least one entry (client requirement).
REQUIRED_SECTIONS = ("experience", "education", "languages")


def _missing_required(profile_data: dict | None) -> list[str]:
    p = profile_data or {}
    return [s for s in REQUIRED_SECTIONS if not (p.get(s) or [])]


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
    if patch.onboarded:
        # Block completing onboarding until Experience, Education and Languages
        # each have at least one entry — the tool can't autofill without them.
        prof = (
            await db.execute(select(Profile).where(Profile.user_id == user.id))
        ).scalar_one_or_none()
        missing = _missing_required(prof.data if prof else {})
        if missing:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Add at least one entry to: " + ", ".join(missing),
            )
        user.onboarded = True
    elif patch.onboarded is not None:
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


@router.delete("/me")
async def delete_account(
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    """Permanently delete the account and all associated data."""
    for model in (
        Profile, Document, Application, CoverLetter, Credential,
        Recommendation, Operation, CreditAccount, CreditTransaction, FaqAnswer, LlmUsage,
    ):
        await db.execute(sql_delete(model).where(model.user_id == user.id))
    await db.delete(user)
    await db.commit()
    response.delete_cookie(REFRESH_COOKIE, path="/")
    return {"ok": True}
