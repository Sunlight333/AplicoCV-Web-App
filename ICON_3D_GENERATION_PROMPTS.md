# AplicoCV — 3D Icon Generation Prompts

Prompts to regenerate every site icon as a **highly realistic 3D-rendered object**, to
replace the current flat line icons. Each prompt is **individually written for its own
icon** — there is no shared/generic base prompt. The icons are ordered **public-facing
first** (Tier 1), then the authenticated app shell (Tier 2).

The set is designed to sit beside the existing 3D brand mark (`/logo.png` — a glossy
blue→violet glass crest), so the visual language is: **polished glass, brushed chrome and
navy enamel, lit from the upper-left**, in the brand palette.

---

## Output location & filenames

- **Unified path (all icons go here):** `apps/web/public/icons/3d/`
- **Filename = the icon's code name, lowercase, `.png`** (e.g. `sparkles.png`), so they map
  1:1 onto the existing `IconName` union with zero code churn.
- **Format:** PNG with a real **alpha (transparent) background**.
- **Canvas:** square, **1024 × 1024** (render a 2048² master if possible, downscale to 1024).

## Rules baked into every prompt below

Each prompt already states these, but for the operator's reference:

1. **Transparent background** — no backdrop, no scene, no gradient fill. Export straight
   PNG alpha.
2. **No border, no card, no frame, no plinth.** The object floats freely.
3. **Fill the frame** — the object occupies **~92% of the canvas** with only a hair of
   padding, so it never looks small or lost. Only a soft contact shadow may extend past it
   (also on transparency).
4. **One consistent camera & light** across the set — a slight three-quarter top-down view,
   a soft key light from the upper-left, glossy ray-traced reflections, gentle ambient
   occlusion — so the icons read as one family.
5. **No text, numbers, watermark or logo** on the icon.

**Brand palette:** electric blue `#0A74F0`, sky/cyan `#1FBEF0`, deep navy `#0B1426`,
frosted white, brushed chrome, with a **sparing** violet-magenta accent `#7341FF` (as in
the logo) only where noted.

---

# Tier 1 — Public-facing icons

### 1. `sparkles` — AI magic
- **File:** `apps/web/public/icons/3d/sparkles.png`
- **Used on:** landing "features" grid (leads), marketing pages.
- **Prompt:**
> A large four-point sparkle with a smaller companion spark beside it, cut and polished like
> a flawless sapphire crystal. The gem body is deep electric-blue glass with a luminous
> cyan core glowing from inside and the faintest violet refraction at its heart; crisp chrome
> highlights trace each facet edge. Rendered in photoreal 3D with soft studio light from the
> upper-left, ray-traced internal reflections and a delicate sparkle glint on the top point.
> The two sparkles together fill about 92% of a square frame, centered, floating with a
> whisper of soft contact shadow. Isolated on a fully transparent background — no card, no
> border, no padding, no text. 1024×1024 PNG with alpha.

### 2. `ats` — ATS scan / pass
- **File:** `apps/web/public/icons/3d/ats.png`
- **Used on:** landing features & toolkit, ATS pages.
- **Prompt:**
> A rounded square scanner viewfinder — four bracket corners like a camera focus frame —
> with a bold checkmark caught bright inside it, as if a résumé just passed an automated
> screening. The bracket frame is brushed navy metal with chrome bevels; the checkmark is
> glossy electric-blue glass glowing with a cyan inner light and a sharp specular highlight.
> Photoreal 3D, soft key light from the upper-left, subtle ambient occlusion where the check
> sits over the frame. The object fills ~92% of a centered square frame and floats above a
> faint soft shadow. Fully transparent background, no frame/card/border/padding, no text.
> 1024×1024 PNG with alpha.

### 3. `document` — CV / résumé
- **File:** `apps/web/public/icons/3d/document.png`
- **Used on:** landing features & toolkit, documents.
- **Prompt:**
> A single résumé sheet standing at a gentle three-quarter angle with one corner softly
> curled, a few faint ruled text lines embossed across it. The paper is frosted white glass
> with a smooth electric-blue beveled edge and a subtle cyan sheen along the curl. Rendered
> photorealistically in 3D with soft upper-left studio lighting, delicate self-shadow under
> the curled corner and glossy micro-reflections on the surface. It fills roughly 92% of a
> centered square canvas, floating with a soft contact shadow. Transparent background only —
> no border, no card, no padding, no readable text or numbers. 1024×1024 PNG with alpha.

