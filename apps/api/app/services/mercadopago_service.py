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


async def get_payment(payment_id: str) -> dict:
    """Fetch a payment so the webhook can verify it was actually approved."""
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(f"{API}/v1/payments/{payment_id}", headers=_headers())
        res.raise_for_status()
        return res.json()
