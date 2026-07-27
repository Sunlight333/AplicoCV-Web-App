# AplicoCV — Platform Pivot: Future Development Plan

**Context:** Client proposal to reposition AplicoCV from an *autocomplete tool* (extension-centric)
to an *AI job-search platform*, where autocomplete becomes a **bonus feature** rather than the
product. Trigger: autocomplete is inherently fragile (portals change their UI, use custom widgets,
or block automation — as we are experiencing with Workday), so betting the whole product on it is a
single point of failure.

---

## 1. Assessment — the strategy is right, and it's low-risk

**The strategic logic is sound.** Autocomplete depends on third-party DOM stability we don't control;
every portal redesign is a regression we must chase. An AI platform (CV adaptation, cover letters,
interview prep, tracking, ATS) is defensible, higher-margin, and doesn't break when LinkedIn or
Workday ships a UI change. Repositioning autocomplete as a "when it works, it's a bonus" accelerator
removes the disappointment risk the client correctly identifies.

**The crucial point that de-risks this pivot: ~80–90% of the "real product" is already built.**
This is a *repositioning + surfacing* effort, not a rebuild. Inventory of the current codebase:

| Client's "real product" | Status in code today |
|---|---|
| CV Builder with AI | ✅ Exists — profile builder + AI parsing/optimization |
| **Adapt CV per job offer** | ✅ Exists — `/ai/super-cv` generates a role-tailored CV **and saves it** as a `Document` (kind `optimized_cv`) with ATS score + target role |
| Cover letters | ✅ Exists — `/cover-letters/generate` and `/ai/cover-letter-pro` |
| Automatic answers to FAQs | ✅ Exists — `/ai/field-answer` (used by the extension too) |
| Interview preparation | ✅ Exists — `/ai/interview/start`, `/feedback`, `/history` |
| Application tracking | ✅ Exists — `applications` router + Tracking (Kanban) UI |
| ATS analysis | ✅ Exists — `/ats/score` (free) + `/ai/ats-simulate` (deep) |
| Organize / monitor searches | ✅ Exists — `monitoring`, `recommendations`, `insights` routers |
| Salary / market insights | ✅ Exists — `/ai/salary-insights`, Market page |
| **Adapt LinkedIn** | ❌ **Gap** — no dedicated LinkedIn-optimizer feature |
| CV **variants library** (Marketing / Sales / Product…) | 🟡 **Partially** — variants are already generated & saved per role via Super-CV + `/documents/library`; missing the first-class **UX** that presents them as a managed library |
| Autocomplete extension | ✅ Exists — now demoted to "bonus" |

**Conclusion:** The platform the client wants to sell is mostly already implemented. The work is to
(a) **reframe** the product around it, (b) **surface** the CV-variants library as the hero, and
(c) build the **one genuine new feature** (LinkedIn optimizer). That is a far smaller, far less risky
scope than it sounds — and it's exactly why the pivot is a good idea.

---

## 2. The hero promise & feature

> **"No adaptes más tu CV manualmente. La IA lo adapta a cada empleo."**
> CV para Marketing · CV para Ventas · CV para Producto · CV para Director Comercial · CV para Customer Success

**Feature: "Your CVs" — a managed CV-variants library.** One base CV → unlimited role-targeted
variants, each with its ATS score, generated on demand and saved. The backend already does this
(Super-CV saves an `optimized_cv` Document per role; `/documents/library` lists them). What's missing
is the **UX that makes it the center of the product**:

- A "Your CVs" screen: base CV + a grid of role variants (Marketing, Sales, Product…), each showing
  ATS score, last updated, download / apply.
- "Adapt for a new role" as a one-click primary action (target role or pasted job description).
- Regenerate / update a variant when the base CV changes.
- This becomes the **onboarding aha-moment**: upload CV once → get 3 role-tailored versions in a minute.

---

## 3. Phased plan

### Phase 0 — Repositioning (fast, ~1 week) — *mostly no new backend*
The highest-leverage, lowest-effort work. Change the story, not the engine.
- **Landing / marketing:** lead with "AI job-search copilot / platform." Hero = CV adaptation, not
  "one-click apply." Move the extension to a secondary "+ bonus accelerator" section.
- **Onboarding:** first run = upload CV → generate role variants (deliver value before any portal).
- **App IA / navigation:** foreground CV variants, cover letters, interview prep, tracking; the
  extension becomes one item, not the home.
- **Pricing framing:** present as a platform subscription (Pro) whose value is the AI suite; the
  extension is included, not the reason to pay. (Catalogue already supports this — CLP plans exist.)
- **Copy everywhere:** autocomplete described as "accelerates form-filling *when the portal allows it*"
  — sets honest expectations and removes the fragility-driven disappointment.

### Phase 1 — Hero feature: CV-variants library UX (~1–2 weeks)
- Build the "Your CVs" screen on top of the existing `/documents/library` + `/ai/super-cv`.
- Make "Adapt for a role" the primary CTA across Dashboard, Profile, and post-onboarding.
- Show ATS score per variant; one-click download / send to a job / attach in tracking.

### Phase 2 — Fill the genuine gaps (~2–4 weeks)
- **LinkedIn optimizer (net-new):** `/ai/linkedin-optimize` — rewrite headline, About, and
  experience bullets for a target role; provide copy-paste blocks. This is the one real build.
- **"Apply-ready pack" flow:** from one job description → tailored CV variant + cover letter +
  suggested FAQ answers, bundled. Ties the existing pieces into one satisfying flow.
- **Interview prep depth:** role- and job-specific question sets, saved sessions surfaced in the UI.
- **Tracking polish:** auto-log from the extension when it *does* fill; manual add always available.

### Phase 3 — Retention & scale (ongoing)
- Activation metrics (upload → first variant → first application) and a real dashboard of the user's
  search (variants, applications, interviews, follow-up reminders).
- Packaging/pricing experiments around the platform value.
- Content / SEO around "CV for <role>" — matches the hero promise and is naturally scalable.

### Ongoing — Autocomplete as a best-effort bonus
- Keep the v1.4.9 improvements and continue portal-specific fixes (Workday) opportunistically, but
  **it is no longer the promise.** Frame it as "saves you time when it can," never "applies for you."

---

## 4. Risks & recommendation

- **Risk if we DON'T pivot:** the product's perceived value rises/falls with portal DOM stability we
  can't control; every Workday/LinkedIn change is a fire. Hard to sell, hard to retain.
- **Risk of the pivot:** mostly messaging/positioning risk, plus one new feature (LinkedIn). Low,
  because the platform features already exist and are already paid-tier.
- **Recommendation: yes — pivot.** It aligns the *positioning* with what is *already built*, removes
  the single point of failure, and is more scalable. Start with **Phase 0 (repositioning)** — it is
  cheap, reversible, and immediately reduces the disappointment risk — then surface the CV-variants
  hero (Phase 1) and build the LinkedIn optimizer (Phase 2).

**One-line answer to the client:** *Sí — el core debería ser la plataforma de IA, no el autocompletado.
Y la buena noticia es que ~el 90% ya está construido; esto es reposicionar y potenciar lo que existe,
no empezar de cero.*
