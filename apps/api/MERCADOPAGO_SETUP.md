AplicoCV — MercadoPago Setup Guide

The MercadoPago integration is "key-ready": once you set the access token in the
server's .env and restart, checkout automatically switches from the stub to real
MercadoPago Checkout Pro. No code change is needed (unless your currency is not USD
— see step 4). MercadoPago takes precedence over Stripe when both are configured.


Step 1 — Have a MercadoPago account in the right country

MercadoPago is country-specific: the account's country sets the currency and the
available payment methods (cards, transfers, wallet…). Create or use a business
MercadoPago account for the country you will charge in (Argentina, Brazil, Chile,
Mexico, Colombia, Peru, Uruguay, etc.).


Step 2 — Create a developer application

  1. Go to https://www.mercadopago.com/developers and sign in.
  2. Open "Your integrations" (Tus integraciones) and click "Create application".
  3. Name it (e.g. "AplicoCV"), choose the product "Checkout Pro" (payments), and
     answer "No" to "Are you using a platform?".
  4. Open the application you just created.


Step 3 — Copy your credentials

Inside the application, open "Credentials" (Credenciales). There are two sets:

  - Test credentials (sandbox) — the access token starts with TEST-...
  - Production credentials — the access token starts with APP_USR-...

Each set has an Access Token (secret, server-side) and a Public Key. AplicoCV only
needs the Access Token to run checkout; the Public Key is optional (for future
embedded card flows).

Tip: test first with the TEST- token, then swap to the APP_USR- token to go live.
Some countries require you to finish an activation checklist before the production
credentials work.


Step 4 — Decide the currency

MercadoPago charges in the account's local currency. Set MERCADOPAGO_CURRENCY to the
ISO code for your country, for example:

  Argentina ARS · Brazil BRL · Chile CLP · Mexico MXN · Colombia COP · Peru PEN ·
  Uruguay UYU · United States USD

Prices are defined once in Chilean pesos (CLP) in apps/api/app/pricing.py (the
recommended standard) and are converted to the currency you set automatically — so you
do NOT need to edit per-currency prices. Just set MERCADOPAGO_CURRENCY and the catalogue
(plans + credit packs, on the website and at checkout) shows and charges in that
currency. The conversion uses an approximate FX table in app/pricing.py (CLP_PER_UNIT);
keep those rates roughly current, or charge in CLP for exact prices. To change the
actual price points, edit the CLP base amounts in app/pricing.py (BASE_CLP).

Current CLP base prices: Pro $6.990/mo, Pro annual $69.900/yr, packs $4.990 / $11.990 /
$29.990 for 500 / 1.500 / 5.000 credits.


Step 5 — Configure the server

SSH into the server and edit the API environment file:

    nano /opt/aplicocv/api/.env

Set these three lines (use TEST- first if you want to test, then APP_USR- for live):

    MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    MERCADOPAGO_CURRENCY=CLP

Then restart the API so it picks up the new keys:

    systemctl restart aplicocv-api.service


Step 6 — Verify it switched on

Check the health endpoint:

    curl -s https://aplicocv.com/api/health

You should now see "payments":"mercadopago" and "mercadopago":true in the response.
Then open the app, go to Plans / Billing, and click "Upgrade" or buy a credit pack —
you should be redirected to the MercadoPago checkout page.


Step 7 — Webhook (mostly automatic)

AplicoCV sets the notification URL on every checkout automatically, so MercadoPago
already knows where to send the payment result:

    https://aplicocv.com/api/billing/mercadopago/webhook

When a payment is approved, the server re-fetches that payment from MercadoPago
(using your access token) to confirm it is genuinely approved before granting credits
or upgrading the plan — so a forged notification cannot grant anything. Granting is
idempotent, so retries do not double-charge benefits.

Optional backstop: in the application, open "Webhooks" (Notificaciones), add the same
URL above for the "Payments" event, and save. This helps if a per-checkout
notification is ever missed.


Step 8 — Test a real flow before launch

  1. With the TEST- access token set, open Plans and start a checkout.
  2. Pay with a MercadoPago test card from
     https://www.mercadopago.com/developers (Checkout Pro > test cards) using a test
     buyer account (you can create test users in the developer panel).
  3. Confirm the result: a credit-pack purchase tops up the balance; a Pro purchase
     sets the account to premium. (You can also confirm the webhook arrived in the
     developer panel's notification log.)
  4. When it works end to end, replace the token with the APP_USR- production token
     and restart again.


What the integration does and does not do

  - Does: one-time Checkout Pro payments for the Pro plan and for credit packs, with
    server-side payment verification and idempotent fulfillment.
  - Does not (yet): auto-renewing monthly subscriptions. Checkout Pro charges once and
    grants premium; true recurring billing uses MercadoPago's separate Preapproval
    (suscripciones) API. If you want auto-renew, say so and I will add it.


Quick reference

  Env file:        /opt/aplicocv/api/.env
  Keys:            MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_PUBLIC_KEY, MERCADOPAGO_CURRENCY
  Restart:         systemctl restart aplicocv-api.service
  Health check:    https://aplicocv.com/api/health  (expect payments=mercadopago)
  Webhook URL:     https://aplicocv.com/api/billing/mercadopago/webhook
  Prices (CLP):    apps/api/app/pricing.py  (BASE_CLP) · FX rates (CLP_PER_UNIT)
