from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.ratelimit import RATELIMIT_ENABLED, limiter
from app.routers import (
    agent,
    ai,
    applications,
    auth,
    billing,
    credentials,
    credits,
    documents,
    faq,
    operations,
    portals,
    profiles,
    recommendations,
    referrals,
    users,
)
from app.seed import seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Optional error monitoring — activates only when SENTRY_DSN is set and the
    # SDK is installed, so it stays a config-only switch.
    if settings.sentry_dsn:
        try:
            import sentry_sdk

            sentry_sdk.init(
                dsn=settings.sentry_dsn,
                environment=settings.environment,
                traces_sample_rate=0.1,
            )
        except Exception:  # pragma: no cover - monitoring must never block boot
            pass
    await init_db()
    await seed()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="AplicoCV backend — Phase 3 (FastAPI + AI services).",
    lifespan=lifespan,
)

# Rate limiting (Phase 6). Per-route limits are declared with @limiter.limit.
# Wired only when slowapi is installed; otherwise the limiter is an inert no-op.
if RATELIMIT_ENABLED:
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All API routes are served under /api so a single reverse proxy / Vite dev proxy
# can forward `/api/*` to this backend.
for r in (
    auth.router,
    users.router,
    profiles.router,
    documents.router,
    applications.router,
    ai.router,
    credentials.router,
    billing.router,
    portals.router,
    recommendations.router,
    operations.router,
    agent.router,
    credits.router,
    faq.router,
    referrals.router,
):
    app.include_router(r, prefix="/api")


@app.get("/api/health", tags=["health"])
async def health() -> dict[str, object]:
    """Report status and which integrations are active (which keys are present)."""
    return {
        "status": "ok",
        "environment": settings.environment,
        "integrations": {
            "llm": settings.resolved_llm_provider,
            "stripe": settings.stripe_enabled,
            "google_oauth": settings.google_oauth_enabled,
            "storage": settings.storage_provider if settings.storage_enabled else "local",
            "email": settings.email_provider if settings.email_enabled else "console",
            "sentry": bool(settings.sentry_dsn),
        },
    }
