"""Billing regressions from the Oct 2026 launch weekend, when nobody could pay:

- /billing/plans and /billing/checkout returned 500 for anyone with an on-site city,
  because the LATAM detector string-joined {city, citizenship} objects.
- A revoked Lemon Squeezy API key turned every checkout into a 502 with no fallback,
  even though MercadoPago was configured and working.

No test here talks to a real provider: rails are enabled with dummy keys and the
service calls are replaced.
"""
from types import SimpleNamespace

import httpx
import pytest

from app.config import settings
from app.routers import billing
from app.services import lemonsqueezy_service, mercadopago_service

MP_URL = "https://www.mercadopago.cl/subscriptions/checkout?preapproval_id=pre_123"
LS_URL = "https://aplicocv.lemonsqueezy.com/checkout/custom/abc"


@pytest.fixture
def both_rails(monkeypatch):
    monkeypatch.setattr(settings, "lemonsqueezy_api_key", "ls-dummy")
    monkeypatch.setattr(settings, "lemonsqueezy_store_id", "1")
    monkeypatch.setattr(settings, "lemonsqueezy_variant_weekly", "11")
    monkeypatch.setattr(settings, "lemonsqueezy_variant_monthly", "12")
    monkeypatch.setattr(settings, "mercadopago_access_token", "mp-dummy")


def _http_error(code: int, body: str) -> httpx.HTTPStatusError:
    req = httpx.Request("POST", "https://provider.test")
    return httpx.HTTPStatusError(
        f"{code}", request=req, response=httpx.Response(code, text=body, request=req)
    )


def _mock_rails(monkeypatch, *, ls_fails=False, mp_fails=False):
    calls: list[str] = []

    async def ls_checkout(**_):
        calls.append("lemonsqueezy")
        if ls_fails:
            raise _http_error(401, '{"errors":[{"detail":"Unauthenticated."}]}')
        return LS_URL

    async def mp_preapproval(**_):
        calls.append("mercadopago")
        if mp_fails:
            raise _http_error(400, '{"message":"rejected"}')
        return MP_URL, "pre_123"

    monkeypatch.setattr(lemonsqueezy_service, "create_checkout", ls_checkout)
    monkeypatch.setattr(mercadopago_service, "create_preapproval", mp_preapproval)
    return calls


def test_latam_payer_reads_onsite_city_objects():
    chile = SimpleNamespace(preferences={
        "onsiteLocations": [{"city": "Santiago, Chile", "citizenship": "citizen"}],
    })
    usa = SimpleNamespace(preferences={
        "onsiteLocations": [{"city": "Austin, TX", "citizenship": None}],
        "remoteRegions": ["North America"],
    })
    assert billing._is_latam_payer(chile) is True
    assert billing._is_latam_payer(usa) is False


@pytest.mark.asyncio
async def test_plans_ok_for_onsite_seeker(auth_client, both_rails):
    res = await auth_client.patch(
        "/api/users/me/preferences",
        json={"onsiteLocations": [{"city": "Santiago, Chile", "citizenship": "citizen"}]},
    )
    assert res.status_code == 200, res.text
    res = await auth_client.get("/api/billing/plans")
    assert res.status_code == 200, res.text
    assert {p["currency"] for p in res.json()} == {"CLP"}  # routed to MercadoPago


@pytest.mark.asyncio
async def test_checkout_falls_back_to_mercadopago_when_lemonsqueezy_fails(
    auth_client, both_rails, monkeypatch
):
    calls = _mock_rails(monkeypatch, ls_fails=True)
    res = await auth_client.post("/api/billing/checkout", json={"plan": "monthly"})
    assert res.status_code == 200, res.text
    assert res.json()["url"] == MP_URL
    assert calls == ["lemonsqueezy", "mercadopago"]


@pytest.mark.asyncio
async def test_checkout_uses_preferred_rail_when_it_works(auth_client, both_rails, monkeypatch):
    calls = _mock_rails(monkeypatch)
    res = await auth_client.post("/api/billing/checkout", json={"plan": "weekly"})
    assert res.status_code == 200, res.text
    assert res.json()["url"] == LS_URL
    assert calls == ["lemonsqueezy"]


@pytest.mark.asyncio
async def test_checkout_502_only_when_every_rail_fails(auth_client, both_rails, monkeypatch):
    calls = _mock_rails(monkeypatch, ls_fails=True, mp_fails=True)
    res = await auth_client.post("/api/billing/checkout", json={"plan": "monthly"})
    assert res.status_code == 502
    assert calls == ["lemonsqueezy", "mercadopago"]


@pytest.mark.asyncio
async def test_saving_preferences_keeps_the_subscription_expiry(auth_client):
    # No provider configured -> the stub grants one bounded weekly period.
    res = await auth_client.post("/api/billing/checkout", json={"plan": "weekly"})
    assert res.status_code == 200, res.text
    res = await auth_client.patch("/api/users/me/preferences", json={"locations": ["Lima"]})
    assert res.status_code == 200, res.text
    res = await auth_client.get("/api/billing/plans")
    assert [p["id"] for p in res.json() if p["current"]] == ["weekly"]  # planId survived

    from app.db import SessionLocal  # noqa: PLC0415
    from app.models import User  # noqa: PLC0415
    from sqlalchemy import select  # noqa: PLC0415

    async with SessionLocal() as db:
        user = (await db.execute(select(User).where(User.email == "test@example.com"))).scalar_one()
        assert user.preferences.get("planExpiresAt"), "saving preferences wiped the paid period"
        assert user.preferences.get("locations") == ["Lima"]
