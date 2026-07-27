# AplicoCV — Enfoque 2.0 Development Plan

> **Supersedes** `FUTURE_DEVELOPMENT_PLAN.md` and `PLATFORM_PIVOT_PLAN.md` for
> everything strategy‑ and roadmap‑related. Source of this rewrite: the client
> brief **"Enfoque 2.0 AplicoCV.docx"**.
> Status date: 2026‑06‑10.

---

## 0. TL;DR

The current product is a freemium **autofill extension** with a lot of features
bolted around it. The client's honest verdict: *"today nobody would pay for it as
it is — the value promise is the extension, and it doesn't deliver."*

**Enfoque 2.0 is not a rebuild. It is a re‑orientation.** ~80–90% of the pieces
already exist in the codebase; the job is to (1) put them behind **one coherent
story**, (2) lead with a genuinely new hero feature — an **autonomous AI job
search** — and (3) change the business model to **paid‑only, subscription,
USA‑first**, in the style of the proven competitor **AIApply.com**.

The single sentence that must organize the whole product:

> **"AplicoCV — your AI career copilot."**
> Create your profile → optimize it → adapt it to any role → rewrite it for the
> industry you want → **let the AI find matching jobs for you** → apply with a
> CV tailored per role → autofill the forms → practice the interview.

That chain is the "hilo conductor" (the through‑line) the product was missing.

---

## 1. What changes, in one page

| Dimension | Today | Enfoque 2.0 |
|---|---|---|
| **Hero value** | Chrome autofill extension | **Autonomous AI job search** ("don't pay LinkedIn Premium") |
| **Business model** | Freemium + credit/token purchases + subscription | **Subscription‑only, nothing free**, token/credit economy retired from the UI |
| **Pricing** | CLP plans (≈6.990/mo) via MercadoPago | **USD**: **$9 / 1 week**, **$17 / 1 month** (auto‑renew) |
| **Primary market** | LATAM‑first | **USA‑first for promotion**, full Americas usability from day one |
| **First screen** | Marketing landing that shows everything | **AIApply‑style intake**: user acts from second 0, sees the "carrot", then hits a **paywall before** the full portal |
| **Extension role** | The product | **A supporting feature** (autofill + learns from past failures) |
| **"Super CV"** | Dense, mixed‑language, asterisks, unusable | Rebranded + clean, human‑readable output |

**Non‑negotiables from the brief:**
- Deliver a **finished, error‑free product** that "does what it promises," on par
  with AIApply (this is tied to the payment terms — see §10).
- **Retire the free tier and the pay‑per‑token model.** Payment required up front.
- Change the **on‑ramp** so the user interacts *before* they see the full app.

### Confirmed with the client (2026‑06‑10 reply)

These are settled and drive the sections below:

- **Subscription‑only** confirmed; no free tier, no tokens/rewards/check‑in.
- **Pricing:** ~**USD 9 / week**, ~**USD 17 / month**, with **auto‑renewal**
  (renew honestly at the same price — do not copy AIApply's "forget‑to‑cancel"
  higher‑renewal trap).
- **Pay before account:** the user pays first, *then* creates the account/password,
  *then* reaches the dashboard. This reorders the auth/onboarding flow.
- **Market:** promote **USA‑first** (limited ad budget), but the product must be
  **fully usable across all the Americas from day one**; LATAM is a fast step 2.
- **Region intake:** ask the user **which regions** to search and **remote vs
  on‑site** — that answer selects which portals we query (remote → any origin;
  on‑site → portals for the user's country).
- **Job volume:** target **up to ~20 fresh high‑match jobs/day**, honestly
  delivered (marketing angle: "no prometemos, cumplimos"), not inflated counts.
- **Interview languages:** English + Spanish at launch; **Portuguese** optional
  (Brazil) if it doesn't complicate.
- **Salary** shown strictly as an orientative range.
- **Payments (chosen):** **Lemon Squeezy** (Merchant‑of‑Record) — no US entity
  needed, accepts international cards, handles US tax, native subscriptions. Client
  has created the account. MercadoPago stays for LATAM local currency. **Stripe out**
  (US‑entity cost). Remaining check: confirm Lemon Squeezy **payout support for the
  client's country**.
- **Freelance marketplaces (Upwork/Fiverr): excluded** for now (client agreed — they
  dilute focus; different gig model).
- **On‑ramp reference:** mirror AIApply's entry→purchase path (client shared a study
  login); keep it empathetic and engaging from second 0.

