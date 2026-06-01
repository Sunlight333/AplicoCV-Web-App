from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.routers import (
    agent,
    ai,
    applications,
    auth,
    billing,
    credentials,
    documents,
    operations,
    portals,
    profiles,
    recommendations,
    users,
)
from app.seed import seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    await seed()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="AplicoCV backend — Phase 3 (FastAPI + AI services).",
    lifespan=lifespan,
)

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
):
    app.include_router(r, prefix="/api")


@app.get("/api/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok", "llm_provider": settings.llm_provider}
