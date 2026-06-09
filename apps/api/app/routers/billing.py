from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app import pricing
from app.schemas import CheckoutOut, CreditPackInput, PlanOut
from app.services import credit_service, mercadopago_service

try:  # Stripe SDK is optional — billing falls back to a stub without it.
    import stripe  # type: ignore
except ImportError:  # pragma: no cover
    stripe = None

router = APIRouter(prefix="/billing", tags=["billing"])

# Plan catalogue. Subscription tiers unlock premium; credit packs are one-off
# top-ups. Prices are illustrative and shared with the frontend via GET /plans.
_PLANS: list[dict] = [
    {
        "id": "free", "name": "Free", "interval": "month",
        "credits": None, "kind": "subscription", "highlighted": False,
        "features": ["15 automatic applications / month", "100 welcome credits", "Daily check-in rewards", "Browser extension", "Basic ATS score"],
    },
    {
        "id": "pro_monthly", "name": "Pro", "interval": "month",
        "credits": 1000, "kind": "subscription", "highlighted": True,
        "features": ["Everything in Free", "Unlimited job applications", "1,000 credits / month", "Unlimited Super-CV & cover letters", "AI mock interviews", "Priority AI"],
    },
    {
        "id": "pro_annual", "name": "Pro Annual", "interval": "year",
        "credits": 12000, "kind": "subscription", "highlighted": False,
        "features": ["Everything in Pro", "Unlimited job applications", "12,000 credits / year", "2 months free", "Early access to new features"],
    },
    {
        "id": "pack_500", "name": "500 credits", "interval": "once",
        "credits": 500, "kind": "credits", "highlighted": False,
        "features": ["One-time top-up", "Never expires"],
    },
    {
        "id": "pack_1500", "name": "1,500 credits", "interval": "once",
        "credits": 1500, "kind": "credits", "highlighted": True,
        "features": ["Best value", "One-time top-up", "Never expires"],
    },
    {
        "id": "pack_5000", "name": "5,000 credits", "interval": "once",
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


# --- MercadoPago helpers ------------------------------------------------------

def _api_base() -> str:
    """Public base URL of this API, for MercadoPago's webhook callback. In prod the
    SPA lives at https://aplicocv.com and the API under /api on the same host."""
    return f"{settings.frontend_url.rstrip('/')}/api"


async def _mp_preference(
    user: User, *, title: str, price: float, metadata: dict, success_qs: str
) -> str:
    """Create a MercadoPago Checkout Pro preference and return its redirect URL."""
    try:
        return await mercadopago_service.create_preference(
            items=[{
                "title": title,
                "quantity": 1,
                "unit_price": float(price),
                "currency_id": pricing.active_currency(),
            }],
            payer_email=user.email,
            external_reference=user.id,
            metadata={"user_id": user.id, **metadata},
            back_urls={
                "success": f"{settings.frontend_url}/settings/billing?{success_qs}",
                "failure": f"{settings.frontend_url}/settings/billing?canceled=1",
                "pending": f"{settings.frontend_url}/settings/billing?pending=1",
            },
            notification_url=f"{_api_base()}/billing/mercadopago/webhook",
        )
    except Exception:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, detail="Could not start MercadoPago checkout."
        )


async def _fulfill(
    db: AsyncSession, user: User, kind: str | None, credits: int | None,
    plan_id: str | None, payment_id: str,
) -> None:
    """Apply a paid order exactly once. The processed payment ids are recorded in
    the CreditAccount.grants JSON (migration-free) so webhook retries don't double-grant."""
    acc = await credit_service.get_account(db, user.id)
    processed = list((acc.grants or {}).get("mp_payments") or [])
    if payment_id in processed:
        return
    if kind == "credits" and credits:
        await credit_service.grant(db, acc, int(credits), f"purchase_{plan_id or 'credits'}")
    else:
        user.plan = "premium"
    grants = dict(acc.grants or {})
    grants["mp_payments"] = processed + [payment_id]
    acc.grants = grants  # reassign so SQLAlchemy detects the JSON change
    await db.commit()


@router.get("/plans", response_model=list[PlanOut])
async def plans(user: User = Depends(get_current_user)) -> list[PlanOut]:
    """Subscription tiers + one-off credit packs for the Plans screen. Prices are
    in the configured currency (default CLP), converted from the CLP base catalogue."""
    current_id = "pro_monthly" if user.plan == "premium" else "free"
    currency = pricing.active_currency()
    return [
        PlanOut(
            **p,
            price=pricing.price_in(p["id"], currency),
            currency=currency,
            current=(p["id"] == current_id),
        )
        for p in _PLANS
    ]


@router.get("/pricing")
async def public_pricing() -> dict:
    """Public catalogue + prices in the active currency, for the landing page
    (no auth, so it can be shown to logged-out visitors)."""
    currency = pricing.active_currency()
    return {
        "currency": currency,
        "plans": [
            {
                "id": p["id"], "name": p["name"], "interval": p["interval"],
                "credits": p["credits"], "kind": p["kind"],
                "price": pricing.price_in(p["id"], currency), "currency": currency,
            }
            for p in _PLANS
        ],
    }


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

    if settings.mercadopago_enabled:
        url = await _mp_preference(
            user,
            title=pack["name"],
            price=pricing.price_in(pack["id"]),
            metadata={"kind": "credits", "credits": int(pack["credits"]), "plan_id": pack["id"]},
            success_qs=f"credits={pack['credits']}",
        )
        return CheckoutOut(url=url)

    if not settings.stripe_enabled:
        acc = await credit_service.get_account(db, user.id)
        await credit_service.grant(db, acc, int(pack["credits"]), f"purchase_{pack['id']}")
        return CheckoutOut(url=f"{settings.frontend_url}/settings/billing?credits={pack['credits']}")

    s = _stripe()
    currency = pricing.active_currency()
    price = pricing.price_in(pack["id"], currency)
    # Stripe expects the amount in the currency's minor unit, except for
    # zero-decimal currencies (e.g. CLP, COP) which take the whole-unit amount.
    unit_amount = int(round(price)) if pricing.is_zero_decimal(currency) else int(round(price * 100))
    session = s.checkout.Session.create(
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": currency.lower(),
                "product_data": {"name": pack["name"]},
                "unit_amount": unit_amount,
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
    if settings.mercadopago_enabled:
        pro = next(p for p in _PLANS if p["id"] == "pro_monthly")
        url = await _mp_preference(
            user,
            title=f"AplicoCV {pro['name']}",
            price=pricing.price_in(pro["id"]),
            metadata={"kind": "subscription", "plan_id": pro["id"]},
            success_qs="upgraded=1",
        )
        return CheckoutOut(url=url)

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


@router.post("/mercadopago/webhook")
async def mercadopago_webhook(
    request: Request, db: AsyncSession = Depends(get_db)
) -> dict[str, bool]:
    """
    Handle MercadoPago payment notifications. MercadoPago posts the payment id
    (as a query param and/or JSON body); we re-fetch the payment server-side to
    confirm it is genuinely 'approved' before granting anything, then fulfill the
    order from the payment's metadata (idempotent via recorded payment ids).
    """
    if not settings.mercadopago_enabled:
        return {"received": True}

    params = dict(request.query_params)
    topic = params.get("type") or params.get("topic")
    payment_id = params.get("data.id") or params.get("id")
    if not payment_id:
        try:
            body = await request.json()
            payment_id = (body.get("data") or {}).get("id") or body.get("id")
            topic = topic or body.get("type") or body.get("action")
        except Exception:
            pass

    # Ignore non-payment topics (e.g. merchant_order) — only payments fulfill.
    if topic and "payment" not in str(topic):
        return {"received": True}
    if not payment_id:
        return {"received": True}

    try:
        payment = await mercadopago_service.get_payment(str(payment_id))
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Could not verify payment")

    if payment.get("status") != "approved":
        return {"received": True}

    meta = payment.get("metadata") or {}
    # MercadoPago lowercases/snake_cases metadata keys; external_reference is our fallback.
    user_id = meta.get("user_id") or meta.get("userId") or payment.get("external_reference")
    if not user_id:
        return {"received": True}
    user = await db.get(User, user_id)
    if not user:
        return {"received": True}

    await _fulfill(
        db, user,
        kind=meta.get("kind"),
        credits=meta.get("credits"),
        plan_id=meta.get("plan_id") or meta.get("planId"),
        payment_id=str(payment_id),
    )
    return {"received": True}
