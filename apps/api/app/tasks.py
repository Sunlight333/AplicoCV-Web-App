"""Celery task definitions. Imported by app.celery_app (worker process only)."""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.celery_app import celery_app
from app.config import settings
from app.db import SessionLocal
from app.models import User
from app.services import email_service
from app.services.agent_service import autonomous_apply_for_user, scan_for_user


@celery_app.task(name="agent.scan_all_premium")
def scan_all_premium() -> int:
    """Periodic autonomous assistant run (Phase 8): for each premium user, refresh
    recommendations, optionally queue strong matches for review (ALPHA), and email a
    digest of new high-match jobs to those who opted in."""

    async def _run() -> int:
        count = 0
        async with SessionLocal() as db:
            users = (
                await db.execute(select(User).where(User.plan == "premium"))
            ).scalars().all()
            for user in users:
                recs = await scan_for_user(db, user)
                count += 1
                prefs = user.preferences or {}

                # ALPHA: queue strong matches for the user to review (gated internally).
                await autonomous_apply_for_user(db, user)

                # Email digest of new high-match jobs (opt-in).
                if prefs.get("emailDigest"):
                    threshold = settings.agent_match_threshold
                    top = [
                        {
                            "title": r.job_title, "company": r.company, "portal": r.portal,
                            "score": r.match_score, "url": r.job_url,
                        }
                        for r in recs
                        if r.match_score >= threshold
                    ]
                    if top:
                        subject, html = email_service.job_digest_email(user.full_name, top)
                        await email_service.send(user.email, subject, html)
        return count

    return asyncio.run(_run())
