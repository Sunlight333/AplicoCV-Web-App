"""
Catalogue pricing.

Base prices are defined in Chilean pesos (CLP) — the recommended standard — and
converted to the configured charge currency at runtime, so any currency MercadoPago
supports can be used. The conversion rates below are approximate and meant to be
edited/kept current; CLP (and any currency you set explicitly) is exact.

Tiering (per credit, in CLP): larger packs are cheaper per credit, and Pro is the
best value — verified in the table below.

  pack_500   4.990 / 500   =  9.98 CLP / credit
  pack_1500 11.990 / 1500  =  7.99 CLP / credit
  pack_5000 29.990 / 5000  =  6.00 CLP / credit
  pro       6.990 / 1000   =  6.99 CLP / credit  (+ unlimited applications & perks)
  annual   69.900 / 12000  =  5.83 CLP / credit  (2 months free vs monthly)
"""

from __future__ import annotations

from app.config import settings

# --- Base prices, in CLP (the standard) --------------------------------------
BASE_CLP: dict[str, int] = {
    "free": 0,
    "pro_monthly": 6990,
    "pro_annual": 69900,
    "pack_500": 4990,
    "pack_1500": 11990,
    "pack_5000": 29990,
}

# --- Currency conversion ------------------------------------------------------
# Approximate value of ONE unit of each currency in CLP. Covers the MercadoPago
# site currencies plus USD. Keep these roughly current, or set the charge currency
# to CLP for exact prices. Add a row here to support any other currency.
CLP_PER_UNIT: dict[str, float] = {
    "CLP": 1.0,      # Chile (base)
    "USD": 950.0,    # US dollar (cross-border)
    "ARS": 0.80,     # Argentina
    "BRL": 170.0,    # Brazil
    "MXN": 52.0,     # Mexico
    "COP": 0.235,    # Colombia
    "PEN": 250.0,    # Peru
    "UYU": 24.0,     # Uruguay
}

# Currencies charged as whole units (no decimal cents).
ZERO_DECIMAL: set[str] = {"CLP", "COP", "ARS", "PYG"}

# Rounding step for whole-unit currencies, to keep prices tidy after conversion.
_ROUND_STEP: dict[str, int] = {"CLP": 10, "ARS": 10, "COP": 100, "PYG": 100}


def supported_currencies() -> list[str]:
    return sorted(CLP_PER_UNIT)


def active_currency() -> str:
    """The currency the catalogue is charged/displayed in (defaults to CLP)."""
    return (settings.mercadopago_currency or "CLP").upper()


def is_zero_decimal(currency: str) -> bool:
    return currency.upper() in ZERO_DECIMAL


def _round(amount: float, currency: str) -> float:
    cur = currency.upper()
    if cur in ZERO_DECIMAL:
        step = _ROUND_STEP.get(cur, 1)
        return float(int(round(amount / step)) * step)
    return round(amount, 2)


def convert(amount_clp: float, currency: str) -> float:
    """Convert a CLP amount to `currency`. Exact for CLP; rounded sensibly otherwise.
    Unknown currencies fall back to the CLP amount so a price is never zero."""
    cur = currency.upper()
    if cur == "CLP" or amount_clp == 0:
        return float(amount_clp)
    rate = CLP_PER_UNIT.get(cur)
    if not rate:
        return float(amount_clp)
    return _round(amount_clp / rate, cur)


def price_in(plan_id: str, currency: str | None = None) -> float:
    """Catalogue price of a plan/pack in the given (or active) currency."""
    base = BASE_CLP.get(plan_id, 0)
    return convert(base, currency or active_currency())