---

## 2. The product story (the through‑line the user follows)

Every feature below is a station on this single journey. Nothing should exist in
the UI that isn't a step on it.

1. **Create & load your profile** — upload CV once (already built: onboarding + CV parse).
2. **Optimize it** — "Analyze my CV" → strengths/weaknesses → *offer to help fix them* (see §4.2, the quality bar).
3. **Adapt it to a role** — paste a job link → CV rebuilt for that posting's ATS + keywords.
4. **Re‑write it by industry focus** — Marketing / Commercial / Consulting / Engineering… saved per focus in Documents.
5. **Find offers automatically** — the AI searches portals overnight and returns **up to ~20 proposals/day**.
6. **Apply** — one‑click for ready matches, or a Copilot table for the ones you apply to yourself.
7. **Autofill forms** — the extension completes compatible portals.
8. **Know your number** — expected‑salary reference for each posting.
9. **Practice the interview** — realistic spoken mock with an avatar.
10. **Track** — application status, fed by the links you used.

---

## 3. Positioning: copy/beat AIApply

- **Action to take first:** the client will fund a 1‑week AIApply subscription
  (~$10) so we can study it in detail, plus its AI‑generated social ads (no human
  on camera — 100% AI). **Do a structured teardown** before finalizing UX: onboarding
  flow, paywall placement, the "autonomous apply" UX, pricing psychology, ad style.
- **Our wedge vs AIApply:** stronger **ATS‑tailored CV per offer** with
  achievement suggestions, **industry‑focus CV variants**, **expected‑salary**
  guidance, and a **realistic spoken interview** — bundled into one subscription.

---

## 4. Feature build map

Legend — **Reuse**: exists, keep. **Adapt**: exists, re‑format/re‑concept.
**Build**: net‑new. Priority **P0** = launch‑blocking, **P1** = fast‑follow,
**P2** = later / v2.0.

| # | Feature | Client's ask | What already exists | Work | Pri |
|---|---|---|---|---|---|
| 4.1 | **Autonomous AI job search** | AI scans LinkedIn/Indeed/Computrabajo/intl portals, returns 10 proposals/day: (A) ready‑to‑apply, (B) Copilot table with match + link | `monitoring_service` (scheduled scan→recommend→queue→digest), `agent_service.scan_for_user` (Remotive API + portal deep‑links + scoring), `apply` queue, `recommendations` | **Adapt + Build** | **P0** |
| 4.2 | **CV adapter per offer + achievement suggestions** | Paste link → ATS‑tailored CV + keywords; propose 2–3 achievement options per role (multi‑select); on accept, rebuild CV + show new score | `profiles/tailor-for-url`, `ai/ats-simulate`, `ats/score`, `ai/personal-analysis`, `ai/skill-suggestions` | **Adapt + Build** | **P0** |
| 4.3 | **CV builder by industry focus** | Choose Marketing/Commercial/Consulting/Engineering… → CV built for that focus, saved per focus, downloadable | `ai/super-cv`, Documents page, PDF export | **Adapt** | **P0** |
| 4.4 | **"Super CV" cleanup** | Output is dense, mixes languages, asterisks/symbols, unusable; drop the "Super CV" name | `ai/super-cv` + prompt/formatting | **Adapt** | **P0** |
| 4.5 | **Interview practice (spoken avatar)** | Avatar asks questions **out loud**, hidden from the user, 3‑min timer each, up to 5, language choice, **nothing recorded/stored** | `ai/interview/start` + `/feedback` + `/history` | **Adapt + Build** | **P1** |
| 4.6 | **Adapted cover letters** | Cover letters tied to each CV focus/profile | `cover-letters/generate`, `ai/cover-letter-pro` | **Adapt** | **P1** |
| 4.7 | **Expected salary** | On job‑link paste, show a salary reference (local/USD) to enter as expectation | `ai/salary-insights` | **Adapt** | **P1** |
| 4.8 | **Application tracking** | Track from links used; ask if applied, or detect automatically when web/extension open | `TrackingPage`, `applications` API, autofill‑event telemetry | **Adapt** | **P1** |
| 4.9 | **Chrome extension** | Extend portal coverage; autofill previously‑saved answers; **learn from past failures** | `extension/*`, `portals/configs`, FAQ autofill, field‑answer AI | **Adapt + Build** | **P1** |
| 4.10 | **Recruiter marketplace / public profile** | Recruiters browse the CV database by keyword + expected salary; a "professional GitHub" (`aplicocv.com/federicoMauas`) | — | **Build** | **P2 (v2.0)** |

