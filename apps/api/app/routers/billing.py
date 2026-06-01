from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import CheckoutOut

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/checkout", response_model=CheckoutOut)
async def checkout(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> CheckoutOut:
    """
    Start a subscription. With Stripe configured this creates a Checkout Session
    and returns its URL. In stub mode we immediately upgrade the user and return a
    success URL so the demo flow completes end to end.
    """
    if not settings.stripe_secret_key:
        user.plan = "premium"
        await db.commit()
        return CheckoutOut(url="http://localhost:5173/settings/billing?upgraded=1")
    # Real Stripe Checkout would be created here.
    raise NotImplementedError("Stripe configured but checkout not implemented")


@router.post("/portal", response_model=CheckoutOut)
async def customer_portal(user: User = Depends(get_current_user)) -> CheckoutOut:
    if not settings.stripe_secret_key:
        return CheckoutOut(url="http://localhost:5173/settings/billing")
    raise NotImplementedError


@router.post("/webhook")
async def webhook(request: Request) -> dict[str, bool]:
    """Stripe webhook endpoint. In stub mode this is a no-op acknowledgement."""
    _ = await request.body()
    return {"received": True}
