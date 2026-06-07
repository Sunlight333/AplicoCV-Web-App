from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import CheckoutOut, CreditPackInput, PlanOut
from app.services import credit_service

try:  # Stripe SDK is optional — billing falls back to a stub without it.
    import stripe  # type: ignore
except ImportError:  # pragma: no cover
    stripe = None

router = APIRouter(prefix="/billing", tags=["billing"])

# Plan catalogue. Subscription tiers unlock premium; credit packs are one-off
# top-ups. Prices are illustrative and shared with the frontend via GET /plans.
_PLANS: list[dict] = [
    {
        "id": "free", "name": "Free", "price": 0.0, "interval": "month",
        "credits": None, "kind": "subscription", "highlighted": False,
        "features": ["15 automatic applications / month", "100 welcome credits", "Daily check-in rewards", "Browser extension", "Basic ATS score"],
    },
    {
        "id": "pro_monthly", "name": "Pro", "price": 7.0, "interval": "month",
        "credits": 1000, "kind": "subscription", "highlighted": True,
        "features": ["Everything in Free", "Unlimited job applications", "1,000 credits / month", "Unlimited Super-CV & cover letters", "AI mock interviews", "Priority AI"],
    },
    {
        "id": "pro_annual", "name": "Pro Annual", "price": 70.0, "interval": "year",
        "credits": 12000, "kind": "subscription", "highlighted": False,
        "features": ["Everything in Pro", "Unlimited job applications", "12,000 credits / year", "2 months free", "Early access to new features"],
    },
    {
        "id": "pack_500", "name": "500 credits", "price": 4.99, "interval": "once",
        "credits": 500, "kind": "credits", "highlighted": False,
        "features": ["One-time top-up", "Never expires"],
    },
    {
        "id": "pack_1500", "name": "1,500 credits", "price": 11.99, "interval": "once",
        "credits": 1500, "kind": "credits", "highlighted": True,
        "features": ["Best value", "One-time top-up", "Never expires"],
    },
    {
        "id": "pack_5000", "name": "5,000 credits", "price": 29.99, "interval": "once",
        "credits": 5000, "kind": "credits", "highlighted": False,
        "features": ["Power user", "One-time top-up", "Never expires"],
    },
]


def _stripe():
    if stripe is None:
        raise HTTPException(
            status.HTTP_501_NOT_IMPLEMENTED,
            detail="Stripe is configured but the stripe SDK is not installed.",
        )
    stripe.api_key = settings.stripe_secret_key
    return stripe


@router.get("/plans", response_model=list[PlanOut])
async def plans(user: User = Depends(get_current_user)) -> list[PlanOut]:
    """Subscription tiers + one-off credit packs for the Plans screen."""
    current_id = "pro_monthly" if user.plan == "premium" else "free"
    return [PlanOut(**p, current=(p["id"] == current_id)) for p in _PLANS]


@router.post("/credits/checkout", response_model=CheckoutOut)
async def credits_checkout(
    body: CreditPackInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckoutOut:
    """Buy a one-off credit pack. With Stripe configured this opens a one-time
    Checkout (credits granted by the webhook); in stub mode credits are granted
    immediately so the demo flow completes end to end."""
    pack = next((p for p in _PLANS if p["id"] == body.pack and p["kind"] == "credits"), None)
    if not pack:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Unknown credit pack.")

    if not settings.stripe_enabled:
        acc = await credit_service.get_account(db, user.id)
        await credit_service.grant(db, acc, int(pack["credits"]), f"purchase_{pack['id']}")
        return CheckoutOut(url=f"{settings.frontend_url}/settings/billing?credits={pack['credits']}")

    s = _stripe()
    session = s.checkout.Session.create(
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": pack["name"]},
                "unit_amount": int(round(pack["price"] * 100)),
            },
            "quantity": 1,
        }],
        client_reference_id=user.id,
        customer_email=user.email,
        metadata={"userId": user.id, "credits": str(pack["credits"])},
        success_url=f"{settings.frontend_url}/settings/billing?credits={pack['credits']}",
        cancel_url=f"{settings.frontend_url}/settings/billing?canceled=1",
    )
    return CheckoutOut(url=session.url)


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
        meta = obj.get("metadata") or {}
        if user_id:
            user = await db.get(User, user_id)
            if user:
                if obj.get("mode") == "payment" and meta.get("credits"):
                    # One-off credit-pack purchase — top up the balance.
                    acc = await credit_service.get_account(db, user_id)
                    await credit_service.grant(
                        db, acc, int(meta["credits"]), "purchase_credits"
                    )
                else:
                    user.plan = "premium"
                    if customer_id:
                        user.preferences = {
                            **(user.preferences or {}), "stripeCustomerId": customer_id
                        }
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
