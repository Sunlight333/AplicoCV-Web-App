# Lemon Squeezy — Setup Guide (Enfoque 2.0 payments)

This activates the **USD / worldwide** payment rail. Once the five `LEMONSQUEEZY_*`
values are set in the production `.env`, checkout automatically switches from
MercadoPago to Lemon Squeezy (it takes precedence), charges in USD, and the webhook
turns a paid subscription into an active account.

You need to fill in these five values:

```
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_VARIANT_WEEKLY=
LEMONSQUEEZY_VARIANT_MONTHLY=
```

The guide below gets each one, in order. Budget ~20 minutes.

---

## 0. Before you start

- A Lemon Squeezy account with a **Store** created (Settings → Stores).
- **Test mode** (toggle at the bottom‑left of the dashboard) is currently **ON** —
  good. Do the whole setup + a test purchase in Test mode first, then repeat the
  API‑key + webhook steps in **Live mode**. (Test and Live have separate API keys;
  the Store ID is the same.)
- **Activate your store for live payments.** The "Activate your store" banner means
  the store can't take real money yet — you'll need to complete your business
  details before going live. Test mode works without this.
- Confirm Lemon Squeezy can **pay out to your country** — Settings → Payouts. If your
  country isn't supported, tell me; we keep MercadoPago as the fallback.

### ⚠️ Currency decision — read this first

In the product screen your store's currency shows as **CLP**. Lemon Squeezy prices
each product in the **store currency**, and our code charges exactly that. Pick one:

- **Option A — USD (recommended for the USA/worldwide positioning).** First change
  the store currency to **USD** (Settings → Store → Currency → USD), then price the
  products **9.00** and **17.00**. **Tell me when you do this** — I'll flip the site
  to display prices in USD so the checkout amount matches what visitors see.
- **Option B — keep CLP.** Price the CLP equivalents of $9 / $17: **8550** (weekly)
  and **16150** (monthly). This already matches what the site shows today and the
  MercadoPago prices — no code change needed.

Whichever you choose, the number you type in the Price field is exactly what the
customer is billed each cycle.

---

## 1. Create the two subscription products

**Store → Products → New Product** (a side panel opens). Fill it in for each product:

### General
- **Name:** `AplicoCV Weekly` (and `AplicoCV Monthly` for the second product).
- **Description:** optional.

### Pricing — the step that matters most
- **Pricing type:** the panel opens on **Single payment** by default. **You MUST
  click "Subscription" ("Charge an ongoing fee")** instead — otherwise the customer
  is charged once, not on a recurring plan. This is the #1 thing to get right.
- Once **Subscription** is selected, a **billing interval** appears:
  - Weekly product → **every 1 week**
  - Monthly product → **every 1 month**
- **Pricing model:** `Standard pricing`.
- **Price:** enter the amount per the **currency decision** above
  (USD `9.00` / `17.00`, or CLP `8550` / `16150`).
- **Tax category:** `Software as a service (SaaS)`.

### Variants — leave alone
A single‑price product already has **one default variant** — that's the id you'll
copy in step 3. **Do not click "Add variant"** (extra variants would create multiple
prices and complicate the id you feed the app).

### Settings
- **Generate license keys:** OFF (this is a subscription, not a licensed download).
- **Display product on storefront:** ON is fine.

Click **Publish product** (not "Save as draft") — a draft product's checkout 404s.

Repeat the whole step for **AplicoCV Monthly** (Subscription → every **1 month** →
price `17.00` / `16150`).

---

## 2. Get `LEMONSQUEEZY_STORE_ID`

- Settings → **Stores**. The store shows a numeric **ID** (e.g. `12345`).
- Alternatively it's in the store URL: `app.lemonsqueezy.com/…/stores/**12345**`.

```
LEMONSQUEEZY_STORE_ID=12345      # your numeric store id (digits only)
```

