from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import CheckoutOut

try:  # Stripe SDK is optional — billing falls back to a stub without it.
    import stripe  # type: ignore
except ImportError:  # pragma: no cover
    stripe = None

router = APIRouter(prefix="/billing", tags=["billing"])


def _stripe():
    if stripe is None:
        raise HTTPException(
            status.HTTP_501_NOT_IMPLEMENTED,
            detail="Stripe is configured but the stripe SDK is not installed.",
        )
    stripe.api_key = settings.stripe_secret_key
    return stripe


@router.post("/checkout", response_model=CheckoutOut)
async def checkout(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> CheckoutOut:
    """
    Start a subscription. With Stripe configured this creates a Checkout Session
    and returns its hosted URL. In stub mode we immediately upgrade the user so
    the demo flow completes end to end.
    """
    if not settings.stripe_enabled:
        user.plan = "premium"
        await db.commit()
        return CheckoutOut(url=f"{settings.frontend_url}/settings/billing?upgraded=1")

    s = _stripe()
    session = s.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        client_reference_id=user.id,
        customer_email=user.email,
        success_url=f"{settings.frontend_url}/settings/billing?upgraded=1",
        cancel_url=f"{settings.frontend_url}/settings/billing?canceled=1",
    )
    return CheckoutOut(url=session.url)


@router.post("/portal", response_model=CheckoutOut)
async def customer_portal(user: User = Depends(get_current_user)) -> CheckoutOut:
    """Redirect to the Stripe Customer Portal for plan/billing management."""
    if not settings.stripe_enabled:
        return CheckoutOut(url=f"{settings.frontend_url}/settings/billing")

    s = _stripe()
    customer_id = (user.preferences or {}).get("stripeCustomerId")
    if not customer_id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="No Stripe customer on file for this user."
        )
    session = s.billing_portal.Session.create(
        customer=customer_id, return_url=f"{settings.frontend_url}/settings/billing"
    )
    return CheckoutOut(url=session.url)


@router.post("/webhook")
async def webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
) -> dict[str, bool]:
    """
    Handle Stripe subscription lifecycle events. Verifies the signature when a
    webhook secret is configured; updates the user's plan tier accordingly.
    """
    payload = await request.body()
    if not settings.stripe_enabled:
        return {"received": True}

    s = _stripe()
    if settings.stripe_webhook_secret:
        try:
            event = s.Webhook.construct_event(
                payload, stripe_signature, settings.stripe_webhook_secret
            )
        except Exception:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")
    else:
        event = json.loads(payload)

    etype = event["type"]
    obj = event["data"]["object"]

    if etype == "checkout.session.completed":
        user_id = obj.get("client_reference_id")
        customer_id = obj.get("customer")
        if user_id:
            user = await db.get(User, user_id)
            if user:
                user.plan = "premium"
                if customer_id:
                    user.preferences = {**(user.preferences or {}), "stripeCustomerId": customer_id}
                await db.commit()
    elif etype == "customer.subscription.deleted":
        customer_id = obj.get("customer")
        rows = (await db.execute(select(User))).scalars().all()
        for u in rows:
            if (u.preferences or {}).get("stripeCustomerId") == customer_id:
                u.plan = "free"
                await db.commit()
                break

    return {"received": True}
