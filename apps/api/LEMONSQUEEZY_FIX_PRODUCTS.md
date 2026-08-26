# Lemon Squeezy — how to finish the setup (activation guide)

**Verified live against the Lemon Squeezy API: 2026‑08‑10.**
Store: **AplicoCV** (`427133`) · CLP · Chile.

This is the actionable guide. The long-form reference is `LEMONSQUEEZY_SETUP.md`.

---

## Where it stands today

**Working already — do not touch:**

- ✅ **API key** — authenticates correctly.
- ✅ **Store ID** `427133`.
- ✅ **Webhook** — `https://aplicocv.com/api/billing/lemonsqueezy/webhook`, 7 subscription
  events configured.
- ✅ **All application code** — checkout, webhook fulfilment, auto-renew and the
  LATAM→MercadoPago / rest-of-world→Lemon Squeezy routing are built and deployed.

**Two things are blocking activation:**

| # | Issue | Whose action |
|---|---|---|
| 1 | The two products are **one-time / yearly / unpublished** | Client (dashboard) |
| 2 | Production `.env` has **no `LEMONSQUEEZY_*` keys at all** | Developer (after #1) |

Right now `/api/health` reports `"lemonsqueezy": false` and every payer is routed to
MercadoPago — so **customers outside LATAM cannot pay at all.**

---

## Issue 1 — the products (this is the real blocker)

Current state of both variants:

- `1953569` — "Default", 8 550.00, **is_subscription=false**, **interval=year**, **status=pending**
- `1953574` — "Default", 16 150.00, **is_subscription=false**, **interval=year**, **status=pending**

**Why this must be fixed first.** Lemon Squeezy only emits `subscription_created` /
`subscription_*` webhooks for **subscription** products, and those are the only events
AplicoCV fulfils on. As configured, a customer would **pay and never receive access**.
A `pending` product cannot be purchased at all.

### Fix — repeat for BOTH products

1. **Store → Products →** open the product.
2. **Pricing → Pricing type:** switch **Single payment** → **Subscription**
   ("Charge an ongoing fee"). *This single setting is the whole problem — the panel
   defaults to Single payment.*
3. **Billing interval:** Weekly → **every 1 week** · Monthly → **every 1 month**
   (both currently say *year*).
4. **Price:** keep `8550` / `16150` for CLP — or see the currency note below.
5. **Tax category:** `Software as a service (SaaS)`.
6. **Generate license keys:** OFF.
7. **Publish product** — the status must no longer be `pending`.

### ⚠️ Then re-copy BOTH variant IDs

Changing the pricing model usually makes Lemon Squeezy **issue new variant IDs**, so
`1953569` / `1953574` are probably stale afterwards. Open each product → its **Variant**
→ take the id from the URL, and send both back as:

```
LEMONSQUEEZY_VARIANT_WEEKLY=<new weekly id>
LEMONSQUEEZY_VARIANT_MONTHLY=<new monthly id>
```

Digits only — no `#`, no quotes. (The dashboard shows ids with a leading `#`; the API
rejects it. The app strips it defensively, but keep the values clean.)

---

## Issue 2 — production keys (developer step, only after Issue 1)

The five values exist in the **local** `.env` but the production server has none, so
nothing activates until they are added there:

```
LEMONSQUEEZY_API_KEY=<the key>
LEMONSQUEEZY_STORE_ID=427133
LEMONSQUEEZY_WEBHOOK_SECRET=<the signing secret>
LEMONSQUEEZY_VARIANT_WEEKLY=<weekly id>
LEMONSQUEEZY_VARIANT_MONTHLY=<monthly id>
```

Added to `/opt/aplicocv/api/.env` on the VPS, then `systemctl restart aplicocv-api`.

> **Deliberately not done yet.** There is no separate on/off switch: the moment the key,
> store and a variant exist, `lemonsqueezy_enabled` becomes true and **every non-LATAM
> customer is routed to Lemon Squeezy**. Doing that while the products are one-time and
> unpublished would send real buyers into a checkout that either fails or charges them
> without granting access. So this waits for Issue 1.

---

## Currency — one decision

The store is **CLP**, but this rail exists for the **USA / worldwide** market (LATAM
already goes to MercadoPago), and the app defaults its display currency to **USD**. Left
as-is the site would advertise USD while Lemon Squeezy charges CLP.

- **Option A (recommended):** Settings → Store → Currency → **USD**, price **9.00** /
  **17.00**. Matches the positioning of this payment rail.
- **Option B:** keep CLP; we add `LEMONSQUEEZY_CURRENCY=CLP` so the displayed price
  matches the charge exactly.

---

## Verification (developer, after both issues)

1. Re-query the API to confirm both variants report `is_subscription: true`, the correct
   weekly/monthly interval, and a published status.
2. Add the five keys to the production `.env` and restart.
3. Confirm `"lemonsqueezy": true` on `https://aplicocv.com/api/health`.
4. **One small real purchase** end to end — checkout → webhook → premium access granted
   → renewal date correct. This is the plan's own acceptance criterion and has never
   been run on either rail.

---

## Summary of what's needed

- **Client:** convert both products to weekly/monthly **Subscription**, **publish** them,
  send back the two variant IDs, and choose the currency option.
- **Developer:** add the five keys to production, restart, verify health, run one real
  test purchase.
