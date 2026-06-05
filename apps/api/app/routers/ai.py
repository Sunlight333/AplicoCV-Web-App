from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import CoverLetter, Document, Profile as ProfileModel, User
from app.schemas import (
    AtsAnalysis,
    CoverLetterInput,
    CoverLetterOut,
    JobDescriptionInput,
    PersonalAnalysisOut,
    SkillSuggestionsOut,
    SuperCvInput,
    SuperCvOut,
)
from app.services import credit_service, llm_service

# In-memory ATS cache keyed by (job hash + profile version) per the plan's MVP note.
_ats_cache: dict[str, dict] = {}

router = APIRouter(tags=["ai"])


async def _profile_data(db: AsyncSession, user_id: str) -> dict:
    result = await db.execute(select(ProfileModel).where(ProfileModel.user_id == user_id))
    profile = result.scalar_one_or_none()
    return (profile.data if profile else {}) or {}


async def _charge(db: AsyncSession, user_id: str, action: str) -> None:
    """Spend the action's credit cost; 402 if the balance is insufficient."""
    cost = credit_service.AI_COSTS.get(action, 0)
    if cost <= 0:
        return
    acc = await credit_service.get_account(db, user_id)
    if not await credit_service.spend(db, acc, cost, f"ai_{action}"):
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Not enough credits — {action} costs {cost}, you have {acc.balance}.",
        )


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
    await _charge(db, user.id, "cover_letter")
    profile = await _profile_data(db, user.id)
    text = await llm_service.generate_cover_letter(body.jobDescription, profile, body.tone)
    db.add(CoverLetter(user_id=user.id, tone=body.tone, text=text))
    await db.commit()
    return CoverLetterOut(text=text)


@router.post("/ai/super-cv", response_model=SuperCvOut)
async def super_cv(
    body: SuperCvInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SuperCvOut:
    await _charge(db, user.id, "super_cv")
    profile = await _profile_data(db, user.id)
    result = await llm_service.super_cv(profile, body.targetRole, body.jobDescription, body.cvText)
    doc = Document(
        user_id=user.id,
        filename=f"Super CV — {body.targetRole}",
        path="",
        kind="optimized_cv",
        parsed={"text": result["cvText"], "ats": result["atsScore"], "role": body.targetRole},
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return SuperCvOut(
        cvText=result["cvText"], atsScore=result["atsScore"], gaps=result["gaps"], documentId=doc.id
    )


@router.post("/ai/personal-analysis", response_model=PersonalAnalysisOut)
async def personal_analysis(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> PersonalAnalysisOut:
    await _charge(db, user.id, "personal_analysis")
    profile = await _profile_data(db, user.id)
    res = await llm_service.personal_analysis(profile)
    # persist into the profile so it shows on the profile page
    row = (await db.execute(select(ProfileModel).where(ProfileModel.user_id == user.id))).scalar_one_or_none()
    if row is not None:
        data = dict(row.data or {})
        data["analysis"] = res
        row.data = data
        await db.commit()
    return PersonalAnalysisOut(**res)


@router.post("/ai/skill-suggestions", response_model=SkillSuggestionsOut)
async def skill_suggestions(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> SkillSuggestionsOut:
    await _charge(db, user.id, "skill_suggestions")
    profile = await _profile_data(db, user.id)
    skills = await llm_service.skill_suggestions(profile)
    return SkillSuggestionsOut(skills=skills)
