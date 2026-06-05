from __future__ import annotations

from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Response, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import SessionLocal, get_db
from app.deps import get_current_user, require_premium
from app.models import Document, Operation, Profile as ProfileModel, User
from app.schemas import JobDescriptionInput, OperationOut, Profile
from app.services import llm_service
from app.services.llm_service import normalize_profile

router = APIRouter(prefix="/profiles", tags=["profiles"])


async def _get_or_create(db: AsyncSession, user_id: str) -> ProfileModel:
    result = await db.execute(select(ProfileModel).where(ProfileModel.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = ProfileModel(user_id=user_id, data=Profile().model_dump())
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


@router.get("/me", response_model=Profile)
async def get_my_profile(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> Profile:
    profile = await _get_or_create(db, user.id)
    data = profile.data or {}
    try:
        return Profile(**data)
    except Exception:
        # Tolerate loosely-shaped legacy data (e.g. raw LLM output stored before
        # normalization) so the profile still loads instead of 500-ing.
        return Profile(**normalize_profile(data))


@router.put("/me", response_model=Profile)
async def replace_profile(
    body: Profile, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> Profile:
    profile = await _get_or_create(db, user.id)
    profile.data = body.model_dump()
    profile.version = body.version
    await db.commit()
    return body


@router.patch("/me", response_model=Profile)
async def patch_profile(
    patch: dict[str, Any],
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    profile = await _get_or_create(db, user.id)
    merged = {**(profile.data or {}), **patch}
    merged["version"] = (profile.data or {}).get("version", 1) + 1
    validated = Profile(**merged)
    profile.data = validated.model_dump()
    profile.version = validated.version
    await db.commit()
    return validated


class SkillsPatch(BaseModel):
    skills: list[str]


@router.patch("/me/skills", response_model=Profile)
async def add_skills(
    body: SkillsPatch,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    profile = await _get_or_create(db, user.id)
    data = profile.data or {}
    existing = data.get("skills", [])
    merged = list(dict.fromkeys([*existing, *body.skills]))
    data["skills"] = merged
    data["version"] = data.get("version", 1) + 1
    validated = Profile(**data)
    profile.data = validated.model_dump()
    profile.version = validated.version
    await db.commit()
    return validated


@router.post("/tailor", response_model=Profile)
async def tailor(
    body: JobDescriptionInput,
    user: User = Depends(require_premium),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    profile = await _get_or_create(db, user.id)
    tailored = await llm_service.tailor_profile(body.jobDescription, profile.data or {})
    db.add(
        Document(
            user_id=user.id,
            filename="tailored.json",
            path="(generated)",
            kind="tailored",
            parsed=tailored,
        )
    )
    await db.commit()
    return Profile(**tailored)


async def _run_tailor_for_url(op_id: str, user_id: str, job_url: str, profile_data: dict) -> None:
    """
    Background worker for tailor-for-url. Generates a tailored profile and stores
    it as a Document keyed by job_url, then marks the Operation completed so the
    extension's poll of /operations/{id}/result resolves. Uses its own session
    because the request session is already closed by the time this runs.
    """
    async with SessionLocal() as db:
        op = await db.get(Operation, op_id)
        if op is None:
            return
        try:
            # The stub LLM derives the tailored profile deterministically; a real
            # implementation would fetch the posting text from job_url first.
            tailored = await llm_service.tailor_profile(job_url, profile_data)
            db.add(
                Document(
                    user_id=user_id,
                    filename="tailored.json",
                    path="(generated)",
                    kind="tailored",
                    job_url=job_url,
                    parsed=tailored,
                )
            )
            op.status = "completed"
            op.result = tailored
        except Exception as exc:  # pragma: no cover - defensive
            op.status = "error"
            op.result = {"error": str(exc)}
        await db.commit()


@router.get("/tailor-for-url", response_model=OperationOut)
async def tailor_for_url(
    response: Response,
    background: BackgroundTasks,
    url: str = Query(..., description="The job posting URL to tailor the profile for"),
    user: User = Depends(require_premium),
    db: AsyncSession = Depends(get_db),
) -> OperationOut:
    """
    Phase 5 "Real Auto-Tailoring". If a tailored version already exists for this
    URL, returns it immediately (status=completed). Otherwise dispatches a
    background job and returns 202 with a pending Operation id the extension
    polls via GET /operations/{id}/result.
    """
    existing = (
        await db.execute(
            select(Document)
            .where(
                Document.user_id == user.id,
                Document.kind == "tailored",
                Document.job_url == url,
            )
            .order_by(Document.created_at.desc())
        )
    ).scalars().first()
    if existing and existing.parsed:
        return OperationOut(id=existing.id, kind="tailor", status="completed", result=existing.parsed)

    profile = await _get_or_create(db, user.id)
    op = Operation(user_id=user.id, kind="tailor", status="pending")
    db.add(op)
    await db.commit()
    await db.refresh(op)
    background.add_task(_run_tailor_for_url, op.id, user.id, url, profile.data or {})
    response.status_code = status.HTTP_202_ACCEPTED
    return OperationOut(id=op.id, kind="tailor", status="pending", result=None)
