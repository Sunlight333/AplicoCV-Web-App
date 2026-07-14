"""
Catalogue pricing (Enfoque 2.0).

The product is subscription‑only, priced in USD:

  weekly    USD  9 / week
  monthly   USD 17 / month   (best value)

USD is the base and is exact. For LATAM payers charged in local currency through
MercadoPago, the USD price is converted at runtime with the approximate rates
below (keep them roughly current). The USA / worldwide rail (Lemon Squeezy) always
charges the exact USD amount.
"""

from __future__ import annotations

from app.config import settings

# --- Base prices, in USD (the standard) --------------------------------------
BASE_USD: dict[str, float] = {
    "weekly": 9.0,
    "monthly": 17.0,
}

# --- Currency conversion ------------------------------------------------------
# Units of each currency per ONE US dollar (approximate; keep roughly current).
# USD is exact. Covers the MercadoPago LATAM site currencies. Add a row to support
# another currency.
PER_USD: dict[str, float] = {
    "USD": 1.0,        # base (Lemon Squeezy / worldwide)
    "CLP": 950.0,      # Chile
    "ARS": 1180.0,     # Argentina
    "BRL": 5.4,        # Brazil
    "MXN": 18.0,       # Mexico
    "COP": 4000.0,     # Colombia
    "PEN": 3.8,        # Peru
    "UYU": 40.0,       # Uruguay
}

# Currencies charged as whole units (no decimal cents). Only currencies with a
# conversion rate above belong here.
ZERO_DECIMAL: set[str] = {"CLP", "COP", "ARS"}

# Rounding step for whole-unit currencies, to keep prices tidy after conversion.
_ROUND_STEP: dict[str, int] = {"CLP": 10, "ARS": 10, "COP": 100}


def supported_currencies() -> list[str]:
    return sorted(PER_USD)


def active_currency() -> str:
    """The local currency for the MercadoPago (LATAM) rail; defaults to CLP.

    Falls back to CLP if the configured currency has no conversion rate, so a
    misconfigured MERCADOPAGO_CURRENCY can never send an unconverted amount to the
    payment provider. The Lemon Squeezy / worldwide rail charges USD explicitly and
    does not depend on this."""
    cur = (settings.mercadopago_currency or "CLP").upper()
    return cur if cur in PER_USD else "CLP"


def is_zero_decimal(currency: str) -> bool:
    return currency.upper() in ZERO_DECIMAL


def _round(amount: float, currency: str) -> float:
    cur = currency.upper()
    if cur in ZERO_DECIMAL:
        step = _ROUND_STEP.get(cur, 1)
        return float(int(round(amount / step)) * step)
    return round(amount, 2)


def convert(amount_usd: float, currency: str) -> float:
    """Convert a USD amount to `currency`. Exact for USD; rounded sensibly otherwise.
    Unknown currencies fall back to the USD amount so a price is never zero."""
    cur = currency.upper()
    if cur == "USD" or amount_usd == 0:
        return float(amount_usd)
    rate = PER_USD.get(cur)
    if not rate:
        return float(amount_usd)
    return _round(amount_usd * rate, cur)


def price_in(plan_id: str, currency: str | None = None) -> float:
    """Catalogue price of a plan in the given (or active LATAM) currency."""
    base = BASE_USD.get(plan_id, 0.0)
    return convert(base, currency or active_currency())
