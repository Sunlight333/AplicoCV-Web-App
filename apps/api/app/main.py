from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import SessionLocal, init_db
from app.ratelimit import RATELIMIT_ENABLED, limiter
from app.routers import (
    agent,
    ai,
    applications,
    apply,
    auth,
    billing,
    credentials,
    credits,
    documents,
    faq,
    insights,
    monitoring,
    operations,
    portals,
    profiles,
    recommendations,
    referrals,
    users,
)
from app.seed import seed


async def _monitoring_loop() -> None:
    """In-process scheduler for Smart Job Monitoring. Runs the scan -> match ->
    queue -> digest sweep every `agent_scan_interval_hours`. Needs no Celery/Redis,
    so it works on the plain systemd + SQLite production server. Failures in a sweep
    are swallowed so the loop never dies."""
    from app.services import monitoring_service

    interval = max(1, settings.agent_scan_interval_hours) * 3600
    await asyncio.sleep(60)  # let the app finish booting before the first sweep
    while True:
        try:
            async with SessionLocal() as db:
                # Only one worker runs each sweep (cross-process DB lease).
                if await monitoring_service.acquire_sweep_lease(db, interval):
                    await monitoring_service.run_once(db)
        except asyncio.CancelledError:
            raise
        except Exception:  # pragma: no cover - a failed sweep must not crash the loop
            pass
        await asyncio.sleep(interval)


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
    # Start the background monitoring scheduler (in-process; no external broker).
    monitor_task = asyncio.create_task(_monitoring_loop())
    try:
        yield
    finally:
        monitor_task.cancel()
        with suppress(asyncio.CancelledError, Exception):
            await monitor_task


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
    insights.router,
    apply.router,
    monitoring.router,
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
            "payments": settings.payment_provider,
            "stripe": settings.stripe_enabled,
            "mercadopago": settings.mercadopago_enabled,
            "google_oauth": settings.google_oauth_enabled,
            "storage": settings.storage_provider if settings.storage_enabled else "local",
            "email": settings.email_provider if settings.email_enabled else "console",
            "sentry": bool(settings.sentry_dsn),
        },
    }
