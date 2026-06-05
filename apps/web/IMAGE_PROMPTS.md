# AplicoCV — Image Generation Prompts (Round 2)

> The 13 prompts from round 1 (landing/hero background, hero product shot, 6 feature
> icons, 3D logo, OG image, login/register backgrounds, section aurora) have all been
> **generated, placed, and wired in** — so they were removed from this file.
>
> This round covers the **avatars** and the **currently missing icons & images**.
> Paths are relative to `apps/web/`.

## Global style guide (applies to every image)
- **Brand palette:** electric blue `#3392ff`, violet `#8f6cff`, cyan `#1fbef0`, deep navy `#0b1426`, clean white. Blue→violet→cyan is the signature gradient.
- **Mood:** vivid, photorealistic, modern, premium, friendly. Cinematic soft lighting, shallow depth of field, subtle glow, glassmorphism where relevant.
- **Hard rules:** **NO text, letters, numbers, logos, watermarks, or UI copy.** Any interface shown must be abstract/blurred so nothing is legible.
- **Universal negative prompt:** `text, words, letters, numbers, captions, watermark, signature, logo, brand name, UI labels, low-res, jpeg artifacts, deformed hands, extra fingers, distorted face, asymmetric eyes, cluttered, oversaturated, cartoonish, uncanny, plastic skin`

---

# A · Avatars

Used in three places as small circular avatars (currently flat letter placeholders):
the hero social-proof cluster, the auth-panel trust row, and the three testimonials.
Make a **cohesive set of 6 distinct people** — same lighting, framing, and treatment so
they read as one family in an overlapping cluster, but visibly diverse. Soft, very-light
blue-violet studio backdrop (so they sit cleanly inside gradient-ring circles on a
white/navy UI). Head-and-shoulders, looking warmly toward camera, natural authentic
smile. Square, photoreal portrait photography.

**Shared spec:** 600×600, 1:1, JPG. Centered face, even soft key light, gentle rim light, clean shallow-DoF background in pale `#eef2fb`→`#efeaff`. Realistic skin texture, no heavy retouching.

### Avatar 01 — `public/avatars/avatar-01.jpg`
> A confident Latina woman in her late 20s, shoulder-length dark wavy hair, minimal makeup, wearing a soft charcoal knit top, warm genuine smile, looking slightly into the lens. Soft pale blue-violet studio backdrop, gentle cyan rim light. Photoreal head-and-shoulders portrait, premium and approachable.

**Negative:** universal + `harsh shadows, busy background, hat, sunglasses`

### Avatar 02 — `public/avatars/avatar-02.jpg`
> A friendly Black man in his early 30s, short cropped hair, neat short beard, wearing a deep-navy crew-neck, relaxed confident expression with a light smile. Soft pale blue-violet studio backdrop, subtle blue rim light. Photoreal head-and-shoulders portrait, modern and warm.

**Negative:** universal + `harsh shadows, busy background, hat, sunglasses`

### Avatar 03 — `public/avatars/avatar-03.jpg`
> A cheerful East-Asian woman in her mid 20s, straight dark hair tucked behind one ear, wearing a soft white blouse, bright authentic smile. Soft pale violet-blue studio backdrop, gentle warm-cool lighting. Photoreal head-and-shoulders portrait, fresh and optimistic.

**Negative:** universal + `harsh shadows, busy background, hat, sunglasses`

### Avatar 04 — `public/avatars/avatar-04.jpg`
> A approachable South-Asian man in his early 30s, dark hair, clean-shaven, wearing a slate-blue button-up shirt, calm friendly half-smile. Soft pale blue studio backdrop, subtle cyan rim light. Photoreal head-and-shoulders portrait, trustworthy and modern.

**Negative:** universal + `harsh shadows, busy background, hat, sunglasses`

### Avatar 05 — `public/avatars/avatar-05.jpg`
> A warm Middle-Eastern woman in her late 20s, long dark hair, soft natural makeup, wearing a muted teal top, confident gentle smile. Soft pale violet studio backdrop, gentle rim light. Photoreal head-and-shoulders portrait, elegant and friendly.

**Negative:** universal + `harsh shadows, busy background, hat, sunglasses`

### Avatar 06 — `public/avatars/avatar-06.jpg`
> A friendly white man in his mid 30s, light-brown short hair, light stubble, wearing a soft grey henley, easy genuine smile. Soft pale blue-violet studio backdrop, subtle blue rim light. Photoreal head-and-shoulders portrait, casual and credible.

