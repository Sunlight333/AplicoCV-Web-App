from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_current_user, subscription_expires_at
from app.models import User
from app import pricing
from app.schemas import CheckoutInput, CheckoutOut, PlanOut, ReconcileOut
from app.services import credit_service, lemonsqueezy_service, mercadopago_service

try:  # Stripe SDK is optional — billing falls back to a stub without it.
    import stripe  # type: ignore
except ImportError:  # pragma: no cover
    stripe = None

router = APIRouter(prefix="/billing", tags=["billing"])

# Payment observability. Every step of a real purchase is logged to the systemd journal,
# so a payment that fails can be diagnosed after the fact — we cannot predict when a
# customer will pay, and these paths used to fail silently and leave no trace.
#   journalctl -u aplicocv-api -f | grep aplicocv.payments
# Ids, events and statuses only — never card data, never full webhook payloads.
log = logging.getLogger("aplicocv.payments")

# Plan catalogue (Enfoque 2.0): subscription‑only, two paid tiers, no free tier and
# no credit packs. Every paid plan unlocks the full product. Prices come from
# app.pricing (USD base) and are shared with the frontend via GET /plans.
_PLANS: list[dict] = [
    {
        "id": "weekly", "name": "Weekly", "interval": "week",
        "credits": None, "kind": "subscription", "highlighted": False,
        "features": [
            "Full access to every feature",
            "Autonomous AI job search",
            "CV tailored to each job (ATS)",
            "AI mock interviews",
            "Cancel anytime",
        ],
    },
    {
        "id": "monthly", "name": "Monthly", "interval": "month",
        "credits": None, "kind": "subscription", "highlighted": True,
        "features": [
            "Everything in Weekly",
            "Best value",
            "Autonomous AI job search",
            "CV tailored to each job (ATS)",
            "AI mock interviews",
        ],
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


def _resolve_order(payment: dict) -> tuple[str | None, int | None, str | None]:
    """Work out what was bought (kind, credits, plan_id) from a MercadoPago payment.

    Prefers the preference metadata, but MercadoPago does NOT reliably copy
    preference metadata onto the payment object, so we fall back to identifying the
    plan by its amount — which the payment always reports and which is unique per
    plan/pack. This keeps fulfillment correct for both the webhook and reconcile."""
    meta = payment.get("metadata") or {}
    plan_id = meta.get("plan_id") or meta.get("planId")
    if plan_id:
        plan = next((p for p in _PLANS if p["id"] == plan_id), None)
        if plan:
            return plan["kind"], plan["credits"], plan["id"]

    amount = payment.get("transaction_amount")
    if amount is not None:
        currency = pricing.active_currency()
        for p in _PLANS:
            if p["id"] == "free":
                continue
            if round(pricing.price_in(p["id"], currency)) == round(float(amount)):
                return p["kind"], p["credits"], p["id"]

    # Last resort: honour explicit metadata even without a known plan.
    credits = meta.get("credits")
    return meta.get("kind"), (int(credits) if credits else None), plan_id


# How long each plan entitles the user to, once paid.
_PLAN_DAYS = {"weekly": 7, "monthly": 30}

# Hints that a payer is in Latin America, from the region/location intake we already
# collect. Kept lowercase and accent-free; matched as substrings.
_LATAM_PAYER_HINTS = (
    "latam", "latin", "south_america", "south america", "sudamerica", "latinoamerica",
    "chile", "argentina", "brasil", "brazil", "mexico", "colombia", "peru", "uruguay",
    "bolivia", "paraguay", "ecuador", "venezuela", "costa rica", "panama", "guatemala",
    "santiago", "buenos aires", "bogota", "lima", "sao paulo", "cdmx",
)


def _is_latam_payer(user: User) -> bool:
    """Best available signal for where this user pays from.

    We have no billing-country field, so we reuse the region/location intake the user
    already gave (plus an explicit billingCountry if one is ever set). Only used to
    pick a rail; it never changes what they're charged in USD terms.
    """
    prefs = user.preferences or {}
    explicit = str(prefs.get("billingCountry") or "").strip().lower()
    if explicit:
        return any(h in explicit for h in _LATAM_PAYER_HINTS)
    blob = " ".join(
        [
            *(prefs.get("locations") or []),
            *(prefs.get("remoteRegions") or []),
            *(prefs.get("onsiteLocations") or []),
            str(prefs.get("country") or ""),
        ]
    ).lower()
    return any(h in blob for h in _LATAM_PAYER_HINTS)


def _provider_for(user: User) -> str:
    """Which rail bills THIS user.

    Provider choice used to be a global switch, so enabling Lemon Squeezy for the USA
    would have pushed every LATAM user to USD and made MercadoPago dead code. The
    client needs both at once: MercadoPago (local currency) for LATAM, an MoR rail for
    the USA. With only one rail configured we simply use it.
    """
    ls, mp = settings.lemonsqueezy_enabled, settings.mercadopago_enabled
    if ls and mp:
        return "mercadopago" if _is_latam_payer(user) else "lemonsqueezy"
    if ls:
        return "lemonsqueezy"
    if mp:
        return "mercadopago"
    if settings.stripe_enabled:
        return "stripe"
    return "stub"


def _grant_period(user: User, plan_id: str | None, *, days: int | None = None) -> None:
    """Grant premium for ONE paid period, extending from whatever is left.

    Every payment path funnels through here so premium always carries an end date.
    Previously `user.plan = "premium"` was set with no expiry anywhere, so a single
    one-off MercadoPago charge bought premium permanently and the weekly/monthly
    distinction was decorative. Renewals extend from the current expiry (not from
    "now"), so paying early never silently burns the days already bought.
    """
    span = days if days is not None else _PLAN_DAYS.get(plan_id or "", 30)
    now = datetime.now(timezone.utc)
    current = subscription_expires_at(user)
    base = current if (current and current > now) else now
    prefs = dict(user.preferences or {})
    if plan_id:
        prefs["planId"] = plan_id
    prefs["planExpiresAt"] = (base + timedelta(days=span)).isoformat()
    user.plan = "premium"
    user.preferences = prefs  # reassign so SQLAlchemy detects the JSON change


async def _fulfill(
    db: AsyncSession, user: User, kind: str | None, credits: int | None,
    plan_id: str | None, payment_id: str,
) -> bool:
    """Apply a paid order exactly once. The processed payment ids are recorded in
    the CreditAccount.grants JSON (migration-free) so webhook retries don't double-grant.
    Returns True if this call actually applied the order (False if already processed)."""
    acc = await credit_service.get_account(db, user.id)
    processed = list((acc.grants or {}).get("mp_payments") or [])
    if payment_id in processed:
        return False
    if kind == "credits" and credits:
        # grant_pending (no commit) so the balance change and the payment-id record
        # land in ONE transaction — otherwise a crash between them double-grants on retry.
        credit_service.grant_pending(db, acc, int(credits), f"purchase_{plan_id or 'credits'}")
    else:
        _grant_period(user, plan_id)
    grants = dict(acc.grants or {})
    grants["mp_payments"] = processed + [payment_id]
    acc.grants = grants  # reassign so SQLAlchemy detects the JSON change
    await db.commit()
    return True


@router.get("/plans", response_model=list[PlanOut])
async def plans(user: User = Depends(get_current_user)) -> list[PlanOut]:
    """The two subscription plans for the Plans screen. Prices are shown in the currency
    of the rail that will actually bill THIS user — LATAM payers see local currency via
    MercadoPago, everyone else USD via Lemon Squeezy — so the price on screen matches the
    price charged. `current` marks the plan the subscriber is on."""
    current_id = (user.preferences or {}).get("planId") if user.plan == "premium" else None
    currency = pricing.currency_for_provider(_provider_for(user))
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


@router.post("/checkout", response_model=CheckoutOut)
async def checkout(
    body: CheckoutInput = CheckoutInput(),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckoutOut:
    """
    Start a recurring subscription for the chosen plan (`weekly` or `monthly`).

    The rail is chosen PER USER (see _provider_for): LATAM payers go to MercadoPago in
    local currency, everyone else to Lemon Squeezy (Merchant of Record) in USD, so both
    markets can be served at the same time.
    """
    plan = next(
        (p for p in _PLANS if p["id"] == body.plan and p["kind"] == "subscription"),
        None,
    )
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Unknown subscription plan.")

    provider = _provider_for(user)
    # A purchase starts here: record who, which plan and which rail, so a payment that
    # never completes can be traced back to its checkout.
    log.info("checkout START user=%s plan=%s provider=%s", user.id, plan["id"], provider)

    if provider == "lemonsqueezy":
        variant = lemonsqueezy_service.variant_for(plan["id"])
        if not variant:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail=f"No Lemon Squeezy variant configured for the {plan['id']} plan.",
            )
        try:
            url = await lemonsqueezy_service.create_checkout(
                variant_id=variant,
                email=user.email,
                user_id=user.id,
                plan_id=plan["id"],
                success_url=f"{settings.frontend_url}/settings/billing?upgraded=1",
            )
        except Exception:
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY, detail="Could not start Lemon Squeezy checkout."
            )
        log.info("checkout OK user=%s plan=%s provider=lemonsqueezy variant=%s", user.id, plan["id"], variant)
        return CheckoutOut(url=url)

    if provider == "mercadopago":
        # Recurring subscription (Preapproval) — NOT one-off Checkout Pro. The plans are
        # sold as weekly/monthly with automatic renewal; a Checkout Pro preference charges
        # once, which previously granted premium forever for a single payment.
        currency = pricing.currency_for_provider("mercadopago")
        try:
            url, preapproval_id = await mercadopago_service.create_preapproval(
                plan_id=plan["id"],
                reason=f"AplicoCV {plan['name']}",
                amount=pricing.price_in(plan["id"], currency),
                currency_id=currency,
                payer_email=user.email,
                external_reference=user.id,
                back_url=f"{settings.frontend_url}/settings/billing?upgraded=1",
            )
        except Exception:
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY, detail="Could not start the MercadoPago subscription."
            )
        # Remember the subscription id so the webhook can verify it and the user can
        # cancel it later. Access is granted only once MercadoPago confirms it.
        user.preferences = {
            **(user.preferences or {}),
            "mpPreapprovalId": preapproval_id,
            "planId": plan["id"],
            "subProvider": "mercadopago",
        }
        await db.commit()
        log.info("checkout OK user=%s plan=%s provider=mercadopago pref=%s", user.id, plan["id"], preapproval_id)
        return CheckoutOut(url=url)

    if provider == "stub":
        # Dev/demo stub: no provider configured, so nothing was charged. Still grant a
        # BOUNDED period — an unbounded grant here would hand out permanent premium for
        # free if this were ever reached with every provider unset.
        _grant_period(user, plan["id"])
        await db.commit()
        return CheckoutOut(url=f"{settings.frontend_url}/settings/billing?upgraded=1")

    s = _stripe()
    # Build a recurring price_data for the selected plan so the weekly/monthly tier
    # charges the right amount and interval. (Stripe is disabled in this project;
    # Lemon Squeezy is the worldwide rail — see the Lemon Squeezy provider.)
    currency = pricing.active_currency()
    price = pricing.price_in(plan["id"], currency)
    unit_amount = int(round(price)) if pricing.is_zero_decimal(currency) else int(round(price * 100))
    interval = plan["interval"] if plan["interval"] in ("week", "month", "year") else "month"
    if settings.stripe_price_id and interval == "month":
        line_item: dict = {"price": settings.stripe_price_id, "quantity": 1}
    else:
        line_item = {
            "price_data": {
                "currency": currency.lower(),
                "product_data": {"name": f"AplicoCV {plan['name']}"},
                "unit_amount": unit_amount,
                "recurring": {"interval": interval},
            },
            "quantity": 1,
        }
    session = s.checkout.Session.create(
        mode="subscription",
        line_items=[line_item],
        client_reference_id=user.id,
        customer_email=user.email,
        metadata={"userId": user.id, "plan_id": plan["id"]},
        success_url=f"{settings.frontend_url}/settings/billing?upgraded=1",
        cancel_url=f"{settings.frontend_url}/settings/billing?canceled=1",
    )
    return CheckoutOut(url=session.url)


