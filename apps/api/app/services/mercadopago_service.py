"""
MercadoPago Checkout Pro integration (preferred payment provider for LATAM).

Key-ready, like the rest of the integrations: with MERCADOPAGO_ACCESS_TOKEN set,
`create_preference` builds a hosted checkout and returns its redirect URL, and the
billing webhook verifies the resulting payment with `get_payment`. With no token,
the billing router never calls these and falls back to Stripe or the stub.
"""

from __future__ import annotations

import httpx

from app.config import settings

API = "https://api.mercadopago.com"


def _headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.mercadopago_access_token}"}


async def create_preference(
    *,
    items: list[dict],
    payer_email: str,
    external_reference: str,
    metadata: dict,
    back_urls: dict,
    notification_url: str,
) -> str:
    """Create a Checkout Pro preference and return the URL to redirect the user to."""
    body = {
        "items": items,
        "payer": {"email": payer_email},
        "back_urls": back_urls,
        "auto_return": "approved",
        "external_reference": external_reference,
        "metadata": metadata,
        "notification_url": notification_url,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(f"{API}/checkout/preferences", json=body, headers=_headers())
        res.raise_for_status()
        data = res.json()
    # Live tokens return init_point; TEST- tokens only return sandbox_init_point.
    return data.get("init_point") or data.get("sandbox_init_point") or ""


# --- Recurring subscriptions (Preapproval) -----------------------------------
# Checkout Pro (above) charges ONCE. Recurring billing is a different API:
# /preapproval, which asks the payer to authorise repeating charges. MercadoPago
# expresses the cycle as frequency + frequency_type, and only "days" and "months"
# are supported — so a weekly plan is 7 days, not 1 "week".
_RECURRENCE = {
    "weekly": (7, "days"),
    "monthly": (1, "months"),
}


async def create_preapproval(
    *,
    plan_id: str,
    reason: str,
    amount: float,
    currency_id: str,
    payer_email: str,
    external_reference: str,
    back_url: str,
) -> tuple[str, str]:
    """Create a recurring subscription and return (init_point, preapproval_id).

    The payer authorises the recurrence at init_point; MercadoPago then charges on
    its own schedule and notifies us via the subscription webhooks.
    """
    frequency, frequency_type = _RECURRENCE.get(plan_id, (1, "months"))
    body = {
        "reason": reason,
        "external_reference": external_reference,
        "payer_email": payer_email,
        "back_url": back_url,
        "status": "pending",  # becomes "authorized" once the payer approves
        "auto_recurring": {
            "frequency": frequency,
            "frequency_type": frequency_type,
            "transaction_amount": float(amount),
            "currency_id": currency_id,
        },
    }
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(f"{API}/preapproval", json=body, headers=_headers())
        res.raise_for_status()
        data = res.json()
    return (data.get("init_point") or data.get("sandbox_init_point") or "", str(data.get("id") or ""))


async def get_preapproval(preapproval_id: str) -> dict:
    """Fetch a subscription so the webhook can verify its real status server-side
    (never trust the notification body)."""
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(f"{API}/preapproval/{preapproval_id}", headers=_headers())
        res.raise_for_status()
        return res.json()


async def get_authorized_payment(authorized_payment_id: str) -> dict:
    """Fetch one recurring charge made against a subscription. MercadoPago sends these
    as the `subscription_authorized_payment` topic; the body carries the charge id, and
    this resolves it to {preapproval_id, status, ...} so a renewal can be verified
    server-side before we extend access."""
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(f"{API}/authorized_payments/{authorized_payment_id}", headers=_headers())
        res.raise_for_status()
        return res.json()


async def cancel_preapproval(preapproval_id: str) -> dict:
    """Cancel a recurring subscription (used by the manage/cancel action)."""
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.put(
            f"{API}/preapproval/{preapproval_id}", json={"status": "cancelled"}, headers=_headers()
        )
        res.raise_for_status()
        return res.json()


async def get_payment(payment_id: str) -> dict:
    """Fetch a payment so the webhook can verify it was actually approved."""
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(f"{API}/v1/payments/{payment_id}", headers=_headers())
        res.raise_for_status()
        return res.json()


async def search_payments(external_reference: str) -> list[dict]:
    """List a buyer's payments by our external_reference (the user id). Used to
    reconcile a paid order when the asynchronous webhook never arrived (e.g. an
    unreachable notification_url) — we poll MercadoPago instead of waiting on it."""
    params = {
        "external_reference": external_reference,
        "sort": "date_created",
        "criteria": "desc",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(f"{API}/v1/payments/search", params=params, headers=_headers())
        res.raise_for_status()
        return res.json().get("results", []) or []
