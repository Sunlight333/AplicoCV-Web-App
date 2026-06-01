from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import CoverLetter, Profile as ProfileModel, User
from app.schemas import (
    AtsAnalysis,
    CoverLetterInput,
    CoverLetterOut,
    JobDescriptionInput,
)
from app.services import llm_service

# In-memory ATS cache keyed by (job hash + profile version) per the plan's MVP note.
_ats_cache: dict[str, dict] = {}

router = APIRouter(tags=["ai"])


async def _profile_data(db: AsyncSession, user_id: str) -> dict:
    result = await db.execute(select(ProfileModel).where(ProfileModel.user_id == user_id))
    profile = result.scalar_one_or_none()
    return (profile.data if profile else {}) or {}


@router.post("/ats/score", response_model=AtsAnalysis)
async def ats_score(
    body: JobDescriptionInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AtsAnalysis:
    profile = await _profile_data(db, user.id)
    key = f"{hash(body.jobDescription)}:{profile.get('version', 1)}"
    if key in _ats_cache:
        return AtsAnalysis(**_ats_cache[key])
    result = await llm_service.score_ats_match(body.jobDescription, profile)
    _ats_cache[key] = result
    return AtsAnalysis(**result)


@router.post("/cover-letters/generate", response_model=CoverLetterOut)
async def generate_cover_letter(
    body: CoverLetterInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CoverLetterOut:
    profile = await _profile_data(db, user.id)
    text = await llm_service.generate_cover_letter(body.jobDescription, profile, body.tone)
    db.add(CoverLetter(user_id=user.id, tone=body.tone, text=text))
    await db.commit()
    return CoverLetterOut(text=text)
