from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_current_user, get_user_by_email
from app.models import Profile, User
from app.schemas import (
    AuthResponse,
    JobPreferences,
    LoginInput,
    RefreshResponse,
    RegisterInput,
    UserOut,
)
from app.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    decode_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "aplico_refresh"


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        fullName=user.full_name,
        avatarUrl=user.avatar_url,
        plan=user.plan,  # type: ignore[arg-type]
        onboarded=user.onboarded,
        preferences=JobPreferences(**(user.preferences or {})),
    )


def _set_refresh_cookie(response: Response, user_id: str) -> None:
    response.set_cookie(
        REFRESH_COOKIE,
        create_refresh_token(user_id),
        httponly=True,
        samesite="lax",
        secure=settings.environment == "production",
        max_age=settings.refresh_token_days * 24 * 3600,
        path="/",
    )


@router.post("/register", response_model=AuthResponse)
async def register(
    body: RegisterInput, response: Response, db: AsyncSession = Depends(get_db)
) -> AuthResponse:
    if await get_user_by_email(db, body.email):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        email=body.email,
        full_name=body.fullName,
        hashed_password=hash_password(body.password),
        preferences=JobPreferences().model_dump(),
    )
    db.add(user)
    await db.flush()
    db.add(Profile(user_id=user.id, data={}))
    await db.commit()
    await db.refresh(user)
    _set_refresh_cookie(response, user.id)
    return AuthResponse(accessToken=create_access_token(user.id), user=_user_out(user))


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginInput, response: Response, db: AsyncSession = Depends(get_db)
) -> AuthResponse:
    user = await get_user_by_email(db, body.email)
    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    _set_refresh_cookie(response, user.id)
    return AuthResponse(accessToken=create_access_token(user.id), user=_user_out(user))


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(request: Request, db: AsyncSession = Depends(get_db)) -> RefreshResponse:
    token = request.cookies.get(REFRESH_COOKIE)
    user_id = decode_token(token, expected_type="refresh") if token else None
    if not user_id or not await db.get(User, user_id):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    return RefreshResponse(accessToken=create_access_token(user_id))


@router.post("/logout")
async def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie(REFRESH_COOKIE, path="/")
    return {"ok": True}


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)) -> UserOut:
    return _user_out(user)
