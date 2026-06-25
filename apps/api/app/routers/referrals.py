from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import Referral, User
from app.schemas import RedeemInput, RedeemOut, ReferralOut
from app.services import credit_service

router = APIRouter(prefix="/referrals", tags=["referrals"])


def _code_for(user_id: str) -> str:
    """A short, shareable code derived from the user id (stable, no extra column)."""
    return user_id[:8].upper()


@router.get("", response_model=ReferralOut)
async def my_referral(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> ReferralOut:
    count = (
        await db.execute(
            select(func.count()).select_from(Referral).where(Referral.referrer_id == user.id)
        )
    ).scalar() or 0
    code = _code_for(user.id)
    return ReferralOut(
        code=code,
        link=f"{settings.frontend_url}/register?ref={code}",
        referredCount=int(count),
        earned=int(count) * credit_service.REFERRAL_REWARD,
        reward=credit_service.REFERRAL_REWARD,
    )


@router.post("/redeem", response_model=RedeemOut)
async def redeem(
    body: RedeemInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RedeemOut:
    code = body.code.strip().lower()
    if not code:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Enter a referral code.")

    # A user can only ever be referred once.
    already = (
        await db.execute(select(Referral).where(Referral.referred_id == user.id))
    ).scalar_one_or_none()
    if already:
        return RedeemOut(ok=False, message="You have already redeemed a referral code.")

    if _code_for(user.id).lower() == code:
        return RedeemOut(ok=False, message="You can't redeem your own code.")

    # The code is an 8-hex-char prefix of the referrer's id. On the (astronomically
    # rare) prefix collision, more than one user matches — reject rather than risk
    # crediting the wrong referrer. Exactly one match is required.
    candidates = (
        await db.execute(select(User).where(User.id.like(f"{code}%")))
    ).scalars().all()
    if len(candidates) != 1:
        return RedeemOut(ok=False, message="That referral code is not valid.")
    referrer = candidates[0]

    # Record the referral first. The unique constraint on referred_id is the atomic
    # guard: two concurrent redeems both pass the check above, but only one INSERT
    # succeeds — the other raises IntegrityError instead of double-granting.
    db.add(Referral(referrer_id=referrer.id, referred_id=user.id))
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        return RedeemOut(ok=False, message="You have already redeemed a referral code.")

    reward = credit_service.REFERRAL_REWARD
    me = await credit_service.get_account(db, user.id)
    await credit_service.grant(db, me, reward, "referral_redeemed")
    friend = await credit_service.get_account(db, referrer.id)
    await credit_service.grant(db, friend, reward, "referral_reward")

    return RedeemOut(ok=True, amount=reward, message=f"Success! You both earned {reward} credits.")