> ⚠️ **Do not paste the `#`.** The dashboard displays the id as **`#12345`**, but the
> API only accepts the digits — pasting `#12345` makes *every* checkout fail with an
> unhelpful API error. The app now strips a leading `#`, stray quotes and whitespace
> defensively, but keep the `.env` clean anyway. The same applies to the variant ids
> in the next step.

---

## 3. Get `LEMONSQUEEZY_VARIANT_WEEKLY` and `LEMONSQUEEZY_VARIANT_MONTHLY`

Each product has one or more **variants**; we need the **variant ID** of each.

- Open the **Weekly** product → the **Variant** (if the product has a single price,
  it still has one default variant). The variant ID is a number shown in the
  variant's details, or in the URL when you open it
  (`…/products/…/variants/**67890**`).
- Do the same for **Monthly**.

```
LEMONSQUEEZY_VARIANT_WEEKLY=67890     # weekly product's variant id
LEMONSQUEEZY_VARIANT_MONTHLY=67891    # monthly product's variant id
```

> How to be sure you have the *variant* id, not the *product* id: if you're unsure,
> use the API — `GET https://api.lemonsqueezy.com/v1/products/<productId>/variants`
> with your API key returns the variant ids. Our checkout calls the API with these
> exact ids, so a wrong id makes checkout fail with a 502.

---

## 4. Create `LEMONSQUEEZY_API_KEY`

- Settings → **API** → **Create API key**.
- Name it `aplicocv-prod` (or `aplicocv-test` while testing).
- Copy the key **now** — it's shown only once. It looks like a long token.

```
LEMONSQUEEZY_API_KEY=eyJ0eXAiOi...      # the full API key
```

> The key is **mode‑specific**: a key created with Test mode ON only works in test,
> and vice‑versa. Use a test key for step 7's test purchase, then swap in a live key.

---

## 5. Create the webhook + `LEMONSQUEEZY_WEBHOOK_SECRET`

The webhook is how a completed payment becomes an active account.

- Settings → **Webhooks** → **Create webhook**.
- **Callback URL:**
  ```
  https://aplicocv.com/api/billing/lemonsqueezy/webhook
  ```
- **Signing secret:** enter a strong random string (you choose it). This is the
  `LEMONSQUEEZY_WEBHOOK_SECRET`. Our server verifies every webhook's
  `X-Signature` (HMAC‑SHA256 of the raw body) against this secret, so it must match
  exactly.
- **Events to enable** (tick these — the server acts on them):
  - `subscription_created`
  - `subscription_updated`
  - `subscription_payment_success`
  - `subscription_resumed`
  - `subscription_cancelled`
  - `subscription_expired`
  - `subscription_paused`
- Save.

```
LEMONSQUEEZY_WEBHOOK_SECRET=your-strong-random-string
```

> A `subscription_*` active event (created / payment_success / …) sets the user to
> **premium**; cancel / expire sets them back to **free**. It's idempotent.

---

## 6. Put the values into production and restart

The five values go into the **production** env file on the VPS:
`/opt/aplicocv/api/.env`. (Our deploy script **preserves** `.env`, so once set they
survive future deploys.)

On the server (`root@162.243.229.139`):

```bash
nano /opt/aplicocv/api/.env
# add/replace the five LEMONSQUEEZY_* lines, save

systemctl restart aplicocv-api
sleep 3
curl -s http://127.0.0.1:8000/api/health
```

Health should now show **`"lemonsqueezy": true`** and **`"payments": "lemonsqueezy"`**.

> Or just send me the five values and I'll set them on the VPS and restart for you —
> do **not** paste them into a public place; treat the API key and webhook secret
> like passwords.

---

## 7. Verify end to end

1. `GET https://aplicocv.com/api/health` → `"lemonsqueezy": true`, `"payments": "lemonsqueezy"`.
2. On the site, go to **/subscribe** and click a plan → you should land on a
   **Lemon Squeezy** hosted checkout showing **$9/week** or **$17/month**.
