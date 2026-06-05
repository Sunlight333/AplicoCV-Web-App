# AplicoCV — Future Development Plan (Competitor-Driven)

**Date:** 2026-06-05
**Inputs:** Competitor teardown of **Postula Fácil** (https://www.postulafacil.cc — landing/pricing/footer + a full in-app screenshot of "Mis Datos Base"), the client brief (`ProyectoAplicoCvEnglish.docx`), the dev plan (`AplicoCV_Development_Plan.md`), and the current shipped build.

This plan is organized as: **(2)** what the competitor does, **(3)** the gap vs our build, **(4)** a phased roadmap with feature-level specs, **(5)** an extension overhaul, **(6)** UX/user-friendliness work, and **(7)** sequencing & effort.

---

## 1. Executive summary

We have a solid MVP (auth, CV parse, profile, tracking, AI tools, billing scaffolding, extension, trial). The competitor is ahead in **four strategic dimensions** we largely lack:

1. **A credits + gamification economy** — profile-completion rewards, daily check-in streaks, a 30-day reward calendar, and a freemium model where AI actions cost credits. This is their primary engagement and conversion engine. We have only a binary free/premium gate.
2. **A much deeper profile surface ("Mis Datos Base")** — base cover letter, FAQ answer-bank, technical-skill suggestions (+ "tools I don't want"), AI personal analysis, certifications, portfolio, projects, richer preferences, and per-section completion %.
3. **AI experiences we don't have** — voice **AI Interview** practice, **Super-CV ATS** rewrite (X-Y-Z formula, 95% target), a generated-documents **library**.
4. **A two-sided / growth layer** — **public profiles + "browse talent"**, **referral/"earn money"**, comparison/SEO pages, WhatsApp support, urgency offers.

The client brief *also* asks for several of these (ATS simulator, predictive score, ghost recruiter, multilingual, autonomous agent) plus aspirational features (interview memory, feedback loop, market heatmap, etc.). This plan unifies competitor parity + brief completion into one roadmap, and rebuilds the **extension** from "simple autofill" into a real in-page assistant.

---

## 2. Competitor teardown — Postula Fácil

### 2.1 Credits & gamification economy (their core loop)
- **Profile-completion credits:** CV +50, Preferencias +25, Experiencia +25, 5 FAQs +25, **Extensión +100** (install the extension), Estilo +50 — up to **275 free credits**.
- **"Impulso Diario" (Daily Boost):** a **30-day streak**. Daily **Check-in = +10 credits**; an **action bonus** ("spend 10 credits applying" → reward, progress 0/10); a **30-day calendar** with **Completado / Hoy / Especial** states; **days 7, 14, 21, 30 double the reward**; check-in resets at 00:00.
- **AI actions cost credits:** "Generar Sugerencias (50 pts)", "Análisis Personal — Generar con IA (10 pts)", base cover letter "Generar con IA · Gratis 3/3" (free quota then paid).
- **Welcome-offer countdown:** urgency timer ("Oferta bienvenida: 6d 23h 58m"), "+100 extra applications in your first 7 days."
- **"Gana Dinero" (Earn money):** referral / affiliate / ambassador program.

### 2.2 Profile surface ("Mis Datos Base")
1. **Currículum Vitae** as **pasted text** ("the main source for the AI") — in addition to upload.
2. **Base Cover Letter** — a reusable generic letter the AI adapts per application (with free AI-generate quota).
3. **Profile & Preferences** — salary (single **or** range; CLP; **Líquido/Bruto** = net/gross), country + city, **work mode** (remote/hybrid/onsite), **availability** (immediate/2 wk/1 mo/other), **legal & visa status** (citizen/PR, valid work visa, in-process, needs sponsor), languages.
4. **Technical Skills** — tag input + **popular suggestions** + **AI suggestions** (analyze CV → recommend tech, 50 pts) + **"Tools I do NOT want to use"** (negative preferences).
5. **Personal Analysis (AI)** — Key Strengths (3-5), Weaknesses/Improvement areas, Motivation for change.
6. **Certifications**, **Portfolio/Website links**, **Personal Projects** (toggleable sections).
7. **Per-section completion %** shown in the sidebar (Mis Datos 0%, Experiencia 0%, Estilo 0%…).

### 2.3 Apply & AI tools
- **Optimizar CV & Carta** — optimize CV + cover letter per job offer.
- **Entrevista IA** — **voice interview practice**.
- **Super CV ATS** — rewrite each experience with the **X-Y-Z formula** ("FAANG recruiter" method), targeting **95%+ ATS match**, keyword integration.
- **Results:** **Historial** (history) + **CVs y Cartas Generados** (library of generated CVs & letters).

### 2.4 Public / two-sided & growth
- **Perfil Público** (public profile) + **"Buscar talento"** (recruiters browse candidates).
- **Estilo (Style) — PRO**: CV templates/themes.
- **Marketing/SEO:** comparison pages (**vs ChatGPT, vs Trabajando, vs CV Maker**), guides (ATS CV, cover letters, interview prep, **LATAM salaries 2026**), a **Quiz** lead-gen, **Press / Ambassadors / Affiliates**, **blog**.
- **Support/retention:** floating **WhatsApp** button, **notification bell**.

### 2.5 Extension v3.0
- Autofill on **20+ portals**, **in-extension cover-letter generation**, **direct submission without leaving the extension**.

### 2.6 Pricing
- **Gratis** — 200 credits, basic ATS CV, 1 free letter, autofill 20+ portals.
- **Activa** — $3,990 CLP/mo (~US$4), ~200 applications/mo, unlimited letters, optimized ATS CV.
- **Urgente** — $9,990 CLP/mo (~US$10), ~700 applications/mo, +100 bonus credits, voice interview.

---

## 3. Gap analysis (competitor + client brief vs our build)

| # | Feature | Competitor | Client brief | AplicoCV today | Priority |
|---|---|---|---|---|---|
| 1 | Credits + gamification economy (earn/spend, streaks, calendar) | ✅ core | — | ❌ | **P0** |
| 2 | Per-section profile completion % | ✅ | — | ❌ | **P0** |
| 3 | Paste-CV-as-text (alt AI source) | ✅ | ✅ | ❌ (upload only) | **P0** |
| 4 | Base reusable cover letter | ✅ | partial | ❌ | **P1** |
| 5 | FAQ answer-bank (open-text autofill source) | ✅ | ✅ "smart responses" | ❌ | **P0** |
| 6 | AI skill suggestions + "skills I don't want" | ✅ | — | ❌ | **P1** |
| 7 | AI Personal Analysis (strengths/weaknesses/motivation) | ✅ | partial | ❌ | **P2** |
| 8 | Certifications / Portfolio / Projects sections | ✅ | partial | ❌ (only generic links) | **P1** |
| 9 | Richer preferences (salary net/gross+range, availability, visa) | ✅ | ✅ complementary | ⚠️ partial | **P1** |
| 10 | Super-CV ATS rewrite (X-Y-Z, 95% target) | ✅ | ✅ "REAL auto-tailoring" | ⚠️ tailor exists, no X-Y-Z engine | **P1** |
| 11 | ATS Simulator (split view, keyword highlights, coverage chart) | ✅ | ✅ dedicated route | ⚠️ basic ATS score only | **P2** |
| 12 | AI Interview (voice practice) | ✅ | ✅ "Job Copilot" adjacency | ❌ | **P2** |
| 13 | Generated documents library | ✅ | ✅ | ❌ (stored, no UI) | **P1** |
| 14 | Optimize-per-job wizard (CV+letter in one flow) | ✅ | ✅ | ⚠️ separate tools | **P1** |
| 15 | CV templates / styling ("Estilo") + PDF export | ✅ PRO | implied | ❌ | **P2** |
| 16 | Public profile + recruiter "browse talent" | ✅ | — | ❌ | **P3** |
| 17 | Referral / affiliate / "earn money" | ✅ | — | ❌ | **P2** |
| 18 | Real job recommendations source (not hardcoded) | ✅ | ✅ Beta Agent | ❌ hardcoded | **P1** |
| 19 | Notifications + WhatsApp/support + urgency offers | ✅ | — | ❌ | **P2** |
| 20 | Marketing/SEO: comparison + guides + quiz + blog | ✅ | "publish portals list" | ❌ | **P3** |
| 21 | Extension: in-popup cover letter + direct submit + FAQ autofill + status | ✅ v3 | ✅ rich extension | ⚠️ basic autofill | **P0** |
| 22 | Manual "Add application" + richer tracking | — | ✅ | ❌ | **P1** |
| 23 | Predictive Apply Score / Ghost Recruiter / One-Click Multilingual | — | ✅ | ⚠️ localize exists; others ❌ | **P2** |

---

## 4. Phased roadmap

> Each phase is shippable on its own. Phases are ordered by **impact-per-effort** and dependency. "BE" = backend, "FE" = web frontend, "EXT" = extension.

### Phase 0 — Foundations & quick wins (1–2 weeks)
Close the cheap gaps that make us look incomplete next to the competitor.
- **0.1 Paste-CV-as-text** (#3). Add a big textarea on the Profile page ("paste your CV — the main source for the AI") that runs the same parse pipeline as upload. *BE: accept `text` in a new `/documents/parse-text`; reuse `extract_profile`. FE: tab/toggle on the re-import modal.*
- **0.2 Per-section completion %** (#2). Compute completeness (personal, experience, education, skills, preferences, FAQ, extension-installed, style) and show a meter in the sidebar + a "complete your profile" banner. *BE: derive from `Profile.data`; FE: progress chips.*
- **0.3 Manual "Add application"** (#22) + fix the dashboard "Analyze new job" link → `/ai-tools`.
- **0.4 Richer preferences** (#9): salary single/range + net/gross, availability, work-authorization/visa — extend the "complementary" tab into a real Preferences screen matching the brief.

### Phase 1 — Profile depth ("Mis Datos Base" parity) (2–3 weeks)
The competitor's profile page is their onboarding moat. Bring ours to parity.
- **1.1 FAQ answer-bank** (#5) — a screen of common application questions ("Why this company?", "Notice period?", "Salary expectation?", "Reason for leaving?", relocation, etc.) the user answers once. **Critical:** this becomes the source the **extension** uses to autofill open-text fields. *BE: `faq_answers` JSON on profile or new table; FE: editable Q&A list with AI-suggest; EXT: consume via `/profiles/me`.*
- **1.2 Certifications, Portfolio links, Personal Projects** (#8) as first-class profile sections (the schema already has `links`; add `certifications[]` and `projects[]`).
- **1.3 Base cover letter** (#4) — store one reusable letter; "Generate with AI" seeds it; per-job tailoring starts from it.
- **1.4 Make the existing profile editor fully editable** (today education/languages/experience-dates are read-only) — add/remove/reorder rows. *(Carried from the completion report.)*
- **1.5 AI skill suggestions + negative skills** (#6) — "analyze my CV → recommend skills" and a "tools I don't want" list (fed to tailoring so the AI never surfaces them).

### Phase 2 — Credits & gamification economy (3–4 weeks) — **highest strategic value**
This is the competitor's engine; it lifts activation, retention, and conversion.
- **2.1 Credit ledger** — `credit_balance` + `credit_transactions` (earn/spend, reason, timestamp). *BE: service + endpoints `GET /credits`, transactional spend wrapper around AI calls.*
- **2.2 Earn rules** — profile-completion grants (CV, preferences, experience, FAQ, **extension install**, style), one-time. *Replaces/augments the binary premium gate: AI actions cost credits; premium = monthly credit allotment + unlimited some actions.*
- **2.3 Daily Boost** — daily check-in (+N), **30-day streak calendar**, action bonus, **double-reward days (7/14/21/30)**, reset at local midnight. *BE: `daily_checkins` table, streak logic; FE: the calendar widget + "Reclamar" button (mirror the screenshot).*
- **2.4 Credit-priced AI** — show "(N pts)" on each AI action; spend on use; "out of credits → upgrade/earn" modal. *Integrate with the existing 7-day trial and Stripe.*
- **2.5 Welcome-offer urgency** — first-N-days countdown banner + bonus credits.
- **2.6 Referral / "Earn money"** (#17) — referral codes, credit rewards for inviter+invitee, a "Gana Dinero" page. (Affiliate/ambassador tier later.)

### Phase 3 — AI experiences (3–5 weeks)
- **3.1 Super-CV ATS rewrite (X-Y-Z)** (#10) — rewrite each experience bullet into "Accomplished X, measured by Y, by doing Z"; targets 95%+ ATS; integrate keywords from the JD. *Extends `tailor_profile` with a dedicated prompt + a side-by-side before/after editor.*
- **3.2 ATS Simulator** (#11) — dedicated route: paste JD → split view (CV with keyword highlights | match-% ring + per-section coverage bar chart + missing-keyword chips with one-click "Add to profile"). *(Matches the client brief exactly.)*
- **3.3 AI Personal Analysis** (#7) — strengths/weaknesses/motivation generator feeding cover letters & interview prep.
- **3.4 AI Interview (Entrevista IA)** (#12) — generate role-specific questions, accept **voice** (Web Speech API) or text answers, give AI feedback (STAR, clarity, keywords). Start text-only, add voice. *(Also seeds the brief's "interview memory.")*
- **3.5 Predictive Apply Score + Ghost Recruiter** (#23) — chance-of-success band + apply/don't-apply strategic note (the brief's features; partly reuses ATS signals).

### Phase 4 — Documents, optimize-flow & templates (2–3 weeks)
- **4.1 Generated-documents library** (#13) — "CVs & Letters" page listing every tailored CV / cover letter (per job, dated), with view/duplicate/download. *Data already stored as `documents`; needs a list endpoint + UI.*
- **4.2 Optimize-per-job wizard** (#14) — one flow: paste JD → ATS score → tailored CV → tailored cover letter → save to library / send to extension.
- **4.3 CV templates + PDF export ("Estilo")** (#15) — 3–5 ATS-safe templates, live preview, server-side PDF render, set as the version the extension/library uses. (PRO-gated.)

### Phase 5 — Two-sided & growth (3–4 weeks)
- **5.1 Public profile** (#16) — opt-in shareable `/u/{handle}` page (clean public CV), SEO-friendly.
- **5.2 "Browse talent"** — recruiter-facing search over opted-in public profiles (filters by skills/location/seniority). (Validate demand before building the recruiter side.)
- **5.3 Notifications + WhatsApp/support + status** (#19) — in-app notification center, email digests, a support channel, urgency/retention nudges.
- **5.4 Marketing/SEO** (#20) — the public **supported-portals page** (a brief requirement), comparison pages, guides/blog, a lead-gen quiz.

### Phase 6 — Extension overhaul (see Section 5).

---

## 5. Extension overhaul — from "simple autofill" to an in-page assistant

Today the extension autofills fields. The competitor's v3.0 generates the cover letter and submits **inside** the extension. To compete, the extension must become the primary surface:

1. **Rich popup** — show profile completeness, credit balance, current-portal compatibility, and the day's check-in (so the extension itself drives the gamification loop; "install extension = +100 credits").
2. **In-popup cover-letter generation** — detect the JD on the page (or paste), generate/adapt the **base cover letter**, edit, and **one-click insert**. (No round-trip to the web app.)
3. **FAQ-driven open-text autofill** — use the **FAQ answer-bank** (Phase 1.1) to fill "Why do you want this role?", notice period, salary, relocation, etc. — the single biggest time-sink the current autofill ignores.
4. **ATS quick-score** — inline "this posting is an 82% match; you're missing: Kubernetes, Terraform" with "add to profile."
5. **Application auto-tracking** — on submit/confirmation page, auto-create the Application (already a backend endpoint) and update status — so the dashboard/board fill themselves.
6. **CV version picker** — choose which tailored CV (from the library/templates) to attach.
7. **Guided onboarding + portal coverage** — first-run walkthrough, a live "supported sites" indicator, graceful manual fallback + CAPTCHA handoff (per the brief).
8. **Resilience & security** (per brief) — MV3 worker-termination resilience via polling, AES token storage, DOMPurify, least-privilege, server-side credential decryption on confirm.
9. **Store readiness** — replace the placeholder store URL once published; wire the "Add to Chrome" + install-detection loop.

---

## 6. UX / user-friendliness (cross-cutting)

- **Guided, progressive onboarding** with the completion meter and credit rewards (turn setup into a game, like the competitor).
- **Empty states that teach** — every empty page (dashboard, applications, library) should show a clear next action, not zeros.
- **Localize the new screens** (password, account, re-import, dashboard card, and everything above) to **ES/PT-BR** — the LATAM market is Spanish-first; the competitor is fully Spanish.
- **Consistent design system** — reuse the redesigned components; ensure the in-app portal matches the new landing quality.
- **Performance** — compress heavy images (hero ~900 KB, 280 KB favicon), ship a small favicon, lazy-load.
- **Mobile-responsive app shell** — the competitor is used on mobile; verify the portal/sidebar collapse.
- **Help & trust** — support channel (WhatsApp/email), tooltips on credit costs, transparent "AI can't invent things — review before sending" messaging (a competitor trust line).
- **Notifications** — streak reminders, "your trial ends in N days," new recommendations, application status changes.

---

## 7. Prioritization & sequencing

**Do first (P0 — parity + engagement foundation):**
Phase 0 (paste-CV, completion %, manual application, richer prefs) → Phase 1.1 FAQ bank → **Phase 2 credits/gamification** → **Phase 6 extension overhaul (popup, FAQ autofill, in-popup letter, auto-track)**.
*Rationale: completion% + credits + a useful extension are the competitor's retention engine and the cheapest path to feeling "complete."*

**Then (P1 — depth & monetization):**
Rest of Phase 1 (profile depth, editable rows, base letter, skill AI) → Phase 3.1–3.2 (Super-CV ATS + Simulator) → Phase 4 (library, optimize wizard, templates) → real recommendations source (#18).

**Then (P2/P3 — differentiation & growth):**
Phase 3.3–3.5 (personal analysis, **AI interview**, predictive/ghost) → Phase 5 (public profiles, referral, notifications, SEO/marketing).

**Rough effort (1 senior full-stack dev):** P0 ≈ 2–3 wks · P1 ≈ 4–5 wks · P2 ≈ 4–6 wks · P3 ≈ 4–6 wks. Parallelizing extension + web roughly halves wall-clock with two devs.

**Data-model additions implied:** `credit_balance` + `credit_transactions`, `daily_checkins`, `faq_answers`, `certifications`/`projects` on profile, `referrals`, `public_profile` (handle/visibility), document-library list, notification table, and the extended preferences/visa/availability fields. Move from SQLite→Postgres and add **Alembic migrations** before this (these are schema-heavy changes — see the completion report).

---

## 8. Immediate next actions (recommended)
1. **Phase 0** quick wins (paste-CV, completion %, manual application, link fix) — days, high visible impact.
2. Spike the **credit ledger + daily check-in** (Phase 2.1–2.3) — the single biggest competitive differentiator.
3. **FAQ answer-bank + extension FAQ-autofill** (Phase 1.1 + 5.3) — closes the most painful real-world autofill gap.
4. Adopt **Alembic migrations** and plan the **Postgres** move before the schema-heavy phases.

---

### Sources
- Competitor app & marketing: [postulafacil.cc](https://www.postulafacil.cc/), [blog](https://www.postulafacil.cc/blog), [dashboard screenshot provided by client]
- Internal: `ProyectoAplicoCvEnglish.docx`, `AplicoCV_Development_Plan.md`, `COMPLETION_REPORT.md`
