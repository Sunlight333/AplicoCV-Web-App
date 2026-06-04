"""
Beta AI Job Agent — recommendation generation.

Shared by the on-demand endpoint (POST /agent/scan) and the optional Celery Beat
periodic task. The current implementation returns curated sample postings; a real
agent would query job APIs / RSS feeds, filter by the user's preferences, and
score each result with the ATS logic (settings.agent_match_threshold).
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Recommendation, User

_SAMPLE_JOBS = [
    {"jobTitle": "Staff Frontend Engineer", "company": "Stripe", "portal": "Greenhouse",
     "matchScore": 88, "jobUrl": "https://stripe.com/jobs/1",
     "strategicNote": "Posted 3 days ago with low applicant volume. Strong design-systems overlap."},
    {"jobTitle": "Senior React Engineer", "company": "Remote.com", "portal": "RemoteOK",
     "matchScore": 79, "jobUrl": "https://remoteok.com/jobs/2", "strategicNote": None},
    {"jobTitle": "Frontend Engineer (LATAM)", "company": "Toptal", "portal": "We Work Remotely",
     "matchScore": 72, "jobUrl": "https://weworkremotely.com/jobs/3", "strategicNote": None},
]


async def scan_for_user(db: AsyncSession, user: User) -> list[Recommendation]:
    """Replace this user's recommendations with a fresh scan and return them."""
    existing = (
        await db.execute(select(Recommendation).where(Recommendation.user_id == user.id))
    ).scalars().all()
    for r in existing:
        await db.delete(r)

    created: list[Recommendation] = []
    for job in _SAMPLE_JOBS:
        rec = Recommendation(
            user_id=user.id,
            job_title=job["jobTitle"],
            company=job["company"],
            portal=job["portal"],
            match_score=job["matchScore"],
            job_url=job["jobUrl"],
            strategic_note=job["strategicNote"],
        )
        db.add(rec)
        created.append(rec)
    await db.commit()
    for r in created:
        await db.refresh(r)
    return created