### 4.1 Autonomous AI job search — the hero (P0)

**Reality check (be honest with the client):** direct scraping of **LinkedIn /
Indeed** logged‑in listings is against their ToS and technically brittle. What we
already do and can do reliably:
- **Live jobs today:** the **Remotive** public API (real remote roles) + scored deep‑link
  searches for LinkedIn/Indeed/Get on Board/WWR. This already runs on a schedule
  (`monitoring_service` → `agent_service.scan_for_user`).
- **To reach ~20 real proposals/day** credibly, add more **compliant sources** with
  official feeds/APIs, prioritized by the user's region + remote/on‑site choice.
  Client's target source list, grouped:
  - **USA / global:** USAJobs, ZipRecruiter, FlexJobs, Remote.co, Glassdoor, Indeed,
    LinkedIn (search‑assist only), Google Jobs, plus ATS feeds (Greenhouse, Lever).
  - **Remote‑first:** WeWorkRemotely, RemoteOK, Remotive, Weremoto, Remote.co.
  - **LATAM:** Computrabajo (all America), Laborum, ZonaJobs, Bumeran, Getonboard,
    Chiletrabajos, Konzerta, InfoJobs (Brazil).
  - **Freelance marketplaces (treat separately):** Upwork, Fiverr — different model
    (gigs, not employment); gate behind an explicit "freelance" preference.
- **Sourcing method is per‑source:** official API/RSS where it exists; a compliant
  public‑listing fetch otherwise; **search‑assist deep links** (not logged‑in
  scraping) for LinkedIn/Indeed. Set the honest expectation with the client:
  "up to ~20/day" from real sources, not an inflated "hundreds available" claim.

**Key UX decision from the brief (the "no open session" problem):**
> The autonomous search must run **server‑side**, not via the extension (the
> extension only works while the user has a live web session).

So the flow is:
1. Server scans overnight per user's saved **profiles/preferences**, now including
   the **region(s)** and **remote vs on‑site** answer, which selects the source set.
2. Delivers a **daily panel**: **up to ~20 proposals**, split into:
   - **(A) Ready to apply** — CV already tailored; a single **"Apply"** completes it
     (uses the `apply` queue + extension when the user clicks and is therefore online).
   - **(B) Copilot table** — for the rest: mini job summary + **match score** + **link**
     to apply yourself (uses `recommendations`).
3. **Bonus:** when the user clicks a link and lands on a compatible portal (now
   they *are* online), the extension assists the autofill.

**Work:** consolidate `monitoring_service` + `recommendations` + `apply` into one
**"Copilot" dashboard** (this replaces the scattered pages); add sources; make the
"~20/day" cadence and the A/B split first‑class; make eligibility = **any active
subscriber** (drop the token‑pass gating, see §5).

### 4.2 CV adapter + achievement suggestions — the quality bar (P0)

The client attached a real **Claude transcript** (recruiter‑with‑15‑years persona)
as the **quality target** for our "Analyze my CV" output. Replicate that bar:

- On **"Analyze my CV"**: return **strengths** and **weaknesses that a recruiter
  spots in <10 seconds** (missing objective title, roles without metrics, text
  density, formatting/tilde errors, missing LinkedIn, ATS keyword gaps), plus a
  **score /10 and how to reach 10** — concrete, not generic.
