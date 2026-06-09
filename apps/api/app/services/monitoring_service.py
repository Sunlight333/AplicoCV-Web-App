"""
Smart Job Monitoring — the engine behind the two preference toggles:
  - "Email me a digest of new high-match jobs"
  - "Prepare strong matches for me to review (apply queue)"

It runs on a schedule (an in-process loop started in main.py — no Celery/Redis
needed, so it works on the plain systemd + SQLite production server). For each
eligible user it refreshes recommendations, queues the strongest matches as
'prepared' apply tasks for review, and emails a digest of high-match jobs.

Eligibility is gated: Premium members are included; everyone else needs an active
7-day monitoring pass bought with tokens (credits). The pass expiry is stored in
the user's CreditAccount.grants JSON so no database migration is required.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import AppLock, CreditAccount, Recommendation, User
from app.services import credit_service, email_service
from app.services.agent_service import scan_for_user

# Pricing of the monitoring pass for non-premium users.
PASS_COST = 200  # tokens (credits)
PASS_DAYS = 7
GRANT_KEY = "monitoring_until"  # ISO timestamp stored in CreditAccount.grants


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _premium(user: User) -> bool:
    # Local import avoids a circular import with the deps module.
    from app.deps import premium_active

    return premium_active(user)


def pass_until(acc) -> datetime | None:
    if acc is None:
        return None
    iso = (acc.grants or {}).get(GRANT_KEY)
    if not iso:
        return None
    try:
        dt = datetime.fromisoformat(iso)
    except (TypeError, ValueError):
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def is_active(user: User, acc) -> bool:
    """True if the user may use monitoring (premium, or an unexpired token pass)."""
    if _premium(user):
        return True
    until = pass_until(acc)
    return bool(until and until > _now())


def status(user: User, acc) -> dict:
    until = pass_until(acc)
    return {
        "active": is_active(user, acc),
        "premium": _premium(user),
        "until": until.isoformat() if until else None,
        "costTokens": PASS_COST,
        "days": PASS_DAYS,
    }


async def activate(db: AsyncSession, user: User, acc) -> dict:
    """Entitle the user to monitoring. Premium is already included (no charge);
    otherwise spend the token pass and start a 7-day window. Raises ValueError
    (insufficient balance) for the router to translate to a 402."""
    if _premium(user):
        return status(user, acc)

    # Extend from the later of now / current expiry so re-buying stacks fairly.
    base = max(_now(), pass_until(acc) or _now())
    if not await credit_service.spend(db, acc, PASS_COST, "monitoring_pass"):
        raise ValueError(f"Not enough tokens — the monitoring pass costs {PASS_COST}.")
    grants = dict(acc.grants or {})
    grants[GRANT_KEY] = (base + timedelta(days=PASS_DAYS)).isoformat()
    acc.grants = grants  # reassign so SQLAlchemy detects the JSON change
    await db.commit()
    await db.refresh(acc)
    return status(user, acc)


async def _queue_strong_matches(db: AsyncSession, user: User, recs: list[Recommendation]) -> int:
    """Queue the highest-confidence matches as 'prepared' apply tasks for review.
    Never submits — a human confirms each one (legal/ToS guardrail)."""
    from app.routers.apply import enqueue_apply  # lazy import avoids a router<->service cycle
    from app.schemas import ApplyRequestInput

    strong = [r for r in recs if r.match_score >= settings.alpha_apply_threshold][:5]
    queued = 0
    for rec in strong:
        try:
            await enqueue_apply(
                db,
                user.id,
                ApplyRequestInput(
                    recommendationId=rec.id,
                    jobUrl=rec.job_url,
                    portal=rec.portal,
                    jobTitle=rec.job_title,
                    company=rec.company,
                    autoTailor=True,
                ),
                autonomous=True,
            )
            queued += 1
        except Exception:
            # One bad posting must never stop the rest of the run.
            continue
    return queued


async def run_for_user(db: AsyncSession, user: User, acc) -> None:
    prefs = user.preferences or {}
    recs = await scan_for_user(db, user)

    if prefs.get("autoApply"):
        await _queue_strong_matches(db, user, recs)

    if prefs.get("emailDigest"):
        threshold = settings.monitoring_digest_threshold  # high matches for the digest
        top = [
            {"title": r.job_title, "company": r.company, "portal": r.portal,
             "score": r.match_score, "url": r.job_url}
            for r in recs
            if r.match_score >= threshold
        ]
        if top:
            subject, html = email_service.job_digest_email(user.full_name, top)
            await email_service.send(user.email, subject, html)


LEASE_NAME = "monitoring_sweep"


async def acquire_sweep_lease(db: AsyncSession, ttl_seconds: int) -> bool:
    """Claim the right to run the sweep for `ttl_seconds`. Returns True for exactly
    one worker; the others get False and skip — preventing duplicate digests/queues
    when uvicorn runs multiple workers."""
    now = _now()
    new_until = now + timedelta(seconds=ttl_seconds)
    row = await db.get(AppLock, LEASE_NAME)
    if row is None:
        db.add(AppLock(name=LEASE_NAME, locked_until=new_until))
        try:
            await db.commit()
            return True
        except IntegrityError:  # another worker inserted it first
            await db.rollback()
            return False
    prev = row.locked_until
    if prev and prev.tzinfo is None:
        prev = prev.replace(tzinfo=timezone.utc)
    if prev and prev > now:
        return False  # still held
    # Expired — claim atomically; only the worker whose WHERE still matches wins.
    res = await db.execute(
        update(AppLock)
        .where(AppLock.name == LEASE_NAME, AppLock.locked_until == row.locked_until)
        .values(locked_until=new_until)
    )
    await db.commit()
    return bool(res.rowcount == 1)


async def run_once(db: AsyncSession) -> int:
    """One monitoring pass over every eligible, opted-in user. Returns how many ran."""
    users = (await db.execute(select(User))).scalars().all()
    ran = 0
    for user in users:
        prefs = user.preferences or {}
        if not (prefs.get("emailDigest") or prefs.get("autoApply")):
            continue
        # Non-creating lookup: never grant a welcome account as a side effect of a sweep.
        acc = await db.get(CreditAccount, user.id)
        if not is_active(user, acc):
            continue
        try:
            await run_for_user(db, user, acc)
            ran += 1
        except Exception:
            # Isolate per-user failures so one user can't break the whole sweep.
            continue
    return ran