### 4. `applications` — tracked applications
- **File:** `apps/web/public/icons/3d/applications.png`
- **Used on:** landing features, tracking.
- **Prompt:**
> A clipboard holding a small stack of application forms with a neat checkmark near the top,
> viewed three-quarter from above. The clipboard body is glossy navy enamel with a polished
> chrome spring clip that catches the light; the topmost form is frosted white with a glowing
> electric-blue checkmark and cyan accent line. Photoreal 3D render, soft key light from the
> upper-left, gentle ambient occlusion between the stacked sheets. The clipboard fills about
> 92% of a centered square frame and floats above a soft contact shadow. Isolated on a fully
> transparent background — no card, no border, no padding, no legible text. 1024×1024 PNG
> with alpha.

### 5. `rocket` — launch / getting started
- **File:** `apps/web/public/icons/3d/rocket.png`
- **Used on:** landing features, onboarding CTAs.
- **Prompt:**
> A compact, friendly rocket lifting off at a slight upward tilt, a short cyan flame and a
> curl of vapor at its base. The hull is glossy white ceramic with electric-blue fins, a
> polished chrome nose tip, and a round porthole of cyan glass. Rendered in photoreal 3D with
> soft upper-left studio lighting, crisp specular highlights on the hull and a warm glow from
> the flame. The rocket (with its flame) fills ~92% of a centered square canvas, floating
> above a soft contact shadow. Transparent background only — no launch pad, no border, no
> card, no padding, no text. 1024×1024 PNG with alpha.

### 6. `bolt` — speed / autofill
- **File:** `apps/web/public/icons/3d/bolt.png`
- **Used on:** landing features (autofill), marketing "speed" callouts.
- **Prompt:**
> A single lightning bolt rendered as molten glass, energetic and sharp-edged. The bolt is
> electric-blue translucent glass with a blazing cyan core running through its center and
> mirror-chrome edges; a faint electric aura traces its silhouette. Photoreal 3D with soft
> upper-left key light, strong internal glow and glossy ray-traced reflections. The bolt is
> set on a slight diagonal and fills about 92% of a centered square frame, floating over a
> soft contact shadow. Fully transparent background — no card, no border, no padding, no
> text. 1024×1024 PNG with alpha.

### 7. `optimize` — CV score rising
- **File:** `apps/web/public/icons/3d/optimize.png`
- **Used on:** landing toolkit, optimize.
- **Prompt:**
> An upward-climbing line graph: a glowing plotted line rising left-to-right with a chrome
> arrowhead breaking upward through the top, small bead nodes marking each point. The line is
> a luminous electric-blue glass tube with a cyan glow; the nodes are polished sapphire beads;
> the arrow is brushed chrome with a bright tip highlight. Photoreal 3D, soft light from the
> upper-left, glossy reflections and gentle ambient occlusion beneath the arc. The whole
> ascending shape fills ~92% of a centered square canvas, floating above a soft contact
> shadow. Transparent background only — no axis box, no border, no card, no padding, no text.
> 1024×1024 PNG with alpha.

### 8. `interview` — mock interview
- **File:** `apps/web/public/icons/3d/interview.png`
- **Used on:** landing toolkit, interview prep.
- **Prompt:**
> A rounded speech bubble with a small tail, three soft sound-wave lines curving inside it as
> if someone is speaking aloud. The bubble is glossy electric-blue enamel with a smooth chrome
> rim; the sound lines are glowing cyan glass, and a faint violet highlight catches the top
> curve. Rendered in photoreal 3D with soft upper-left studio lighting, a clean specular
> sweep across the bubble and subtle ambient occlusion around the tail. It fills about 92% of
> a centered square frame, floating over a soft contact shadow. Isolated on a fully
> transparent background — no border, no card, no padding, no text. 1024×1024 PNG with alpha.