@router.post("/portal", response_model=CheckoutOut)
async def customer_portal(user: User = Depends(get_current_user)) -> CheckoutOut:
    """Manage-subscription link. Lemon Squeezy provides a per-subscriber customer
    portal URL (captured from its webhook); otherwise fall back to Stripe's portal."""
    # Lemon Squeezy: return the customer-portal URL saved from the subscription webhook.
    ls_portal = (user.preferences or {}).get("lsPortalUrl")
    if settings.lemonsqueezy_enabled and ls_portal:
        return CheckoutOut(url=ls_portal)

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
        event_id = event.get("id") or obj.get("id")
        if user_id:
            user = await db.get(User, user_id)
            if user:
                # Idempotency: Stripe re-delivers events on any non-2xx/retry, so
                # record processed event ids (mirrors the MercadoPago _fulfill guard)
                # to avoid double-granting credits or re-applying the upgrade.
                acc = await credit_service.get_account(db, user_id)
                processed = list((acc.grants or {}).get("stripe_events") or [])
                if event_id and event_id in processed:
                    return {"received": True}
                if obj.get("mode") == "payment" and meta.get("credits"):
                    # One-off credit-pack purchase — top up the balance. grant_pending
                    # (no commit) so the grant + event-id record commit atomically below,
                    # so a crash between them can't let a Stripe retry double-grant.
                    credit_service.grant_pending(
                        db, acc, int(meta["credits"]), "purchase_credits"
                    )
                else:
                    _grant_period(user, meta.get("plan_id"))
                    if customer_id:
                        user.preferences = {
                            **(user.preferences or {}), "stripeCustomerId": customer_id
                        }
                if event_id:
                    grants = dict(acc.grants or {})
                    grants["stripe_events"] = processed + [event_id]
                    acc.grants = grants  # reassign so SQLAlchemy detects the JSON change
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

    topic_s = str(topic or "")

    # --- Recurring subscription lifecycle (Preapproval) ----------------------
    # These topics carry a SUBSCRIPTION id, not a payment id, so they must be handled
    # before the payment path (which would otherwise call /v1/payments with the wrong
    # id). Everything is re-fetched from MercadoPago — never trust the notification.
    if "subscription_preapproval" in topic_s:
        if not payment_id:
            return {"received": True}
        try:
            sub = await mercadopago_service.get_preapproval(str(payment_id))
        except Exception:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Could not verify subscription")
        user = await db.get(User, sub.get("external_reference") or "")
        if not user:
            return {"received": True}
        sub_status = sub.get("status")
        if sub_status == "authorized":
            # First authorisation: the payer approved the recurrence.
            _grant_period(user, (user.preferences or {}).get("planId"))
            await db.commit()
        elif sub_status in {"cancelled", "paused"}:
            # Do NOT revoke here: the period they already paid for runs to its end, and
            # premium_active() lapses on planExpiresAt. We only stop the renewal.
            user.preferences = {**(user.preferences or {}), "mpSubStatus": sub_status}
            await db.commit()
        return {"received": True}

    if "subscription_authorized_payment" in topic_s:
        # One recurring charge against a subscription — i.e. a renewal.
        if not payment_id:
            return {"received": True}
        try:
            charge = await mercadopago_service.get_authorized_payment(str(payment_id))
        except Exception:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Could not verify renewal")
        if charge.get("status") not in {"processed", "approved"}:
            return {"received": True}
        try:
            sub = await mercadopago_service.get_preapproval(str(charge.get("preapproval_id") or ""))
        except Exception:
            return {"received": True}
        user = await db.get(User, sub.get("external_reference") or "")
        if not user:
            return {"received": True}
        # Idempotent: each renewal charge id is recorded once (webhooks retry).
        acc = await credit_service.get_account(db, user.id)
        processed_r = list((acc.grants or {}).get("mp_payments") or [])
        if str(payment_id) in processed_r:
            return {"received": True}
        _grant_period(user, (user.preferences or {}).get("planId"))
        grants = dict(acc.grants or {})
        grants["mp_payments"] = processed_r + [str(payment_id)]
        acc.grants = grants
        await db.commit()
        return {"received": True}

    # Ignore other non-payment topics (e.g. merchant_order) — only payments fulfill.
    if topic and "payment" not in topic_s:
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
        log.error("MP webhook: no user_id/external_reference — CANNOT fulfil this payment")
        return {"received": True}
    user = await db.get(User, user_id)
    if not user:
        return {"received": True}

    kind, credits, plan_id = _resolve_order(payment)
    await _fulfill(
        db, user, kind=kind, credits=credits, plan_id=plan_id, payment_id=str(payment_id),
    )
    return {"received": True}


