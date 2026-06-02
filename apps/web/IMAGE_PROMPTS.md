# AplicoCV — Landing Image & Icon Generation Brief

Personalized prompts for every visual asset on the landing page. File names and
paths map to real components in `apps/web`. Generate, then drop each file at the
exact path listed; the wiring notes say which component consumes it.

## Brand constants (paste into every prompt)

- **Brand gradient:** `linear-gradient(110deg, #0a74f0 → #7341ff → #1fbef0)` — electric blue → violet → cyan
- **Core colors:** electric blue `#0a74f0`, violet `#7341ff`, cyan `#1fbef0`, deep navy `#0b1426`, near-white `#f7f9fc`
- **Aesthetic:** clean, modern, light & airy, generous whitespace, soft long shadows, subtle glassmorphism, rounded corners (~16px). Apple/Linear/Stripe-grade polish.
- **Typeface in any rendered UI text:** Inter.
- **Product:** AplicoCV — AI that autofills job applications across LATAM/global portals. Audience is Spanish-speaking job seekers, so **all in-image text is in Spanish.**
- **Negative (avoid):** clip-art, stock-photo cheesiness, lens flare, heavy drop shadows, dated gradients, watermarks, distorted hands/faces, gibberish UI text.

---

## 1. HERO — the centerpiece (specially designed)

The hero is a two-column layout: Spanish headline on the left, product visual on
the right. Today the right side is an animated CSS mockup (`HeroMockup.tsx`). These
hero assets elevate it. Produce **all three**.

### 1a. Hero product hero-shot (primary)
- **Path:** `apps/web/public/hero/hero-app.png`
- **Format:** PNG, transparent background, 1600×1200, @2x.
- **Prompt:**
  > A floating, photorealistic 3D render of a modern SaaS web-app dashboard for
  > "AplicoCV", shown on a frameless glass browser card tilted slightly in 3D space
  > (≈8° perspective), soft realistic shadow beneath. The screen shows a job
  > application form auto-filling itself: labeled fields in **Spanish** — "Nombre
  > completo: Alex Morgan", "Correo electrónico", "Puesto actual: Ingeniero
  > Frontend Senior", "Años de experiencia: 6 años" — each field with a small green
  > check ✓ as it fills. A floating pill widget overlaps the bottom-right corner
  > with the AplicoCV logo (white chevron "A" mark) and the text "Rellenando 3/5
  > campos…". Clean Inter typography, light UI on near-white `#f7f9fc`, accent
  > buttons in electric blue `#0a74f0`. Around the card, soft out-of-focus gradient
  > orbs in electric blue, violet `#7341ff`, and cyan `#1fbef0`. Premium, airy,
  > minimal. Studio product-render lighting. Transparent background.

### 1b. Hero ambient background glow (atmosphere layer)
- **Path:** `apps/web/public/hero/hero-glow.png`
- **Format:** PNG, 2400×1400, sits behind the hero at low opacity.
- **Prompt:**
  > An abstract, ultra-soft aurora gradient mesh on a near-white canvas. Three
  > diffuse blooms — electric blue `#0a74f0` top-center, violet `#7341ff` upper
  > right, cyan `#1fbef0` lower left — heavily blurred (Gaussian, 120px), very low
  > saturation, like light through frosted glass. No hard edges, no objects. Faint
  > dotted grid texture barely visible. Calm, premium, breathable. Light mode.

### 1c. Hero floating UI chips (decorative accents)
- **Path:** `apps/web/public/hero/hero-chips.png`
- **Format:** PNG, transparent, 1200×1200.
- **Prompt:**
  > A small set of glassmorphism UI chips floating in 3D space, transparent
  > background. One green pill "✓ Postulación enviada", one card showing a circular
  > ATS score ring at "88%" labeled "compatibilidad", one chip with stacked portal
  > avatars and "+11 portales". Frosted glass, thin white borders, soft shadows,
  > electric-blue/violet/cyan accents, Inter font. Tiny, crisp, premium. They will
  > be scattered around the hero as parallax decorations.

---

## 2. FEATURE ICONS (×6)

Replaces the inline stroke-SVGs in `Features()` (array `featureIcons`). Order and
meaning are fixed by `t.features.items`. **Consistent set** — same grid, weight,
and gradient treatment across all six.