### 9. `star` — quality / rating
- **File:** `apps/web/public/icons/3d/star.png`
- **Used on:** landing toolkit, testimonials/ratings.
- **Prompt:**
> A single plump five-point star with softly rounded tips, polished to a jewelry finish. The
> star is warm amber-gold enamel over a metallic core, with a bright mirror specular on the
> upper-left point and a gentle golden rim glow — a premium "top rated" feel that still sits
> beside the blue family. Photoreal 3D, soft key light from the upper-left, glossy ray-traced
> reflections and delicate ambient occlusion in the inner angles. The star fills ~92% of a
> centered square canvas, floating above a soft contact shadow. Transparent background only —
> no border, no card, no padding, no text. 1024×1024 PNG with alpha.

### 10. `gift` — referrals / rewards
- **File:** `apps/web/public/icons/3d/gift.png`
- **Used on:** landing toolkit, rewards/referral mentions.
- **Prompt:**
> A small wrapped gift box seen three-quarter from above, topped with a neat bow. The box is
> glossy deep-navy enamel; the ribbon and bow are electric-blue satin with cyan highlights and
> a soft sheen along each loop. Rendered in photoreal 3D with soft upper-left studio light,
> crisp reflections on the lid edges and gentle ambient occlusion under the bow. The box fills
> about 92% of a centered square frame and floats above a soft contact shadow. Fully
> transparent background — no card, no border, no padding, no text or gift tag. 1024×1024 PNG
> with alpha.

### 11. `target` — goals / job match
- **File:** `apps/web/public/icons/3d/target.png`
- **Used on:** marketing (most-used public icon), matching/goals.
- **Prompt:**
> A bullseye target seen at a slight three-quarter tilt: concentric raised rings around a
> glowing center, with a single dart struck dead-center. The rings alternate deep navy and
> electric-blue glossy enamel with chrome separators; the center is a luminous cyan gem, and
> the dart has a brushed-chrome body with an electric-blue flight. Photoreal 3D, soft
> upper-left key light, ray-traced reflections and subtle ambient occlusion between the rings.
> The target fills ~92% of a centered square canvas, floating above a soft contact shadow.
> Transparent background only — no border, no card, no padding, no text. 1024×1024 PNG with
> alpha.

### 12. `globe` — global reach / portals
- **File:** `apps/web/public/icons/3d/globe.png`
- **Used on:** marketing, supported-portals, language.
- **Prompt:**
> A world globe as a frosted blue-glass sphere with glowing cyan meridian and latitude lines
> wrapping it and faint raised continents suggested beneath the surface. Light electric-blue
> tint deepens toward the edges; a bright specular highlight sits on the upper-left; the
> interior carries a soft cyan glow. Photoreal 3D with soft studio lighting, ray-traced glass
> refraction and a clean rim light. The sphere fills about 92% of a centered square frame,
> floating above a soft contact shadow. Isolated on a fully transparent background — no stand,
> no border, no card, no padding, no text. 1024×1024 PNG with alpha.

### 13. `trending` — market / growth
- **File:** `apps/web/public/icons/3d/trending.png`
- **Used on:** marketing (market insights), growth sections.
- **Prompt:**
> A cluster of ascending bar-chart columns with a chrome arrow sweeping upward across their
> tops, left-to-right. The bars step up in a graduated palette from deep navy to electric-blue
> to cyan, each a glossy rounded block; the arrow is polished chrome with a bright tip glint.
> Rendered in photoreal 3D with soft upper-left key light, glossy reflections on the bar faces
> and gentle ambient occlusion between them. The whole rising group fills ~92% of a centered
> square canvas and floats above a soft contact shadow. Transparent background only — no
> baseline, no border, no card, no padding, no text or numbers. 1024×1024 PNG with alpha.

### 14. `extension` — browser extension
- **File:** `apps/web/public/icons/3d/extension.png`
- **Used on:** marketing (chrome extension), extension pages.
- **Prompt:**
> A single jigsaw puzzle piece seen three-quarter from above with a gentle thickness. It is
> glossy electric-blue enamel with a smooth chrome bevel around every edge and a soft cyan
> inner glow, one knob catching a bright specular highlight. Photoreal 3D render, soft
> upper-left studio lighting, clean ray-traced reflections and subtle ambient occlusion in the
> notches. The piece fills about 92% of a centered square frame, floating over a soft contact
> shadow. Fully transparent background — no card, no border, no padding, no text. 1024×1024
> PNG with alpha.