- In the **weaknesses** section, automatically offer:
  *"Would you like help identifying some achievements and objectives?"* →
  propose **2–3 achievement options per past role** (multi‑select), phrased as the
  typical, quantified accomplishments for that function. The user picks; we insert
  them harmoniously.
- On **Accept**: rebuild the CV and show the **new ATS/standard score** so the
  before→after gain is visible.
- **Per‑offer path:** paste a job link → tailor the CV to *that* posting's ATS +
  keywords, ask "adapt automatically?", then same accept→rebuild→re‑score loop.

Existing endpoints cover the pieces (`personal-analysis`, `skill-suggestions`,
`ats-simulate`, `tailor-for-url`); the work is **prompt quality + the multi‑select
achievement UX + the accept→rebuild→re‑score loop**.

### 4.3 / 4.4 CV by focus + "Super CV" cleanup (P0)

- Keep the **industry‑focus builder** (Marketing/Commercial/Consulting/Eng…), save
  one document per focus in **Documents**, downloadable — make it *friendlier*.
- **Retire the "Super CV" label and clean the output**: no asterisks/symbols, no
  mixed languages, human‑readable, ready to paste into a real application. This is a
  **prompt + post‑processing + PDF‑formatting** fix, not new architecture.

### 4.5 Interview practice — spoken avatar (P1)