@router.post("/reconcile", response_model=ReconcileOut)
async def reconcile(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> ReconcileOut:
    """Fallback fulfillment for when MercadoPago's asynchronous webhook never reached
    us (an unreachable notification_url is a common cause): poll the buyer's recent
    payments and apply any approved order not yet fulfilled. Safe to call on every
    return to the billing page — idempotent via the recorded payment ids."""
    if not settings.mercadopago_enabled:
        return ReconcileOut(fulfilled=0)
    try:
        payments = await mercadopago_service.search_payments(str(user.id))
    except Exception:
        return ReconcileOut(fulfilled=0)

    fulfilled = 0
    for payment in payments:
        if payment.get("status") != "approved":
            continue
        kind, credits, plan_id = _resolve_order(payment)
        if await _fulfill(
            db, user, kind=kind, credits=credits,
            plan_id=plan_id, payment_id=str(payment.get("id")),
        ):
            fulfilled += 1
    return ReconcileOut(fulfilled=fulfilled)


# Lemon Squeezy subscription lifecycle → our plan tier. Subscriptions are idempotent
# (we just set premium/free), so no per-event dedup is needed.
#
# Lemon Squeezy semantics that matter here:
#  - "cancelled" means WILL NOT RENEW — the subscription stays usable until ends_at.
#    Revoking then would take away access the user has already paid for, so we don't:
#    we wait for "expired", which LS sends when the paid period actually ends.
#  - "paused" means billing is paused and access should stop (it is NOT an active
#    status — previously it was listed as both active and inactive, and active won).
_LS_ACTIVE_EVENTS = {"subscription_created", "subscription_updated", "subscription_payment_success", "subscription_resumed"}
_LS_INACTIVE_EVENTS = {"subscription_expired", "subscription_paused"}
# "past_due" keeps access during LS's dunning retries; it becomes unpaid/expired if
# the retries ultimately fail, and those do revoke.
_LS_ACTIVE_STATUS = {"active", "on_trial", "cancelled", "past_due"}
_LS_INACTIVE_STATUS = {"expired", "unpaid", "paused"}


@router.post("/lemonsqueezy/webhook")
async def lemonsqueezy_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_signature: str | None = Header(default=None, alias="X-Signature"),
) -> dict[str, bool]:
    """Handle Lemon Squeezy subscription events. Verifies the HMAC signature, then
    upgrades/downgrades the user identified by the checkout's custom user_id."""
    payload = await request.body()
    if not settings.lemonsqueezy_enabled:
        log.warning("LS webhook arrived but Lemon Squeezy is disabled — ignored")
        return {"received": True}
    if not lemonsqueezy_service.verify_signature(payload, x_signature):
        log.error(
            "LS webhook REJECTED: bad signature (header_present=%s). "
            "LEMONSQUEEZY_WEBHOOK_SECRET must match the dashboard exactly.",
            bool(x_signature),
        )
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    body = json.loads(payload)
    meta = body.get("meta") or {}
    event = meta.get("event_name")
    custom = meta.get("custom_data") or {}
    user_id = custom.get("user_id") or custom.get("userId")
    plan_id = custom.get("plan_id") or custom.get("planId")
    status_ = ((body.get("data") or {}).get("attributes") or {}).get("status")
    log.info("LS webhook: event=%s status=%s user=%s plan=%s", event, status_, user_id, plan_id)
    if not user_id:
        log.error("LS webhook: no user_id in custom_data — CANNOT fulfil this payment (event=%s)", event)
        return {"received": True}
    user = await db.get(User, user_id)
    if not user:
        log.error("LS webhook: user %s not found — payment NOT fulfilled (event=%s)", user_id, event)
        return {"received": True}

    attrs = (body.get("data") or {}).get("attributes") or {}
    portal_url = ((attrs.get("urls") or {}).get("customer_portal")) if isinstance(attrs.get("urls"), dict) else None

    if event in _LS_ACTIVE_EVENTS and (status_ in _LS_ACTIVE_STATUS or status_ is None):
        _grant_period(user, plan_id or (user.preferences or {}).get("planId"))
        prefs = dict(user.preferences or {})
        if portal_url:
            prefs["lsPortalUrl"] = portal_url
        prefs["subProvider"] = "lemonsqueezy"
        # Lemon Squeezy is authoritative about when this period ends — prefer its own
        # renews_at (next charge) or ends_at (set once cancelled) over our plan-length
        # estimate, so our access window always matches what they actually bill.
        ls_end = attrs.get("renews_at") or attrs.get("ends_at")
        if ls_end:
            try:
                dt = datetime.fromisoformat(str(ls_end).replace("Z", "+00:00"))
                prefs["planExpiresAt"] = (dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)).isoformat()
            except (TypeError, ValueError):
                pass  # keep the _grant_period estimate
        user.preferences = prefs
        await db.commit()
        log.info(
            "LS webhook: ACCESS GRANTED user=%s plan=%s expires=%s (event=%s)",
            user_id, plan_id, prefs.get("planExpiresAt"), event,
        )
    elif event in _LS_INACTIVE_EVENTS or status_ in _LS_INACTIVE_STATUS:
        user.plan = "free"
        await db.commit()
        log.info("LS webhook: ACCESS REVOKED user=%s (event=%s status=%s)", user_id, event, status_)

    return {"received": True}