### 15. `shield` — security / trust
- **File:** `apps/web/public/icons/3d/shield.png`
- **Used on:** marketing (security, privacy), trust badges.
- **Prompt:**
> A rounded heraldic shield standing upright with a bold checkmark embossed on its face. The
> shield body is brushed steel with an electric-blue enamel front panel and a polished chrome
> border; the checkmark glows cyan with a crisp specular. Rendered in photoreal 3D with soft
> upper-left key light, a subtle metallic sheen sweeping the face and gentle ambient occlusion
> along the raised border. The shield fills ~92% of a centered square canvas and floats above
> a soft contact shadow. Transparent background only — no crest banner, no border, no card, no
> padding, no text. 1024×1024 PNG with alpha.

### 16. `pen` — writing / cover letters
- **File:** `apps/web/public/icons/3d/pen.png`
- **Used on:** marketing, cover-letter features.
- **Prompt:**
> An elegant fountain pen at a three-quarter diagonal, nib pointing down-left as if mid-stroke.
> The barrel is deep electric-blue lacquer with polished chrome trim and cap band; the nib is
> mirror chrome with a fine engraved slit and a bright tip glint. Photoreal 3D, soft
> upper-left studio lighting, glossy reflections down the barrel and delicate ambient
> occlusion where the cap band meets the body. The pen fills about 92% of a centered square
> frame diagonally, floating above a soft contact shadow. Isolated on a fully transparent
> background — no paper, no border, no card, no padding, no text. 1024×1024 PNG with alpha.

### 17. `mail` — email / notifications
- **File:** `apps/web/public/icons/3d/mail.png`
- **Used on:** marketing (contact), email capture.
- **Prompt:**
> A closed envelope seen three-quarter from above, its flap forming a clean V, with a small
> glowing cyan notification dot at the upper-right corner. The envelope is frosted white glass
> with smooth electric-blue edge bevels and a subtle cyan sheen along the flap seam. Photoreal
> 3D render, soft upper-left key light, gentle ambient occlusion under the flap and glossy
> micro-reflections on the surface. The envelope fills ~92% of a centered square canvas,
> floating above a soft contact shadow. Transparent background only — no border, no card, no
> padding, no text or address. 1024×1024 PNG with alpha.

### 18. `lock` — privacy / security
- **File:** `apps/web/public/icons/3d/lock.png`
- **Used on:** marketing (privacy, security), credentials messaging.
- **Prompt:**
> A closed padlock standing upright, its shackle a smooth arc. The body is polished navy
> enamel with a chrome faceplate and a small electric-blue keyhole that glows softly; the
> shackle is brushed chrome catching a bright specular on the upper-left curve. Rendered in
> photoreal 3D with soft studio lighting from the upper-left, ray-traced reflections and gentle
> ambient occlusion where the shackle enters the body. The padlock fills about 92% of a
> centered square frame, floating above a soft contact shadow. Fully transparent background —
> no border, no card, no padding, no text. 1024×1024 PNG with alpha.

### 19. `leaf` — wellbeing / growth
- **File:** `apps/web/public/icons/3d/leaf.png`
- **Used on:** marketing (values, wellbeing, sustainability).
- **Prompt:**
> A single smooth leaf at a gentle three-quarter angle with a softly pointed tip. It is
> translucent teal-cyan glass with glowing brighter cyan veins branching from a central rib
> and a dewy specular highlight near the tip. Photoreal 3D render, soft upper-left key light,
> ray-traced glass translucency and a subtle glow through the leaf body. The leaf fills ~92% of
> a centered square canvas, floating above a soft contact shadow. Transparent background only —
> no stem base, no border, no card, no padding, no text. 1024×1024 PNG with alpha.

### 20. `folder` — documents
- **File:** `apps/web/public/icons/3d/folder.png`
- **Used on:** marketing, documents.
- **Prompt:**
> A file folder slightly open, seen three-quarter from above, with a couple of frosted-white
> pages peeking above the front flap. The folder is glossy electric-blue enamel with a raised
> chrome tab and a soft cyan inner glow between the pages. Rendered in photoreal 3D with soft
> upper-left studio lighting, clean reflections on the front panel and gentle ambient occlusion
> under the flap. The folder fills about 92% of a centered square frame and floats above a soft
> contact shadow. Isolated on a fully transparent background — no border, no card, no padding,
> no text or labels. 1024×1024 PNG with alpha.

