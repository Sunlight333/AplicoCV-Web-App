from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user, require_premium
from app.models import Document, Profile as ProfileModel, User
from app.schemas import JobDescriptionInput, Profile
from app.services import llm_service

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
    return Profile(**(profile.data or {}))


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