- **Format:** SVG (preferred) or PNG transparent, 96×96, on a rounded-square tile
  filled with the brand gradient OR a duotone line icon that turns white on
  gradient hover. Line weight 2px, rounded caps, geometric, modern.
- **Shared style prompt prefix:**
  > Modern duotone line icon, 2px rounded strokes, geometric, minimal, electric-blue
  > `#0a74f0` to violet `#7341ff` gradient stroke, transparent background, 96×96,
  > centered, generous padding. Crisp at small sizes. Matching set.

| # | Path | Concept (icon prompt) |
|---|------|------------------------|
| 1 | `apps/web/public/features/autofill.svg` | "Universal autofill — a magic wand sparkle filling a form field with a checkmark" |
| 2 | `apps/web/public/features/tailoring.svg` | "AI CV tailoring — a document with sliders/sparkles reshaping its lines" |
| 3 | `apps/web/public/features/ats-score.svg` | "ATS match score — a circular gauge/ring with a rising needle" |
| 4 | `apps/web/public/features/cover-letter.svg` | "Cover letters — an envelope with a sparkle and lines of text" |
| 5 | `apps/web/public/features/tracking.svg` | "Application tracking — a Kanban board with three columns and a moving card" |
| 6 | `apps/web/public/features/job-agent.svg` | "Beta AI job agent — a friendly robot head with a radar/scan arc" |

---

## 3. "CÓMO FUNCIONA" STEP ILLUSTRATIONS (×3)

Optional richer art for the 3-step `HowItWorks()` cards (currently just numbers
01/02/03). Spot illustrations, all in one consistent style.

- **Format:** PNG transparent or SVG, 320×240, light, airy isometric vignettes.
- **Shared style:** soft isometric 3D, pastel + brand-gradient accents, near-white
  base, subtle shadows, no text inside the art.

| # | Path | Prompt |
|---|------|--------|
| 1 | `apps/web/public/steps/step-upload.png` | "Isometric illustration: a CV/PDF document being dropped into a glowing upload tray, AI sparkles rising. Spanish-context resume. Electric-blue accent." |
| 2 | `apps/web/public/steps/step-extension.png` | "Isometric illustration: a Chrome browser window with the AplicoCV puzzle-piece extension snapping into the toolbar, violet accent." |
| 3 | `apps/web/public/steps/step-apply.png` | "Isometric illustration: a cursor clicking one glowing button, a form filling itself with green checks cascading, cyan accent." |

---

## 4. BRAND MARKS

### 4a. Favicon / app mark (refine existing)
- **Path:** `apps/web/public/favicon.svg` (exists — this is an upgrade) + export `apps/web/public/icon-512.png`
- **Prompt:**
  > A minimalist app icon: rounded-square (radius 22%) filled with the brand
  > gradient (electric blue → violet → cyan, 110°), a clean white chevron "A" mark
  > (an upward peak with a small dot below, like a mountain/check hybrid) centered.
  > Flat, crisp, premium, no bevels. Scales to 16px.

### 4c. 3D rendered logo (hero mark)

The signature brand object — a 3D version of the AplicoCV chevron "A" mark, for use
in the hero, OG image, app stores, and press. Produce **two crops**.

- **Path (primary, square):** `apps/web/public/brand/logo-3d.png`
- **Path (wordmark lockup):** `apps/web/public/brand/logo-3d-wordmark.png`
- **Format:** PNG, transparent background, 2000×2000 (square) and 2400×1000 (lockup), @2x.
- **Prompt (square mark):**
  > A modern, minimal **3D-rendered logo** floating on a transparent background.
  > The icon is a single bold chevron letter **"A"** — an upward peak (like a clean
  > mountain or upward arrow) with a small sphere/dot resting just below the apex.
  > Rendered as a smooth, rounded, extruded 3D object with soft beveled edges,
  > finished in a glossy **brand gradient** that flows electric blue `#0a74f0` →
  > violet `#7341ff` → cyan `#1fbef0` across the surface. Subtle frosted-glass
  > translucency on the edges, a gentle internal glow, and one soft realistic shadow
  > beneath it. Studio product lighting, three-quarter `~15°` perspective, premium
  > and weightless — like an Apple/Linear product mark. Extremely clean, minimal,
  > no text, no background, lots of negative space. Octane/Redshift render quality,
  > 8k, transparent PNG.