### 21. `chat` — support
- **File:** `apps/web/public/icons/3d/chat.png`
- **Used on:** marketing (help, contact, support).
- **Prompt:**
> A plump rounded chat bubble with a short tail, three little dots inside as a typing
> indicator. The bubble is glossy cyan glass with an electric-blue rim and a bright specular
> sweep; the three dots are polished white beads with soft highlights. Photoreal 3D, soft
> upper-left key light, ray-traced reflections and subtle ambient occlusion around the tail and
> dots. The bubble fills ~92% of a centered square canvas, floating above a soft contact
> shadow. Transparent background only — no border, no card, no padding, no text. 1024×1024 PNG
> with alpha.

### 22. `brain` — AI intelligence
- **File:** `apps/web/public/icons/3d/brain.png`
- **Used on:** marketing (AI/how-it-works), intelligence features.
- **Prompt:**
> A stylized brain rendered as translucent blue glass, its folds smoothed into clean rounded
> lobes, with glowing electric-blue neural filaments threading through the interior and a few
> tiny violet synapse sparks deep inside. Light cyan glow radiates from within; a crisp
> specular sits on the upper-left. Photoreal 3D with soft studio lighting, ray-traced glass
> refraction and internal light scatter. The brain fills about 92% of a centered square frame,
> floating above a soft contact shadow. Fully transparent background — no stand, no border, no
> card, no padding, no text. 1024×1024 PNG with alpha.

### 23. `activity` — status / uptime
- **File:** `apps/web/public/icons/3d/activity.png`
- **Used on:** marketing (status page), activity indicators.
- **Prompt:**
> A heartbeat pulse line — a single continuous stroke that spikes sharply once and runs flat
> either side — rendered as a glowing neon tube. The line is luminous electric-blue glass with
> a bright cyan core and a soft glow halo, resting on a barely-there brushed-chrome rail.
> Photoreal 3D, soft upper-left key light, glossy reflections and a gentle bloom at the spike.
> The pulse fills ~92% of a centered square canvas horizontally, floating above a soft contact
> shadow. Transparent background only — no grid, no border, no card, no padding, no text.
> 1024×1024 PNG with alpha.

### 24. `help` — help / FAQ
- **File:** `apps/web/public/icons/3d/help.png`
- **Used on:** marketing (help center), FAQ.
- **Prompt:**
> A friendly round badge with a bold question mark raised on its face. The disc is glossy
> electric-blue enamel with a polished chrome rim; the question mark is mirror chrome with a
> soft cyan glow tracing it and a bright specular on its curve. Rendered in photoreal 3D with
> soft upper-left studio lighting, clean ray-traced reflections and subtle ambient occlusion
> around the raised mark. The badge fills about 92% of a centered square frame, floating above
> a soft contact shadow. Isolated on a fully transparent background — no border, no card, no
> padding, no extra text. 1024×1024 PNG with alpha.

### 25. `book` — guide
- **File:** `apps/web/public/icons/3d/book.png`
- **Used on:** marketing (guide, blog), learning.
- **Prompt:**
> A closed hardcover book standing at a three-quarter angle with a slim satin ribbon bookmark
> trailing from the pages. The cover is deep-navy enamel with a chrome spine edge; the page
> block is frosted white with a cyan edge glow; the ribbon is electric-blue satin. Photoreal
> 3D render, soft upper-left key light, glossy reflections on the cover and gentle ambient
> occlusion along the spine. The book fills ~92% of a centered square canvas, floating above a
> soft contact shadow. Transparent background only — no border, no card, no padding, no title
> text. 1024×1024 PNG with alpha.

