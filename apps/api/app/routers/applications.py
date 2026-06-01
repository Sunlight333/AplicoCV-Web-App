from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import Application, User
from app.schemas import (
    ApplicationCreate,
    ApplicationOut,
    DashboardStats,
    NotesUpdate,
    StatusUpdate,
)

router = APIRouter(prefix="/applications", tags=["applications"])


def _out(a: Application) -> ApplicationOut:
    return ApplicationOut(
        id=a.id,
        jobUrl=a.job_url,
        portal=a.portal,
        jobTitle=a.job_title,
        company=a.company,
        status=a.status,  # type: ignore[arg-type]
        appliedAt=a.applied_at,
        cvVersionLabel=a.cv_version_label,
        coverLetter=a.cover_letter,
        jobDescription=a.job_description,
        notes=a.notes,
    )


@router.get("", response_model=list[ApplicationOut])
async def list_applications(
    portal: str | None = None,
    status_filter: str | None = None,
    search: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ApplicationOut]:
    stmt = select(Application).where(Application.user_id == user.id)
    if portal:
        stmt = stmt.where(Application.portal == portal)
    if status_filter:
        stmt = stmt.where(Application.status == status_filter)
    stmt = stmt.order_by(Application.applied_at.desc())
    rows = (await db.execute(stmt)).scalars().all()
    if search:
        q = search.lower()
        rows = [r for r in rows if q in r.job_title.lower() or q in r.company.lower()]
    return [_out(r) for r in rows]


@router.get("/stats", response_model=DashboardStats)
async def stats(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> DashboardStats:
    rows = (
        await db.execute(select(Application).where(Application.user_id == user.id))
    ).scalars().all()
    total = len(rows)
    responded = sum(1 for r in rows if r.status in ("viewed", "interview", "offer"))
    interviews = sum(1 for r in rows if r.status in ("interview", "offer"))
    return DashboardStats(
        totalApplications=total,
        responseRate=(responded / total) if total else 0.0,
        interviews=interviews,
        minutesSaved=total * 30,
    )


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_application(
    body: ApplicationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationOut:
    app = Application(
        user_id=user.id,
        job_url=body.jobUrl,
        portal=body.portal,
        job_title=body.jobTitle,
        company=body.company,
        job_description=body.jobDescription,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return _out(app)


async def _get_owned(db: AsyncSession, app_id: str, user_id: str) -> Application:
    app = await db.get(Application, app_id)
    if not app or app.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


@router.patch("/{app_id}/status", response_model=ApplicationOut)
async def update_status(
    app_id: str,
    body: StatusUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationOut:
    app = await _get_owned(db, app_id, user.id)
    app.status = body.status
    await db.commit()
    return _out(app)


@router.patch("/{app_id}", response_model=ApplicationOut)
async def update_notes(
    app_id: str,
    body: NotesUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationOut:
    app = await _get_owned(db, app_id, user.id)
    app.notes = body.notes
    await db.commit()
    return _out(app)