Redesign the existing interview feature into a **realistic simulation**:
- A quadrant with an **avatar** that **speaks** the question (TTS) — the user does
  **not** see the question text (it's a real practice, not reading).
- After asking: *"You have 3 minutes to answer"* + a **countdown**; then the next
  question. Up to **5 questions**.
- **Language selectable** — **English + Spanish at launch**, **Portuguese** optional
  (Brazil). **Nothing is recorded or stored** — the user just talks to the screen
  while the avatar "watches."
- Feasibility: use a lightweight **TTS voice + a looping avatar video/animation**
  (no real‑time video generation needed). Feedback (optional) can still come from
  `ai/interview/feedback` if we let the user type/paste an answer afterward — but
  the core promise is the spoken, timed, unseen‑question drill.

### 4.7 Expected salary (P1)

When a job link is pasted, alongside the tailored CV show a **salary reference box**:
> *"Similar roles are paying USD 2,500–3,500 depending on seniority; we recommend
> applying with 3,100 based on your CV."*

`ai/salary-insights` already exists — surface it in the per‑offer view, in **local
currency or USD**, clearly framed as a **reference, not a guarantee** (every company
has its own budget).

---

## 5. Monetization & packaging (big change)

**Client directives (confirmed):**
- **No free functionality.** Payment required from the start.
- **Remove the pay‑per‑token model**; **subscription only.**
- Two plans: **~$9 / 1 week**, **~$17 / 1 month**, with **auto‑renewal**.
  Tagline: *"Your job future, for less than a hamburger."*
- **Renewal is honest** — renew at the same price. Do **not** replicate AIApply's
  raise‑the‑price‑on‑renewal / forget‑to‑cancel tactic.
- **Recurring billing** (weekly/monthly) means real subscriptions, not one‑time
  checkouts — needs the provider's subscription/preapproval flow (see §6).

**Engineering implication (important):** the app currently runs on a **credit/token
economy** woven through many features (`credit_service`, `AI_COSTS`, rewards,
check‑in streaks, referrals, the monitoring "pass"). Going subscription‑only means:

- **Recommended approach:** a subscription **unlocks everything** under a **fair‑use
  cap**; keep credits *internally* as a rate‑limit accounting unit if convenient, but
  **remove all credit/token UI, purchases, rewards and check‑in** from the product.
  Do **not** show the user a balance or ask them to "buy tokens."
- Delete/hide: credit packs in Billing, Rewards page, referral‑for‑credits,
  daily check‑in, the token‑gated monitoring pass (monitoring becomes a plain
  subscriber feature).
- Replace the plan catalogue in `billing._PLANS` + `pricing.BASE_*` with the two
  USD plans; make **Free** non‑selectable / removed.

**On‑ramp change (AIApply‑style) — pay before account:**
- The first screen is **not** a marketing landing. The user **does something
  immediately** (e.g. "Paste your CV / your target role") and the product starts
  showing value (the "carrot") — analysis previews, a match teaser — then hits a
  **paywall**.
- **New order:** intake → paywall → **pay** → **create account/password** →
  dashboard. Account creation happens *after* payment (per the client). This is a
  reordering of today's register→onboard→pay flow and touches auth + billing + routing.
- Reuse `OnboardingPage` / `UploadStep` for the pre‑pay intake; gate account
  creation and the dashboard behind a completed payment.
- **Study reference:** replicate AIApply's entry→purchase path (empathetic, guided);
  client provided a login to study it.

---

## 6. Geography, currency & payments

- **USA‑first for promotion**, but **usable across all the Americas from day one.**
  Pricing in **USD**.
- **Payment provider — the key open item.** Constraints from the client:
  - **Stripe is ruled out** — it would require opening a **US company**, a cost he
    won't take on now.
  - **MercadoPago can accept US cards** but with **frequent rejections** — usable as a
    fallback, not the primary US rail.
- **Chosen: Lemon Squeezy** (Merchant‑of‑Record). It is the legal seller, so it
  **needs no US entity**, **accepts international cards**, **handles US sales tax/VAT**,
  and supports **recurring subscriptions** natively — resolving "sell in the USA" and
  "no US company" at once. Client has created the account. Fees ≈ **5% + $0.50/txn**
  (note: the fixed $0.50 is a heavy drag on the $9 weekly — steer users to monthly).
  Remaining check: **payout support for the client's country**.
- **Plan:** Lemon Squeezy as the primary rail (USD, worldwide) + keep **MercadoPago
  for LATAM local‑currency** payers. Select provider by the visitor's market.
- **Integration:** two subscription products (weekly $9 / monthly $17), hosted
  checkout, **webhooks** (created/renewed/cancelled/failed), plus the **reconcile**
  fallback we already built. Use a **Lemon Squeezy API key** (not the account
  password) for setup.
- `pricing.py` already supports USD; set the catalogue base to USD.
- Keep the **billing reconcile** fallback (paid‑but‑unfulfilled rescue) for **every**
  provider we enable.

---

## 7. Phased roadmap

**Phase A — Foundation & business model (P0, launch‑blocking)**
1. AIApply teardown → lock the onboarding/paywall UX.
2. Subscription‑only: new USD plans ($9/wk, $17/mo, auto‑renew), remove free tier,
   retire token/credit UI (rewards, check‑in, packs), integrate **Lemon Squeezy**
   (MoR) as the primary rail + keep MercadoPago for LATAM.
3. AIApply‑style intake + **pay‑before‑account** paywall gate before the portal.

**Phase B — Hero feature (P0)**
4. Consolidate monitoring + recommendations + apply into the **Copilot dashboard**
   (daily ~20 proposals, A = ready‑to‑apply / B = table).
5. Add compliant job sources (USA set first) + region/remote intake; make the
   "~20/day" cadence real.

**Phase C — CV intelligence (P0)**
6. "Analyze my CV" to the recruiter‑grade quality bar (§4.2).
7. Achievement‑suggestion multi‑select + accept→rebuild→re‑score.
8. Per‑offer tailoring surfaced cleanly; **Super CV cleanup**; industry‑focus builder friendlier.

**Phase D — Supporting features (P1)**
9. Spoken avatar interview; expected‑salary box; adapted cover letters per focus.
10. Extension: broader portal coverage + "learn from past failures"; tracking polish.

**Phase E — Future (P2 / v2.0)**
11. Recruiter marketplace / public professional profile ("professional GitHub").

---

## 8. Definition of Done (acceptance)

Tied to the client's terms — the payment is contingent on a **finished, error‑free
product that delivers what it promises**, comparable to AIApply. A feature is "done"
only when:

- It is **reachable and working end‑to‑end in production** (no dead/decorative UI —
  this was a real problem; see the recent audit).
- It **degrades honestly** (clear errors, no fake success toasts).
- It works for a **paying subscriber with no credit/token concepts visible.**
- Copy is clean and **market‑appropriate** (USA English + LATAM Spanish), no
  asterisks/symbol noise, no "Super CV"‑style jargon.
- It survives a **real end‑to‑end run** by a first‑time user from the paywall
  onward.

---

## 9. Risks, feasibility & open questions

Resolved in the client's reply (kept here for the record):
- **Sources:** agreed to compliant sources + deep‑link assists (no logging into
  LinkedIn as the user); target list captured in §4.1.
- **Volume:** agreed on **up to ~20/day**, honest ("no prometemos, cumplimos").
- **Market:** USA‑first promotion, full Americas usability day one — agreed.
- **Token economy removal / subscription‑only / salary‑as‑range** — all confirmed.
- **Interview languages:** EN + ES at launch, PT optional.
- **Payment provider:** **Lemon Squeezy** chosen (account created). Upwork/Fiverr excluded.

Still open / to validate:
- **Lemon Squeezy payout support for the client's country** (last check before wiring).
- **Recurring billing mechanics:** Lemon Squeezy handles auto‑renew natively; if
  MercadoPago is used for LATAM recurring, it needs MP *preapproval*.
- **20% revenue‑share base:** define **gross vs net** (client's math applied it after
  fees + local taxes) — a commercial detail to pin down.
- **Price display:** per‑day anchor vs full price + hook — recommend leading with the
  weekly price and the "hamburger" line, monthly as best value, **transparent renewal**.
- **Spoken avatar:** pick a **cheap, stores‑nothing** TTS + looping‑avatar approach;
  avoid per‑session video generation cost.
- **"~20/day" coverage per market** depends on wiring each source (USA set is the
  most new integration work).
- **Freelance marketplaces (Upwork/Fiverr):** confirm whether to include — different
  (gig) model; suggest gating behind a "freelance" preference.
- **Region/remote intake:** add the "which regions + remote vs on‑site" question that
  routes source selection.

---

## 10. Commercial terms (for record, as stated in the brief)

> Not an engineering item — captured so the plan and the deal stay in sync.

- **Payment:** **USD 500** on delivery of a 100% finished, usable, error‑free product.
- **Revenue share:** **20% of web revenue for 6 months**, starting once the product
  is finished and actually sellable (timer starts when it suits the developer).
- **Social media:** the 20% is tied to the developer **creating the AI‑generated
  ads** for social (no extra pay; better ads → higher revenue → higher share). The
  client funds **~USD 300–400** of Instagram promotion for the first 3–4 weeks.
  Instagram **@AplicoCv.co** already exists.
- **Maintenance:** after 6 months, revisit — continue as a revenue‑share partnership
  or a monthly part‑time maintenance fee.

---

## Appendix — feature → existing code map

| Enfoque 2.0 feature | Existing modules to reuse/adapt |
|---|---|
| Autonomous search | `app/services/monitoring_service.py`, `app/services/agent_service.py` (Remotive + deep‑links + scoring), `app/routers/apply.py`, `app/routers/recommendations.py`, in‑process scheduler in `app/main.py` |
| CV adapter per offer | `app/routers/profiles.py` (`tailor-for-url`), `app/services/job_fetch_service.py`, `ai/ats-simulate`, `ats/score` |
| Analyze my CV + achievements | `ai/personal-analysis`, `ai/skill-suggestions`, `ai/predictive-score` |
| CV by focus / Super CV | `ai/super-cv`, `DocumentsPage`, `lib/pdf.ts` |
| Interview | `ai/interview/start` `/feedback` `/history`, `InterviewPage.tsx` |
| Cover letters | `cover-letters/generate`, `ai/cover-letter-pro` |
| Expected salary | `ai/salary-insights` |
| Tracking | `app/routers/applications.py`, `TrackingPage.tsx`, autofill‑event telemetry |
| Extension | `apps/extension/*`, `portals/configs`, FAQ + `field-answer` autofill |
| Subscription / paywall | `app/routers/billing.py`, `app/pricing.py`, `auth/ProtectedRoute.tsx`, `OnboardingPage`/`UploadStep` |
| Recruiter marketplace (v2.0) | — (new) |

---

*Prepared from "Enfoque 2.0 AplicoCV.docx". Open questions for the client are
flagged in §9; commercial terms in §10 are recorded verbatim from the brief and are
not development scope.*
