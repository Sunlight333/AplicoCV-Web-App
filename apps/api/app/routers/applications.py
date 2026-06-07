from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel

from app.db import get_db
from app.deps import get_current_user, premium_active
from app.models import Application, AutofillEvent, User

# Free plan: a fixed number of automatic applications per calendar month
# (non-accumulable). Premium/trial users are unlimited. (Client feedback Phase 5.2.)
FREE_MONTHLY_APPLICATIONS = 15
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
    # The frontend sends `?status=`; expose the query key as "status" (the param
    # is named status_filter to avoid shadowing the imported `status` module).
    status_filter: str | None = Query(default=None, alias="status"),
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

    # Phase 2.5 — measured time-saved: sum real autofill telemetry (fields filled ×
    # seconds/field), and fall back to a per-application estimate only for
    # applications recorded before any telemetry existed.
    events = (
        await db.execute(select(AutofillEvent).where(AutofillEvent.user_id == user.id))
    ).scalars().all()
    measured_seconds = sum(e.fields_filled * (e.seconds_per_field or 25) for e in events)
    untracked = max(0, total - len(events))
    estimated_seconds = untracked * 8 * 25  # ~8 fields/app fallback when no telemetry
    minutes_saved = round((measured_seconds + estimated_seconds) / 60)

    now = datetime.now(timezone.utc)
    this_month = sum(
        1
        for r in rows
        if (r.applied_at if r.applied_at.tzinfo else r.applied_at.replace(tzinfo=timezone.utc)).year
        == now.year
        and (r.applied_at if r.applied_at.tzinfo else r.applied_at.replace(tzinfo=timezone.utc)).month
        == now.month
    )
    return DashboardStats(
        totalApplications=total,
        responseRate=(responded / total) if total else 0.0,
        interviews=interviews,
        minutesSaved=minutes_saved,
        applicationsThisMonth=this_month,
        monthlyLimit=None if premium_active(user) else FREE_MONTHLY_APPLICATIONS,
    )


class AutofillEventInput(BaseModel):
    fieldsFilled: int
    portal: str | None = None
    jobUrl: str | None = None


@router.post("/autofill-event", status_code=status.HTTP_204_NO_CONTENT)
async def record_autofill_event(
    body: AutofillEventInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """The extension reports how many fields it filled, so time-saved is measured."""
    db.add(
        AutofillEvent(
            user_id=user.id,
            portal=body.portal,
            job_url=body.jobUrl,
            fields_filled=max(0, body.fieldsFilled),
        )
    )
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


async def _monthly_application_count(db: AsyncSession, user_id: str) -> int:
    """How many applications the user has recorded in the current calendar month."""
    rows = (
        await db.execute(select(Application).where(Application.user_id == user_id))
    ).scalars().all()
    now = datetime.now(timezone.utc)
    count = 0
    for r in rows:
        at = r.applied_at if r.applied_at.tzinfo else r.applied_at.replace(tzinfo=timezone.utc)
        if at.year == now.year and at.month == now.month:
            count += 1
    return count


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_application(
    body: ApplicationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationOut:
    # Enforce the free monthly application limit (premium/trial users are unlimited).
    if not premium_active(user):
        used = await _monthly_application_count(db, user.id)
        if used >= FREE_MONTHLY_APPLICATIONS:
            raise HTTPException(
                status.HTTP_402_PAYMENT_REQUIRED,
                detail=(
                    f"Free plan limit reached: {FREE_MONTHLY_APPLICATIONS} automatic "
                    "applications per month. Upgrade to Pro for unlimited applications."
                ),
            )
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
