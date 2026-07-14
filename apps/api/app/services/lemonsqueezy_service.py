"""
Lemon Squeezy integration (Merchant of Record — the USD / worldwide rail).

Key‑ready like the other integrations: with LEMONSQUEEZY_API_KEY + store + variant
ids set, `create_checkout` builds a hosted checkout for a subscription variant and
returns its URL, and the billing webhook verifies + fulfills the resulting
subscription. With no key, the billing router never calls these and falls back to
MercadoPago or the stub.

Docs: https://docs.lemonsqueezy.com/api
"""

from __future__ import annotations

import hashlib
import hmac

import httpx

from app.config import settings

API = "https://api.lemonsqueezy.com/v1"


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.lemonsqueezy_api_key}",
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
    }


def variant_for(plan_id: str) -> str:
    """Map our plan id to the configured Lemon Squeezy variant id."""
    return {
        "weekly": settings.lemonsqueezy_variant_weekly,
        "monthly": settings.lemonsqueezy_variant_monthly,
    }.get(plan_id, "")


async def create_checkout(
    *, variant_id: str, email: str, user_id: str, plan_id: str,
    success_url: str,
) -> str:
    """Create a hosted checkout for a subscription variant and return its URL.

    `user_id` and `plan_id` are stashed in `checkout_data.custom` so the webhook can
    fulfill the right account/plan — Lemon Squeezy echoes them back in
    `meta.custom_data` on every event for this subscription."""
    body = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "checkout_data": {
                    "email": email,
                    "custom": {"user_id": user_id, "plan_id": plan_id},
                },
                "product_options": {"redirect_url": success_url},
            },
            "relationships": {
                "store": {
                    "data": {"type": "stores", "id": str(settings.lemonsqueezy_store_id)}
                },
                "variant": {
                    "data": {"type": "variants", "id": str(variant_id)}
                },
            },
        }
    }
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(f"{API}/checkouts", json=body, headers=_headers())
        res.raise_for_status()
        data = res.json()
    return data.get("data", {}).get("attributes", {}).get("url", "")


def verify_signature(payload: bytes, signature: str | None) -> bool:
    """Verify a webhook came from Lemon Squeezy (HMAC‑SHA256 of the raw body with the
    signing secret, compared to the hex `X-Signature` header)."""
    secret = settings.lemonsqueezy_webhook_secret
    if not secret or not signature:
        return False
    digest = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, signature)
