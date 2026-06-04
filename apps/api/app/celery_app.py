"""
Celery application + Beat schedule for the Beta AI Job Agent (Phase 3/5).

This module is imported only by the Celery worker/beat processes, never by the
FastAPI app — so the API boots without celery installed. Run with:

    celery -A app.celery_app worker --loglevel=info
    celery -A app.celery_app beat   --loglevel=info

Requires REDIS_URL (broker + result backend). Without it, scans still run
synchronously on demand via POST /agent/scan.
"""

from __future__ import annotations

from celery import Celery

from app.config import settings

_broker = settings.redis_url or "memory://"
_backend = settings.redis_url or "cache+memory://"

celery_app = Celery("aplicocv", broker=_broker, backend=_backend)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "beta-agent-scan": {
            "task": "agent.scan_all_premium",
            "schedule": settings.agent_scan_interval_hours * 3600,
        }
    },
)

# Register task definitions on this app.
from app import tasks  # noqa: E402,F401