3. Pay with a **test card** (test mode): `4242 4242 4242 4242`, any future expiry,
   any CVC.
4. After payment you're redirected back to `/settings/billing?upgraded=1`; within a
   few seconds the account becomes **premium** (the webhook fires) and the portal
   unlocks. If the webhook is slow, our reconcile fallback still upgrades on the
   billing page.
5. In the Lemon Squeezy dashboard → **Webhooks**, confirm recent deliveries returned
   **200**.
6. Click **Manage subscription** on the billing page → it should open the Lemon
   Squeezy customer portal (URL captured from the webhook).

When the test run is clean, redo **steps 4 and 5 in Live mode** (new live API key +
live webhook secret) and put the **live** values in `.env`.

---

## How it works behind the scenes (reference)

- **Provider precedence:** Lemon Squeezy → MercadoPago → Stripe → stub. Setting the
  keys flips the active rail automatically; no code change.
- **Checkout:** `POST /api/billing/checkout {plan}` → server creates a Lemon Squeezy
  hosted checkout for that plan's **variant**, stashing `user_id` + `plan_id` in the
  checkout's custom data, and returns the hosted URL to redirect to.
- **Fulfillment:** the webhook reads `meta.custom_data.user_id` to find the account
  and sets premium/free from the subscription status. Idempotent.
- **Manage subscription:** the webhook also stores the subscription's
  `customer_portal` URL, which `POST /api/billing/portal` returns.
- **Prices:** the price shown on the site comes from `app/pricing.py` (USD $9/$17,
  converted to the display currency), but Lemon Squeezy charges the **product's own
  price in the store currency**. So the two must agree: if the LS store is USD, price
  9/17 and I'll set the site to display USD; if the store stays CLP, price 8550/16150
  so it matches what the site already shows.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Checkout returns 502 "Could not start Lemon Squeezy checkout" | Wrong `VARIANT_*` id, wrong `STORE_ID`, product in **draft**, or a **test key with a live product** (mode mismatch). |
| `health` still shows `lemonsqueezy: false` | A key is blank, or the service wasn't restarted after editing `.env`. All of API key + store id + at least one variant must be set. |
| Paid but account not upgraded | Webhook not delivering (check dashboard deliveries), wrong **callback URL**, or the **signing secret** in `.env` doesn't match the webhook's. The billing‑page reconcile still upgrades on next visit. |
| Checkout shows the wrong price / wrong currency | The LS product price or **store currency** doesn't match the site. Fix the price on the product (or the store currency in Settings → Store); if you moved the store to USD, tell me so I switch the site's display currency to USD. |
| Manage‑subscription button does nothing useful | The customer‑portal URL is only captured after the first subscription webhook; it appears once a real subscription exists. |

---

## Final checklist

- [ ] Currency decided (USD 9/17, or CLP 8550/16150) — store currency matches
- [ ] Two products created as **Subscription** type (not Single payment), published:
      Weekly = every 1 week, Monthly = every 1 month
- [ ] `LEMONSQUEEZY_STORE_ID` (numeric)
- [ ] `LEMONSQUEEZY_VARIANT_WEEKLY` / `LEMONSQUEEZY_VARIANT_MONTHLY` (variant ids)
- [ ] `LEMONSQUEEZY_API_KEY` (live)
- [ ] Webhook to `https://aplicocv.com/api/billing/lemonsqueezy/webhook` with the 7
      `subscription_*` events, and its signing secret in `LEMONSQUEEZY_WEBHOOK_SECRET`
- [ ] Values in `/opt/aplicocv/api/.env`, `aplicocv-api` restarted
- [ ] `health` shows `lemonsqueezy: true`
- [ ] One test purchase (Test mode) upgrades the account and the webhook returns 200
- [ ] Store **activated** for live payments (business details completed)
- [ ] Payout country confirmed in Lemon Squeezy
```