- **Prompt (wordmark lockup):**
  > The same 3D gradient chevron-"A" mark on the left, next to the wordmark
  > **"AplicoCV"** set in bold Inter — "Aplico" in deep navy `#0b1426` and "CV" in
  > the brand gradient — horizontally locked up, vertically centered, generous
  > spacing. Transparent background, clean, premium, minimal.
- **Wiring note:** the current [`Logo.tsx`](src/components/Logo.tsx) draws a flat
  SVG chevron. Keep that flat SVG for in-app UI (crisp at 16–36px); use these 3D
  renders only for hero/marketing/OG where size ≥ 64px.
- **Consistency:** the 3D mark must read as the same glyph as the flat favicon
  (prompt 4a) — same peak-plus-dot silhouette, just extruded. Don't redesign the
  shape.

### 4b. Open Graph / social share image
- **Path:** `apps/web/public/og-image.png`
- **Format:** PNG 1200×630 (exact — for `<meta og:image>`).
- **Prompt:**
  > A social share banner on a near-white background with a soft brand-gradient
  > aurora in the corners. Left: the AplicoCV wordmark (Aplico in navy `#0b1426`,
  > "CV" in the brand gradient) above the **Spanish** headline "Postúlate a cada
  > empleo que encaje — en un clic." in bold Inter. Right: the floating glass app
  > card from prompt 1a (smaller). Bottom strip: faint row of job-portal names
  > (LinkedIn, Workday, Indeed, Computrabajo…). Clean, premium, lots of whitespace.

---

## 5. TESTIMONIAL AVATARS (×3)

Replaces the initial-letter circles in `Testimonials.tsx` (María, James, Sofía).

- **Path:** `apps/web/public/avatars/maria.png`, `apps/web/public/avatars/james.png`, `apps/web/public/avatars/sofia.png`
- **Format:** PNG, 200×200, square (component masks to a circle).
- **Prompts:**
  - `maria.png` → "Photorealistic friendly headshot of a Latina product designer, early 30s, warm smile, soft studio lighting, neutral light-gray background, professional but approachable."
  - `james.png` → "Photorealistic friendly headshot of a Black male data analyst, 30s, glasses, warm smile, soft studio lighting, neutral light-gray background."
  - `sofia.png` → "Photorealistic friendly headshot of a Latina frontend engineer, late 20s, natural smile, soft studio lighting, neutral light-gray background."
- **Note:** Use synthetic/AI faces or properly licensed stock — never real people without consent.

---

## 6. PORTAL LOGOS (logo strip / compatibility)

`LogoStrip()` currently renders portal **names** as text. To show real marks
instead, fetch official brand SVGs (do **not** AI-generate trademarks):

- **Path:** `apps/web/public/portals/{linkedin,workday,indeed,glassdoor,getonbrd,computrabajo,bumeran,zonajobs,laborum,konzerta,remoteok,weworkremotely,trabajando,weremoto}.svg`
- **Source:** each portal's official press/brand kit, or a vetted icon set
  (e.g. simple-icons) where the trademark license permits. Monochrome `navy-300`
  versions for the muted ticker; full-color on hover.

---

## Directory plan (create under `apps/web/public/`)

```
public/
├─ hero/      hero-app.png  hero-glow.png  hero-chips.png
├─ features/  autofill.svg  tailoring.svg  ats-score.svg  cover-letter.svg  tracking.svg  job-agent.svg
├─ steps/     step-upload.png  step-extension.png  step-apply.png
├─ avatars/   maria.png  james.png  sofia.png
├─ portals/   linkedin.svg … (×14)
├─ og-image.png
├─ icon-512.png
└─ favicon.svg  (refined)
```

## Recommended tools per asset type

- **Hero renders / step illustrations / avatars (raster):** Midjourney v6, DALL·E 3,
  or Flux — paste the prompt verbatim; request transparent PNG where noted.
- **Feature icons / favicon / marks (vector):** I can generate these directly as
  clean SVG in-repo (no external tool) — they're geometric and on-brand.
- **Portal logos:** official brand kits / simple-icons (licensing-safe), not AI.
