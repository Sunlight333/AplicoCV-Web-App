"""
Assisted-apply queue — Phase 1.3 ("apply on your behalf" confirm flow) and the
foundation for the Phase 4.4 ALPHA autonomous agent.

Flow:
  1. POST /apply/request      user confirms "apply" -> backend tailors CV + writes a
                              cover letter, stores an ApplyTask with status 'prepared'.
  2. GET  /apply/queue        the extension pulls 'prepared' tasks to autofill.
  3. POST /apply/{id}/submitted  the extension reports the form was submitted ->
                              status 'submitted' and an Application row is recorded.
  4. POST /apply/{id}/dismiss user cancels a queued/prepared task.

The user always confirms before anything is submitted; nothing is auto-submitted by
the server. (The ALPHA agent reuses the same queue but is gated separately — see
services/agent_service.py for where autonomous queuing would call enqueue_apply.)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user, require_premium
from app.models import Application, ApplyTask, Profile as ProfileModel, User
from app.schemas import ApplyRequestInput, ApplyTaskOut
from app.services import job_fetch_service, llm_service

router = APIRouter(prefix="/apply", tags=["apply"])


def _out(t: ApplyTask) -> ApplyTaskOut:
    return ApplyTaskOut(
        id=t.id,
        jobUrl=t.job_url,
        portal=t.portal,
        jobTitle=t.job_title,
        company=t.company,
        status=t.status,  # type: ignore[arg-type]
        cvVersionLabel=t.cv_version_label,
        coverLetter=t.cover_letter,
        matchScore=t.match_score,
        createdAt=t.created_at,
    )


async def enqueue_apply(
    db: AsyncSession, user_id: str, body: ApplyRequestInput, *, autonomous: bool = False
) -> ApplyTask:
    """Prepare a tailored CV + cover letter for a posting and queue it (status 'prepared').
    Shared by the user-confirmed flow and the autonomous ALPHA agent."""
    profile_row = (
        await db.execute(select(ProfileModel).where(ProfileModel.user_id == user_id))
    ).scalar_one_or_none()
    profile = (profile_row.data if profile_row else {}) or {}

    jd = await job_fetch_service.job_text_or_fallback(body.jobUrl, body.jobDescription)
    tailored = profile
    if body.autoTailor and profile:
        tailored = await llm_service.tailor_profile(jd, profile)
    cover = await llm_service.generate_cover_letter(jd, tailored, "professional")
    score = (await llm_service.score_ats_match(jd, tailored)).get("matchScore") if jd else None

    task = ApplyTask(
        user_id=user_id,
        recommendation_id=body.recommendationId,
        job_url=body.jobUrl,
        portal=body.portal,
        job_title=body.jobTitle,
        company=body.company,
        job_description=jd or body.jobDescription,
        status="prepared",
        cv_version_label=f"Tailored — {body.jobTitle}"[:120],
        tailored_profile=tailored,
        cover_letter=cover,
        match_score=score,
        autonomous=autonomous,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.post("/request", response_model=ApplyTaskOut, status_code=status.HTTP_201_CREATED)
async def request_apply(
    body: ApplyRequestInput,
    user: User = Depends(require_premium),
    db: AsyncSession = Depends(get_db),
) -> ApplyTaskOut:
    """Confirm 'apply on my behalf' for one posting (premium)."""
    task = await enqueue_apply(db, user.id, body)
    return _out(task)


@router.get("/tasks", response_model=list[ApplyTaskOut])
async def list_tasks(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[ApplyTaskOut]:
    rows = (
        await db.execute(
            select(ApplyTask)
            .where(ApplyTask.user_id == user.id)
            .order_by(ApplyTask.created_at.desc())
            .limit(100)
        )
    ).scalars().all()
    return [_out(t) for t in rows]


@router.get("/queue", response_model=list[ApplyTaskOut])
async def queue(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[ApplyTaskOut]:
    """Prepared tasks the extension should pick up and autofill."""
    rows = (
        await db.execute(
            select(ApplyTask)
            .where(ApplyTask.user_id == user.id, ApplyTask.status == "prepared")
            .order_by(ApplyTask.created_at.asc())
        )
    ).scalars().all()
    return [_out(t) for t in rows]


async def _owned(db: AsyncSession, task_id: str, user_id: str) -> ApplyTask:
    task = await db.get(ApplyTask, task_id)
    if not task or task.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Apply task not found")
    return task


@router.post("/{task_id}/submitted", response_model=ApplyTaskOut)
async def mark_submitted(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplyTaskOut:
    """The extension reports the form was submitted; record it in tracking."""
    task = await _owned(db, task_id, user.id)
    task.status = "submitted"
    db.add(
        Application(
            user_id=user.id,
            job_url=task.job_url,
            portal=task.portal,
            job_title=task.job_title,
            company=task.company,
            status="applied",
            cv_version_label=task.cv_version_label,
            cover_letter=task.cover_letter,
            job_description=task.job_description,
        )
    )
    await db.commit()
    await db.refresh(task)
    return _out(task)


@router.post("/{task_id}/dismiss", response_model=ApplyTaskOut)
async def dismiss(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplyTaskOut:
    task = await _owned(db, task_id, user.id)
    task.status = "dismissed"
    await db.commit()
    await db.refresh(task)
    return _out(task)
