"""
Phase 5 — differentiating AI feature endpoints.

- POST /profiles/localize     One-Click Multilingual (translate/adapt profile)
- POST /agent/scan            Beta AI Job Agent run (writes recommendations)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user, require_premium
from app.models import Profile as ProfileModel, Recommendation, User
from app.schemas import LocalizeInput, Profile, RecommendationOut

router = APIRouter(tags=["agent"])

# Sample postings the stubbed agent "discovers". A real agent queries job APIs
# and public RSS feeds, then scores results with the ATS logic.
_SAMPLE_JOBS = [
    {"jobTitle": "Staff Frontend Engineer", "company": "Stripe", "portal": "Greenhouse",
     "matchScore": 88, "jobUrl": "https://stripe.com/jobs/1",
     "strategicNote": "Posted 3 days ago with low applicant volume. Strong design-systems overlap."},
    {"jobTitle": "Senior React Engineer", "company": "Remote.com", "portal": "RemoteOK",
     "matchScore": 79, "jobUrl": "https://remoteok.com/jobs/2", "strategicNote": None},
    {"jobTitle": "Frontend Engineer (LATAM)", "company": "Toptal", "portal": "We Work Remotely",
     "matchScore": 72, "jobUrl": "https://weworkremotely.com/jobs/3", "strategicNote": None},
]

_LANG_LABEL = {"es": "Español", "pt": "Português", "en": "English", "fr": "Français"}


@router.post("/profiles/localize", response_model=Profile)
async def localize(
    body: LocalizeInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    """Return a localized copy of the profile (stub: tags the headline + bumps version)."""
    result = await db.execute(select(ProfileModel).where(ProfileModel.user_id == user.id))
    profile = result.scalar_one_or_none()
    data = (profile.data if profile else {}) or Profile().model_dump()
    label = _LANG_LABEL.get(body.language[:2].lower(), body.language)
    localized = {**data}
    personal = {**localized.get("personal", {})}
    if personal.get("headline"):
        personal["headline"] = f"{personal['headline']} ({label})"
    localized["personal"] = personal
    localized["version"] = data.get("version", 1) + 1
    return Profile(**localized)


@router.post("/agent/scan", response_model=list[RecommendationOut])
async def scan(
    user: User = Depends(require_premium), db: AsyncSession = Depends(get_db)
) -> list[RecommendationOut]:
    """Run the Beta AI Job Agent once: replace this user's recommendations."""
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
    return [
        RecommendationOut(
            id=r.id, jobTitle=r.job_title, company=r.company, portal=r.portal,
            matchScore=r.match_score, jobUrl=r.job_url, strategicNote=r.strategic_note,
        )
        for r in created
    ]
