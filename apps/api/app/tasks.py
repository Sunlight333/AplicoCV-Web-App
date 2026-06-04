"""Celery task definitions. Imported by app.celery_app (worker process only)."""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.celery_app import celery_app
from app.db import SessionLocal
from app.models import User
from app.services.agent_service import scan_for_user


@celery_app.task(name="agent.scan_all_premium")
def scan_all_premium() -> int:
    """Periodic Beta AI Job Agent run: refresh recommendations for premium users."""

    async def _run() -> int:
        count = 0
        async with SessionLocal() as db:
            users = (
                await db.execute(select(User).where(User.plan == "premium"))
            ).scalars().all()
            for user in users:
                await scan_for_user(db, user)
                count += 1
        return count

    return asyncio.run(_run())
