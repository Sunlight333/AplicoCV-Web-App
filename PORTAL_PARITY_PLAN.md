# AplicoCV — Portal Parity & Improvement Plan (screen-by-screen)

**Date:** 2026-06-05
**Source:** Full screenshots of every page of the competitor **Postula Fácil** portal + their public site, mapped against AplicoCV's current build.

This is the **granular, screen-by-screen** companion to `FUTURE_DEVELOPMENT_PLAN.md`. It enumerates every competitor screen, our status, and an implementation spec (data model / endpoints / UI / credit cost / priority).

---

## 0. Already shipped this engagement (do not re-plan)
- **Credits economy** + ledger, **daily check-in + 30-day streak calendar** (double-reward days), **profile-completion earn grants** → `/rewards`, credit chip in the top bar.
- **FAQ answer-bank** → `/faq`.
- **Paste-CV-as-text** import; **profile-completion %**; **7-day free trial** + upgrade modal.

These cover the competitor's *gamification header*, *Preguntas Frecuentes*, *CV-as-text*, and *completion %*. The plan below is the **remaining** surface.

---

## 1. Screen-by-screen gap map

| Competitor screen (sidebar group) | What it does | AplicoCV today | Priority |
|---|---|---|---|
| **Mis Datos Base** (PERFIL) | rich profile: CV text, base letter, preferences (salary range/net-gross, work-mode, availability, visa), skills + AI-suggest + "don't want", personal analysis, certs, portfolio, projects | partial (tabbed profile; paste-CV done) | **P0** |
| **Experiencia (Detallada)** | AI-extract experiences from CV / manual add, logros + responsabilidades | read-only experience tab | **P1** |
| **Preguntas Frecuentes** | answer-bank | ✅ shipped | done |
| **Estilo (PRO)** | AI writing-tone personalization, premium-gated | ❌ | **P2** |
| **Perfil Público / Tu Perfil de Talento** | opt-in public profile + recruiter "buscar talento", visibility toggles, photo, AI summary, cargos de interés, min-requirements gate | ❌ | **P2** |
| **Optimizar CV & Carta** (POSTULAR) | Super-CV ATS (X-Y-Z, 1000 cr) + Carta 100% Personalizada (200 cr); CV-source selector; JD input | basic tailor/cover endpoints, no wizard | **P0** |
| **Entrevista IA** | configurable mock interview (role, #questions, duration, text/voice; voice = top plan) + history | ❌ | **P1** |
| **Historial** (RESULTADOS) | applications saved from the extension, with status | board exists; no "from extension" framing/empty CTA | **P1** |
| **CVs y Cartas Generados** | library of generated CVs + cover letters (tabs, counts) | stored, no UI | **P1** |
| **Gana Dinero / Programa de Referidos** (CRECIMIENTO) | referral code + link, commission tiers, balance, min-withdrawal, history | ❌ | **P2** |
| **Planes y suscripción** | 3 credit tiers + Agency BYOK + Free; referral-code redeem; manual payment validation | basic Stripe free/premium | **P0** |
| **Tips para conseguir trabajo** (AYUDA) | SEO blog with category filters | ❌ | **P3** |
| **Cómo Usar la App** | onboarding guide: videos + 5 steps | ❌ | **P2** |
| **Instalar Extensión** | dual install (Chrome Store + manual .zip v3), version notes, video, backup link | simple ExtensionPage | **P1** |
| Global: **welcome-offer countdown**, **WhatsApp support**, **notification bell**, **credit-priced AI** | retention/monetization furniture | ❌ | **P1** |

---

## 2. Detailed specs

### 2.1 Mis Datos Base — bring the profile to parity (P0)
Their profile is the product's spine. Expand ours (sectioned single page or keep tabs):
- **Base cover letter** — store one reusable letter; "Generate with AI (free 3/uses then credits)"; per-job tailoring starts from it. *Model: `Profile.data.baseCoverLetter` (string) or column.*
- **Preferences upgrade** — salary **single OR range**, **net/gross**, **currency (CLP/USD/…)**; **work mode** (remote/hybrid/onsite multi); **availability** (immediate/2wk/1mo/other); **legal/visa** (citizen-PR / valid-visa / in-process / needs-sponsor); languages with level. *Extend `JobPreferences` + the `complementary` block.*
- **Technical skills** — tag input (have it) + **popular-suggestions chips** + **AI-suggest from CV (50 cr)** + **"tools I don't want"** (negative list fed to tailoring so the AI never surfaces them). *Model: `Profile.data.skillsAvoid: string[]`.*
- **Personal analysis (10 cr)** — strengths (3-5), weaknesses, motivation. *Model: `Profile.data.analysis {strengths[],weaknesses,motivation}`; new `POST /ai/personal-analysis`.*
- **Certifications** + **Portfolio links** + **Personal projects** as first-class sections. *Model: `Profile.data.certifications[]`, `projects[]` (links already exist).*
- Each AI button shows its **credit cost** and spends via the credit service (Section 3).

### 2.2 Experiencia Detallada (P1)
- "**Extract from CV with AI**" (disabled with a clear "upload a CV first" banner when none) + "**Add manually**".
- Editable rows: employer, title, dates, location, **bullets (logros + responsabilidades)** — currently read-only; make fully add/edit/remove/reorder.
- Tip nudge: "more detail → better auto-answers." *Reuses `Profile.experience`; new `POST /ai/extract-experience` (or reuse parse).* 

### 2.3 Estilo de Escritura — PRO (P2)
- Tone presets (professional / warm / direct / technical / executive) + free-text guidance the AI applies to all generations.
- **Premium-gated** with a clean "Ver Planes" lock card (mirror their screen). *Model: `Profile.data.writingStyle`; gate with `require_premium`/credits.*

### 2.4 Perfil Público / Talento (P2)
- **Visibility toggle** with a **min-requirements gate** (≥1 cargo de interés, summary ≥50 chars, ≥1 skill, ≥1 experience or CV).
- **Profile photo** (≤2 MB), **Professional summary** with "Generate with AI (50 cr)", **Cargos de interés** (≤2, "Suggest 5 cr").
- **Granular show/hide toggles** per section (experience, skills, languages, location, availability, visa, CV PDF, certs, portfolio, projects).
- **Preview** + public page `/u/{handle}` (SEO) + a recruiter **"Buscar talento"** search (phase 2 of this). *Models: `public_profiles` (handle, visible, photo, summary, target_roles[], show_flags JSON).*

### 2.5 Optimizar CV & Carta (P0) — the conversion engine
A dedicated **Optimization** screen with two credit-priced actions:
- **Super CV (ATS) — 1000 cr** — "a senior recruiter rewrites your experience with the **X-Y-Z formula**, gap analysis + ATS optimization." CV source = **system CV** or **paste another**; **Cargo** (required) + **Job Description** (optional); guardrail copy: *"AI may not invent roles/companies not in your CV."* Output: before/after diff + ATS score + save to library.
- **Carta 100% Personalizada — 200 cr** — generated from scratch (not the base letter), tying achievements to the company's needs.
*Backend: extend `tailor_profile`/`generate_cover_letter` with X-Y-Z + JD prompts; wrap each in a credit `spend()`; persist results as `documents`.*

### 2.6 Entrevista IA (P1)
- Config: **role from history** (dropdown), **target role** (free text), **# questions** (5/8/10), **duration**, **mode = text / voice** (voice gated to top plan).
- Run: AI generates role-specific questions from the CV → user answers (text now; **voice via Web Speech API** next) → AI feedback (STAR, clarity, keywords) → **session history**. *Models: `interview_sessions`(config, qa[], feedback); endpoints `POST /interview/start`, `/interview/answer`, `GET /interview/history`. Credit-priced.*

### 2.7 Historial de Postulaciones (P1)
- Reframe Applications as "**saved from the extension**," with a teaching empty state ("when you apply on LinkedIn/Laborum/Trabajando they'll appear here") + **"Install the extension"** CTA + **manual "Add application."** (Backend already supports `POST /applications`.)

### 2.8 CVs y Cartas Generados — library (P1)
- Tabs **Optimized CVs (n) / Personalized Letters (n)**, dated cards, view / duplicate / **download PDF**, empty-state "Create my first…". *Backend: `GET /documents?kind=tailored|cover` list; data already stored.*

### 2.9 Gana Dinero / Referidos (P2)
- **Referral code + share link**, commission tiers (e.g. per plan), **balance + min-withdrawal**, **successful-referrals / total-earned** stats, **history**, withdrawal request. Plus **redeem a referral code** on the Plans screen. *Models: `referrals`(code, referrer_id, referred_id, plan, commission, status), `referral_payouts`.*

### 2.10 Planes y suscripción (P0)
- **Credit-tier plans** (not just free/premium). Suggested mapping to our market (tune): a calm / active / urgent tier each granting a monthly **credit allotment** (= ~N applications), plus a **Free** tier with a starting credit gift, plus an **Agency BYOK** annual plan (unlimited, user supplies their own OpenAI key → "no per-credit cost").
- **Referral-code redemption** field; **manual payment validation** (enter payment ID) for failed-webhook recovery; subscription status panel.
- *Backend: extend billing to credit-allotment plans; map Stripe price IDs to credit grants on `checkout.session.completed`; a `redeem-code` + `validate-payment` endpoint.*

### 2.11 Instalar Extensión (P1)
- **Two methods** like theirs: **Chrome Web Store** (recommended, 1-click, auto-update, "verified by Google") + **Manual/Early-Access .zip** (version + changelog + step list) + a **guaranteed-stable backup** link + an **install video**. Award the **+100 "extension installed" credit** here (already in the earn rules). Replace the placeholder store URL once published.

### 2.12 Cómo Usar la App (P2) + Tips/Blog (P3)
- **How-to-use**: tutorial videos + the **5-step** guide (install → base profile → detailed experience → FAQ answers → apply with AI) with deep-links. Great for activation.
- **Blog/Guides**: category-filtered SEO articles (ATS, cover letters, interview prep, LATAM salaries, ChatGPT prompts) + **comparison pages** (vs ChatGPT / vs Trabajando / vs CV Maker) + a lead-gen **quiz**. Drives organic acquisition.

---

## 3. Cross-cutting: credit-priced AI + furniture
- **Every AI action spends credits** via the existing credit service: show "(N cr)" on the button, `spend()` before calling the LLM, and an "out of credits → earn/upgrade" modal. Costs to mirror: Super-CV 1000, Personalized letter 200, skill-suggest 50, personal-analysis 10, public-summary 50, cargo-suggest 5; base-letter 3 free/then paid. Premium plans grant a monthly allotment + unlock Estilo.
- **Welcome-offer countdown** banner (first-7-days urgency) + bonus credits.
- **WhatsApp/support** floating button + **notification center** (streak reminders, trial ending, new docs, application status).
- **Public header/footer** parity: header (Supported portals, Browse talent, Blog, Pricing, Dashboard); footer (comparativas, guías, empresa, legal) + the **public "supported portals" page** (a brief requirement).
- **Mobile-responsive** app shell (collapsible sidebar) — the competitor is used on phones.

## 4. Extension overhaul (ties it together — P0/P1)
From `FUTURE_DEVELOPMENT_PLAN.md` §5, now sharpened by the screens: rich popup (credit balance + streak + portal compatibility), **in-popup cover-letter generation** (adapt the base letter / Super-letter), **FAQ-driven open-text autofill** (consume `/faq`), inline **ATS quick-score**, **auto-create Application on submit** (fills Historial), CV-version picker (from the library), guided first-run + supported-portals indicator, MV3 resilience + AES token + DOMPurify + server-side credential decrypt.

---

## 5. Sequencing & effort

**Sprint 1 (P0 — monetization + core value):**
1. Credit-priced AI wiring (Section 3) — connects the shipped credit economy to real spend.
2. **Optimizar CV & Carta** (Super-CV X-Y-Z + Personalized letter) + save to **library**.
3. **Plans** with credit tiers + referral-code redeem + manual-payment validation.
4. **Mis Datos Base** depth (base letter, preferences upgrade, skill-suggest + avoid, personal analysis, certs/projects).

**Sprint 2 (P1 — engagement + extension):**
5. **Extension overhaul** (popup, FAQ autofill, in-popup letter, auto-track) + the rich **Install** page.
6. **Documents library** + **Historial** reframe + manual application.
7. **Experiencia detallada** editable + AI extract.
8. **Entrevista IA** (text first, voice next).

**Sprint 3 (P2/P3 — growth):**
9. **Public talent profile** + recruiter search; **Referral/Gana Dinero**; **Estilo** PRO.
10. **Cómo usar la app** + **Blog/Guides** + comparison pages + quiz; **notifications**, WhatsApp, welcome-offer; mobile polish.

**Data-model additions:** baseCoverLetter, skillsAvoid, analysis, certifications/projects, writingStyle (profile JSON); `public_profiles`, `interview_sessions`, `referrals`/`referral_payouts`; plan→credit-allotment mapping; document-library list; notifications. **Adopt Alembic + plan the Postgres move first** (these are schema-heavy).

**Foundations already in place:** credits + ledger + check-in, FAQ, paste-CV, completion %, trial — so Sprint 1 builds directly on them.
