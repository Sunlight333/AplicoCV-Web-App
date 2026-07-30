# Lemon Squeezy — Fix the two products (required before payments can go live)

**Store:** AplicoCV (`427133`) · **Verified against the Lemon Squeezy API:** 2026‑07‑27
**Time needed:** ~5 minutes in the Lemon Squeezy dashboard.

---

## 1. What's wrong

| | Weekly `1953569` | Monthly `1953574` |
|---|---|---|
| Price | 8 550 CLP ✅ | 16 150 CLP ✅ |
| `is_subscription` | **false** ❌ | **false** ❌ |
| Billing interval | **year** ❌ | **year** ❌ |
| Status | **pending** (unpublished) ❌ | **pending** ❌ |

Both products were created as **Single payment** (a one‑time purchase) instead of a
**Subscription**, and neither has been published.

## 2. Why it has to be fixed first

- Lemon Squeezy only sends `subscription_created` / `subscription_*` webhooks for
  **subscription** products — and those are the only events AplicoCV listens for.
  As configured today, **a customer would pay and never receive access.**
- A **`pending`** product can't be purchased at all — its checkout returns 404.
- The plan model is weekly / monthly recurring; **`year`** is wrong on both.

> This is why the keys have **not** been switched on in production yet. Turning them on
> as‑is would send every US/international customer to a broken checkout.

---

## 3. The fix — repeat for BOTH products

Do this for **AplicoCV Weekly**, then **AplicoCV Monthly**.

1. **Store → Products →** click the product to open it.
2. **Pricing → Pricing type:** change **Single payment** → **Subscription**
   ("Charge an ongoing fee").
   *This one setting is the whole problem — the panel defaults to Single payment.*
3. **Billing interval:**
   - Weekly product → **every 1 week**
   - Monthly product → **every 1 month**

   (both currently say *year*)
4. **Pricing model:** `Standard pricing`.
5. **Price:** keep `8550` (weekly) / `16150` (monthly) if staying in CLP —
   see the currency decision in §5.
6. **Tax category:** `Software as a service (SaaS)`.
7. **Generate license keys:** OFF.
8. Click **Publish product** — *not* "Save as draft". The status must no longer be
   `pending`.

---

## 4. ⚠️ Then re‑copy BOTH variant IDs

Changing the pricing model usually makes Lemon Squeezy **issue new variant IDs**, so
`1953569` / `1953574` are very likely stale now. With the old IDs, checkout still fails
even after the products are fixed.

To read each one:

- Open the product → its single **Variant** → the ID is in the URL / variant row
  (e.g. `app.lemonsqueezy.com/…/variants/**1953569**`).

Send both back in this form:

```
LEMONSQUEEZY_VARIANT_WEEKLY=<new weekly variant id>
LEMONSQUEEZY_VARIANT_MONTHLY=<new monthly variant id>
```

> Digits only — no `#`, no quotes.

---

## 5. Currency — one decision needed

The store is currently **CLP**, but this payment rail serves the **USA / worldwide**
market (LATAM customers already go to MercadoPago), and the app defaults to **USD**.
Left as‑is, the site would advertise USD while Lemon Squeezy charges CLP.

| | What to do | Result |
|---|---|---|
| **Option A — USD** *(recommended)* | Settings → Store → Currency → **USD**, then price **9.00** / **17.00** | Matches the USA/worldwide positioning |
| **Option B — keep CLP** | Keep `8550` / `16150`; we add `LEMONSQUEEZY_CURRENCY=CLP` | Display matches the charge, no store change |

Whichever you pick, the number in the Price field is exactly what the customer is
billed each cycle.

---

## 6. What is already correct — don't change it

- ✅ **API key** — authenticates successfully.
- ✅ **Store ID** `427133`.
- ✅ **Webhook** — correct URL `https://aplicocv.com/api/billing/lemonsqueezy/webhook`
  with all 7 required subscription events.

Only the two products need changing.

---

## 7. When you're done

Tell me, and I will:

1. Re‑query the Lemon Squeezy API to confirm both variants report
   `is_subscription: true`, the correct weekly/monthly interval, and a published status.
2. Set all five `LEMONSQUEEZY_*` values in the production `.env` on the VPS and restart.
3. Verify `"lemonsqueezy": true` on `https://aplicocv.com/api/health`.

Full setup reference: `LEMONSQUEEZY_SETUP.md` (same folder).