### 26. `user` — profile / account
- **File:** `apps/web/public/icons/3d/user.png`
- **Used on:** auth pages, profile, nav.
- **Prompt:**
> A smooth, minimal person figurine — a round head above a rounded shoulder bust — sculpted as
> a single glossy object. The form is electric-blue glass with a frosted-white face highlight
> and a chrome collar edge, a clean specular on the upper-left of the head. Rendered in
> photoreal 3D with soft studio lighting from the upper-left, ray-traced reflections and gentle
> ambient occlusion where the head meets the shoulders. The figure fills about 92% of a
> centered square frame, floating above a soft contact shadow. Fully transparent background —
> no ring, no border, no card, no padding, no text. 1024×1024 PNG with alpha.

### 27. `search` — search
- **File:** `apps/web/public/icons/3d/search.png`
- **Used on:** marketing, search inputs.
- **Prompt:**
> A magnifying glass at a three-quarter diagonal, handle to the lower-right. The rim is
> polished chrome; the lens is electric-blue tinted glass with a bright cyan glint and a subtle
> reflection of light across it; the handle is glossy navy with a chrome ferrule. Photoreal 3D,
> soft upper-left key light, ray-traced glass and metal reflections, gentle ambient occlusion
> where the handle joins the rim. The magnifier fills ~92% of a centered square canvas
> diagonally, floating above a soft contact shadow. Transparent background only — no border, no
> card, no padding, no text. 1024×1024 PNG with alpha.

---

# Tier 2 — Authenticated app shell

### 28. `dashboard` — dashboard
- **File:** `apps/web/public/icons/3d/dashboard.png`
- **Prompt:**
> Four rounded square panel tiles arranged in a 2×2 grid with small gaps, floating together as
> one cluster at a slight three-quarter tilt. Two tiles are glossy electric-blue enamel and two
> are deep-navy, each with a chrome bevel and a soft cyan edge glow, catching individual
> specular highlights. Photoreal 3D, soft upper-left key light, ray-traced reflections and
> gentle ambient occlusion in the gaps. The cluster fills ~92% of a centered square canvas,
> floating above a soft contact shadow. Transparent background only — no border, no card, no
> padding, no text. 1024×1024 PNG with alpha.

### 29. `settings` — settings
- **File:** `apps/web/public/icons/3d/settings.png`
- **Prompt:**
> A single mechanical gear seen face-on with a slight tilt, teeth crisply machined. The gear is
> brushed steel with an electric-blue anodized hub at its center and a soft cyan glow in the
> bore; polished chrome catches a bright specular on the upper-left teeth. Rendered in photoreal
> 3D with soft studio lighting from the upper-left, realistic metal reflections and ambient
> occlusion between the teeth. The gear fills about 92% of a centered square frame, floating
> above a soft contact shadow. Fully transparent background — no border, no card, no padding, no
> text. 1024×1024 PNG with alpha.

### 30. `key` — credentials
- **File:** `apps/web/public/icons/3d/key.png`
- **Prompt:**
> A single key lying at a three-quarter diagonal, bow to the upper-left and bit to the
> lower-right. The shaft and bit are polished chrome; the round bow is set with a faceted
> electric-blue gem that glows cyan at its core. Photoreal 3D render, soft upper-left key light,
> mirror reflections along the shaft and a sparkle on the gem, with gentle ambient occlusion
> under the bit. The key fills ~92% of a centered square canvas diagonally, floating above a
> soft contact shadow. Transparent background only — no keyring, no border, no card, no padding,
> no text. 1024×1024 PNG with alpha.

### 31. `card` — billing
- **File:** `apps/web/public/icons/3d/card.png`
- **Prompt:**
> A payment card floating at a three-quarter angle with a subtle thickness. The card is glossy
> deep-navy with a polished electric-blue EMV chip, a thin cyan accent stripe and a soft mirror
> sheen sweeping across it. Rendered in photoreal 3D with soft upper-left studio lighting,
> ray-traced reflections on the face and gentle ambient occlusion at the chip's edge. The card
> fills about 92% of a centered square frame, floating above a soft contact shadow. Isolated on
> a fully transparent background — no numbers, no name, no border, no card holder, no padding.
> 1024×1024 PNG with alpha.

### 32. `logout` — sign out
- **File:** `apps/web/public/icons/3d/logout.png`
- **Prompt:**
> A rounded open doorway with a chrome arrow stepping out through it to the right. The door
> frame is glossy navy enamel with a chrome edge; the arrow is polished chrome with an
> electric-blue glow trailing behind it and a bright tip highlight. Photoreal 3D, soft
> upper-left key light, clean reflections and gentle ambient occlusion inside the doorway. The
> door-and-arrow fills ~92% of a centered square canvas, floating above a soft contact shadow.
> Transparent background only — no wall, no border, no card, no padding, no text. 1024×1024 PNG
> with alpha.

