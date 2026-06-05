from __future__ import annotations

import secrets as _secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.ratelimit import limiter
from app.deps import get_current_user, get_user_by_email, premium_active, trial_ends_at
from app.models import Profile, User
from app.services import email_service
from app.schemas import (
    AuthResponse,
    ForgotPasswordInput,
    JobPreferences,
    LoginInput,
    RefreshResponse,
    RegisterInput,
    ResetPasswordInput,
    UserOut,
)
from app.security import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    hash_password,
    decode_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "aplico_refresh"


def _user_out(user: User) -> UserOut:
    active = premium_active(user)
    return UserOut(
        id=user.id,
        email=user.email,
        fullName=user.full_name,
        avatarUrl=user.avatar_url,
        plan=user.plan,  # type: ignore[arg-type]
        onboarded=user.onboarded,
        preferences=JobPreferences(**(user.preferences or {})),
        hasPassword=bool(user.hashed_password),
        premiumActive=active,
        onTrial=active and user.plan != "premium",
        trialEndsAt=trial_ends_at(user).isoformat() if user.plan != "premium" else None,
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
@limiter.limit("10/hour")
async def register(
    request: Request,
    body: RegisterInput,
    response: Response,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
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
    # Welcome email — fired in the background so it never delays the response.
    subject, html = email_service.welcome_email(user.full_name)
    background.add_task(email_service.send, user.email, subject, html)
    return AuthResponse(accessToken=create_access_token(user.id), user=_user_out(user))


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginInput,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    user = await get_user_by_email(db, body.email)
    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    _set_refresh_cookie(response, user.id)
    return AuthResponse(accessToken=create_access_token(user.id), user=_user_out(user))


@router.post("/refresh", response_model=RefreshResponse)
@limiter.limit("60/minute")
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


@router.post("/forgot-password")
@limiter.limit("5/hour")
async def forgot_password(
    request: Request,
    body: ForgotPasswordInput,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    """Email a password-reset link. Always returns ok so we never reveal whether
    an email is registered."""
    user = await get_user_by_email(db, body.email)
    if user:
        link = f"{settings.frontend_url}/reset-password?token={create_reset_token(user.id)}"
        subject, html = email_service.reset_password_email(link)
        background.add_task(email_service.send, user.email, subject, html)
    return {"ok": True}


@router.post("/reset-password", response_model=AuthResponse)
@limiter.limit("10/hour")
async def reset_password(
    request: Request,
    body: ResetPasswordInput,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Consume a reset token, set the new password, and sign the user in."""
    user_id = decode_token(body.token, "reset")
    user = await db.get(User, user_id) if user_id else None
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="This reset link is invalid or has expired")
    user.hashed_password = hash_password(body.newPassword)
    await db.commit()
    await db.refresh(user)
    _set_refresh_cookie(response, user.id)
    return AuthResponse(accessToken=create_access_token(user.id), user=_user_out(user))


# --- Google OAuth 2.0 (Authlib-style code flow, implemented with httpx) --------

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
OAUTH_STATE_COOKIE = "aplico_oauth_state"


def _google_redirect_uri(request: Request) -> str:
    if settings.google_redirect_uri:
        return settings.google_redirect_uri
    return f"{str(request.base_url).rstrip('/')}/api/auth/google/callback"


def _login_error(reason: str) -> RedirectResponse:
    return RedirectResponse(f"{settings.frontend_url}/login?error={reason}")


@router.get("/google/login")
async def google_login(request: Request) -> RedirectResponse:
    """Start the Google OAuth flow. Redirects to Google's consent screen."""
    if not settings.google_oauth_enabled:
        return _login_error("oauth_disabled")
    state = _secrets.token_urlsafe(24)
    params = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": _google_redirect_uri(request),
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "select_account",
        }
    )
    resp = RedirectResponse(f"{GOOGLE_AUTH_URL}?{params}")
    resp.set_cookie(
        OAUTH_STATE_COOKIE, state, httponly=True, max_age=600,
        samesite="lax", secure=settings.environment == "production", path="/",
    )
    return resp


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    """
    OAuth callback: validates state (CSRF), exchanges the code for tokens, loads
    the Google profile, upserts the user, sets the refresh cookie, and redirects
    to the SPA. The frontend's silent bootstrap then exchanges the cookie for an
    access token — the same JWT pair as password login.
    """
    if not settings.google_oauth_enabled:
        return _login_error("oauth_disabled")
    if not code or not state or state != request.cookies.get(OAUTH_STATE_COOKIE):
        return _login_error("oauth_state")

    async with httpx.AsyncClient(timeout=20) as client:
        token_res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": _google_redirect_uri(request),
                "grant_type": "authorization_code",
            },
        )
        if token_res.status_code != 200:
            return _login_error("oauth_token")
        access = token_res.json().get("access_token")
        info_res = await client.get(
            GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access}"}
        )
        if info_res.status_code != 200:
            return _login_error("oauth_userinfo")
        info = info_res.json()

    email = info.get("email")
    if not email:
        return _login_error("oauth_email")

    user = await get_user_by_email(db, email)
    if user is None:
        user = User(
            email=email,
            full_name=info.get("name") or email.split("@")[0],
            hashed_password=None,  # OAuth-only account
            avatar_url=info.get("picture"),
            onboarded=False,
            preferences=JobPreferences().model_dump(),
        )
        db.add(user)
        await db.flush()
        db.add(Profile(user_id=user.id, data={}))
        await db.commit()
        await db.refresh(user)

    resp = RedirectResponse(f"{settings.frontend_url}/dashboard")
    _set_refresh_cookie(resp, user.id)
    resp.delete_cookie(OAUTH_STATE_COOKIE, path="/")
    return resp