**Negative:** universal + `harsh shadows, busy background, hat, sunglasses`

> **Mapping:** hero + auth clusters use any 5 of the 6; testimonials use 01–03 (matching the female/male persona order). I'll wire them into the components after you generate them.

---

# B · Currently missing icons & images

### B1 · Small favicon / app icon — `public/favicon-32.png` (+ `favicon-16.png`, `favicon-48.png`)
The shipped favicon is the full 603×603, 280 KB logo — far too heavy for a tab icon. Need a tiny, crisp, simplified version of the brand mark.
- **Size / ratio:** export at 16×16, 32×32, 48×48. PNG, transparent.

**Prompt:**
> A minimal flat brand mark: a simple rounded-square tile filled with a blue→violet→cyan diagonal gradient, with a clean white upward chevron/checkmark centered on it. Crisp, high-contrast, legible even at 16 pixels. Flat vector style, no 3D bevels, no gloss, no text. Transparent background.

**Negative:** universal + `3D, glass, photoreal, gloss, gradient noise, fine detail, drop shadow`

### B2 · Product dashboard mockup — `public/screens/dashboard.png`
The landing "Showcase"/proof section currently fakes a card in CSS. A real product visual (like the reference sites) makes it credible. **Transparent background** so it floats in the layout.
- **Size / ratio:** 1600×1100, ~3:2. PNG with alpha.

**Prompt:**
> A sleek, modern SaaS web-app dashboard rendered as a clean 3D browser-window mockup floating at a slight angle, glassmorphic panels with rounded corners. It shows an abstract job-application pipeline (kanban-style columns of soft cards), a circular match-score ring glowing in blue-cyan, a small line chart, and a list of recommendation rows — all rendered as **abstract shapes with NO legible text or numbers**. Brand blue→violet→cyan accents on a light-navy UI, soft shadows, premium product-shot lighting, subtle reflection. Isolated on a fully transparent background.

**Negative:** universal + `readable text, real words, numbers on screen, desk, room, keyboard, harsh shadows, background scene`

### B3 · Empty-state illustration — `public/illustrations/empty-state.png`
For app screens with no data yet (no applications / no recommendations). Friendly, light, encouraging. **Transparent background.**
- **Size / ratio:** 900×700, ~9:7. PNG with alpha.

**Prompt:**
> A friendly minimal 3D illustration: an open empty folder or a tidy inbox tray made of soft matte and frosted-glass material in brand blue→violet→cyan, with a few small floating sparkle particles and a gentle upward arrow of light suggesting "ready to fill." Soft rounded shapes, optimistic and calm, soft contact shadow, generous padding. Isolated on a fully transparent background. No text.

**Negative:** universal + `sad, dark, error symbols, broken, text, busy, background scene`

### B4 · 404 / not-found illustration — `public/illustrations/not-found.png`
The NotFound page is text-only; a light on-brand illustration warms it up. **Transparent background.**
- **Size / ratio:** 900×700, ~9:7. PNG with alpha.

**Prompt:**
> A playful minimal 3D illustration of a small friendly compass or a paper map folding into glowing particles, drifting slightly off course, made of frosted-glass and matte material in brand blue→violet→cyan, with soft floating dots. Light, optimistic "lost but it's okay" mood, soft rounded shapes, gentle shadow, lots of padding. Isolated on a fully transparent background. No text, no numbers.

**Negative:** universal + `text, numbers, 404 digits, dark, scary, error, glitch, background scene`

---

## Production notes
- **Avatars** → create `public/avatars/avatar-01.jpg … avatar-06.jpg`. After generation I'll replace the letter-circle placeholders in `LandingPage.tsx` (hero), `AuthShell.tsx`, and `Testimonials.tsx` with `<img>` avatars.
- **`favicon-32.png`** → I'll wire `<link rel="icon" sizes="32x32">` in `index.html` and keep the big `logo.png` only for apple-touch / large uses.
- **`screens/dashboard.png`** → optional but recommended; I'll drop it into the Showcase section (floating, with the existing glow/ring).
- **Illustrations** → I'll wire `not-found.png` into `NotFoundPage.tsx` and `empty-state.png` into the dashboard/applications empty states.
- Keep avatars as **JPG**; mockups/illustrations/favicon as **transparent PNG**. Compress everything (squoosh/pngquant) before committing — keep avatars < 60 KB each, illustrations < 150 KB.
- Tell me once they're in `public/` (or a "New folder" again) and I'll rearrange + wire them, same as last round.
