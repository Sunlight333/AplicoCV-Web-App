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
from app.models import Profile as ProfileModel, User
from app.schemas import LocalizeInput, Profile, RecommendationOut
from app.services import llm_service
from app.services.agent_service import scan_for_user

router = APIRouter(tags=["agent"])

@router.post("/profiles/localize", response_model=Profile)
async def localize(
    body: LocalizeInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    """
    Return a localized copy of the profile. With an LLM configured this translates
    and adapts tone/seniority to the target locale; otherwise it falls back to a
    deterministic stub. The primary profile is never overwritten.
    """
    result = await db.execute(select(ProfileModel).where(ProfileModel.user_id == user.id))
    profile = result.scalar_one_or_none()
    data = (profile.data if profile else {}) or Profile().model_dump()
    localized = await llm_service.localize_profile(data, body.language, body.region)
    return Profile(**localized)


@router.post("/agent/scan", response_model=list[RecommendationOut])
async def scan(
    user: User = Depends(require_premium), db: AsyncSession = Depends(get_db)
) -> list[RecommendationOut]:
    """Run the Beta AI Job Agent once: replace this user's recommendations."""
    created = await scan_for_user(db, user)
    return [
        RecommendationOut(
            id=r.id, jobTitle=r.job_title, company=r.company, portal=r.portal,
            matchScore=r.match_score, jobUrl=r.job_url, strategicNote=r.strategic_note,
        )
        for r in created
    ]