### 33. `grid` — portals / windows
- **File:** `apps/web/public/icons/3d/grid.png`
- **Prompt:**
> A single framed window pane divided into panes by a crossbar, seen at a slight three-quarter
> tilt. The frame is glossy electric-blue enamel with a chrome inner edge; the panes are frosted
> cyan glass with soft reflections and a faint interior glow. Rendered in photoreal 3D with soft
> upper-left studio lighting, ray-traced glass reflections and gentle ambient occlusion along
> the crossbars. The window fills about 92% of a centered square frame, floating above a soft
> contact shadow. Fully transparent background — no wall, no border beyond the window frame
> itself, no card, no padding, no text. 1024×1024 PNG with alpha.

### 34. `referrals` — referrals
- **File:** `apps/web/public/icons/3d/referrals.png`
- **Prompt:**
> Two smooth person figurines side by side, the nearer one slightly larger, linked by a glowing
> electric-blue arc that connects them. The figures are frosted-white glass with electric-blue
> shoulders and chrome collar edges; the connecting arc is a luminous cyan tube. Photoreal 3D,
> soft upper-left key light, ray-traced reflections and gentle ambient occlusion between the two
> figures. The pair fills ~92% of a centered square canvas, floating above a soft contact
> shadow. Transparent background only — no ground, no border, no card, no padding, no text.
> 1024×1024 PNG with alpha.

### 35. `download` — download CV
- **File:** `apps/web/public/icons/3d/download.png`
- **Prompt:**
> A bold downward arrow descending into a shallow open tray, as if a file is being saved. The
> arrow is glossy electric-blue glass with a cyan core glow and a bright specular on its head;
> the tray is brushed chrome with a soft electric-blue inner light. Rendered in photoreal 3D
> with soft upper-left studio lighting, ray-traced reflections and gentle ambient occlusion
> inside the tray. The arrow-and-tray fills about 92% of a centered square frame, floating above
> a soft contact shadow. Isolated on a fully transparent background — no border, no card, no
> padding, no text. 1024×1024 PNG with alpha.

### 36. `copy` — copy / duplicate
- **File:** `apps/web/public/icons/3d/copy.png`
- **Prompt:**
> Two identical rounded cards stacked with a slight offset, the top one lifted a little as if
> just duplicated, seen three-quarter from above. Both cards are frosted-white glass with smooth
> electric-blue edge bevels and a soft cyan sheen; the top card casts a gentle shadow onto the
> one beneath. Photoreal 3D, soft upper-left key light, glossy micro-reflections and clean
> ambient occlusion between the two cards. The pair fills ~92% of a centered square canvas,
> floating above a soft contact shadow. Transparent background only — no border, no outer card,
> no padding, no text. 1024×1024 PNG with alpha.

### 37. `check` — success / done
- **File:** `apps/web/public/icons/3d/check.png`
- **Prompt:**
> A single bold checkmark with softly rounded ends, thick and confident. It is glossy glass
> graduating from electric-blue at the base to bright cyan at the tip, with a mirror specular
> sweeping across it and a soft inner glow. Rendered in photoreal 3D with soft upper-left studio
> lighting, ray-traced reflections and a gentle ambient-occlusion contact where the two strokes
> meet. The checkmark fills about 92% of a centered square frame, floating above a soft contact
> shadow. Fully transparent background — no circle, no border, no card, no padding, no text.
> 1024×1024 PNG with alpha.

---

## After generation — wiring the icons in

Once the PNGs are in `apps/web/public/icons/3d/`, swap the icon renderer so `name` maps to
`/icons/3d/<name>.png` instead of the inline SVG paths — the natural place is
`apps/web/src/components/ui/Icon.tsx` (render an `<img>`), which flows through `IconTile`
and every call site automatically. Because the new art is a full 3D object on transparency,
the colored `IconTile` chip is likely no longer needed on public pages — the object carries
its own material and color, matching the `/logo.png` mark.
