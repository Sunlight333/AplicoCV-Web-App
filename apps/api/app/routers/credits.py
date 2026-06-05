from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import CreditTransaction, FaqAnswer, Profile, User
from app.services import credit_service

router = APIRouter(prefix="/credits", tags=["credits"])


async def _completion(db: AsyncSession, user: User) -> dict:
    prof = (
        await db.execute(select(Profile).where(Profile.user_id == user.id))
    ).scalar_one_or_none()
    data = prof.data if prof else {}
    faq_count = (
        await db.execute(
            select(func.count()).select_from(FaqAnswer).where(FaqAnswer.user_id == user.id)
        )
    ).scalar() or 0
    return credit_service.completion(data, user.preferences, int(faq_count))


@router.get("")
async def get_credits(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    acc = await credit_service.get_account(db, user.id)
    comp = await _completion(db, user)
    today = datetime.now(timezone.utc).date().isoformat()
    txs = (
        await db.execute(
            select(CreditTransaction)
            .where(CreditTransaction.user_id == user.id)
            .order_by(CreditTransaction.created_at.desc())
            .limit(15)
        )
    ).scalars().all()
    return {
        "balance": acc.balance,
        "streak": acc.streak,
        "dayInCycle": credit_service.day_in_cycle(acc.streak) if acc.streak else 0,
        "todayClaimed": acc.last_checkin == today,
        "checkinAmount": credit_service.CHECKIN_BASE,
        "doubleDays": sorted(credit_service.DOUBLE_DAYS),
        "cycleDays": credit_service.CYCLE_DAYS,
        "completion": comp,
        "earn": credit_service.earn_status(acc, comp),
        "transactions": [
            {"amount": t.amount, "reason": t.reason, "at": t.created_at.isoformat()} for t in txs
        ],
    }


@router.post("/checkin")
async def checkin(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    acc = await credit_service.get_account(db, user.id)
    return await credit_service.checkin(db, acc)


@router.post("/claim/{key}")
async def claim(
    key: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    acc = await credit_service.get_account(db, user.id)
    comp = await _completion(db, user)
    return await credit_service.claim_earn(db, acc, key, comp)
