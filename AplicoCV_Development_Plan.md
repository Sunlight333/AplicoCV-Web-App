AplicoCV — Full Development Plan
MVP + Scalable Architecture


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT OVERVIEW AT A GLANCE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AplicoCV is an AI-powered job application platform consisting of two tightly integrated products: a web application where users configure their professional profile once, and a Chrome Extension that auto-fills job application forms across major employment portals worldwide.

The platform is designed to eliminate the repetitive, time-consuming process of manually applying to jobs. A user uploads their CV one time, the AI extracts and structures their professional data, and from that point forward every compatible job application form is completed automatically with a single click. Beyond autofill, the platform acts as a strategic career partner — scoring job matches, tailoring CVs per vacancy, tracking applications, and eventually recommending or autonomously applying to jobs on the user's behalf.


PRODUCT COMPONENTS

  Web Application (React.js + Vite)    — Profile creation, CV upload, dashboard, tracking, settings
  Chrome Extension (MV3)              — Autofill engine, form detection, login automation
  Backend API (Python / FastAPI)      — Business logic, LLM orchestration, data management, document parsing
  Database (PostgreSQL)               — User data, applications, analytics


EXTERNAL DEPENDENCIES REQUIRED

  OpenAI API or Anthropic Claude API     — LLM for CV parsing, autofill mapping, cover letters
  Google OAuth 2.0                       — Social login option
  AWS S3 or Cloudflare R2               — CV and document storage
  Stripe                                 — Subscription billing (Free / Premium tiers)
  Chrome Web Store Developer Account    — Extension publishing and review
  Resend or SendGrid                     — Transactional email (verification, alerts)
  Sentry                                 — Error monitoring across all services
  VPS Provider (DigitalOcean, Hetzner, Vultr, or Linode)   — Single server hosting all services


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 — PREPARATION AND ENVIRONMENT SETUP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This phase produces no user-visible features but is the foundation that prevents critical delays later. Every access credential, platform account, and architectural decision made here affects every subsequent phase.

The monorepo is structured with a clear separation between three workspaces: the React frontend (apps/web), the FastAPI backend (apps/api), and the Chrome extension (apps/extension). Shared TypeScript types used by both the frontend and the extension live in a packages/types directory. This layout avoids version drift across layers and makes it possible to commit changes that span the frontend, backend, and extension atomically. Python dependencies for the backend are managed with Poetry, which locks exact versions and ensures reproducible installs across development and production environments.

The Chrome Web Store Developer Account must be created and the initial extension manifest submitted in this phase. Google's review process for new extensions can take 3–7 business days, and having the account active early ensures no launch delay caused by platform bureaucracy. The manifest declares all required host permissions upfront — this matters because adding permissions post-publication triggers a re-review cycle.

API keys are provisioned and stored: the LLM provider key (OpenAI or Anthropic), AWS S3 credentials or Cloudflare R2 API token for document storage, and Stripe API keys for subscription management. All secrets are managed through .env files with distinct configurations for development, staging, and production. The FastAPI application loads these via Pydantic's BaseSettings class, which validates the presence and type of every required variable at startup — the server refuses to start if a required key is missing, making misconfiguration immediately visible rather than silently broken.

The PostgreSQL database schema is designed in this phase using SQLAlchemy as the ORM and Alembic for migrations. The core tables defined are: users (authentication, plan tier, preferences), profiles (parsed CV data in structured JSON stored in a JSONB column), documents (file references with S3 keys), applications (tracking per portal per job), cover_letters (generated text with associated job URL), and portal_configs (selector mappings per job site). Every schema change from this point forward is expressed as an Alembic migration file, never as a manual database edit.

Authentication architecture is decided here. The FastAPI backend issues JWT access tokens (short-lived, 15 minutes) and refresh tokens (long-lived, 30 days) using the python-jose library. The React frontend stores the access token in memory (not localStorage) and the refresh token in an HttpOnly cookie to mitigate XSS token theft. Google OAuth is implemented via the Authlib library on the backend, which handles the OAuth 2.0 code exchange and issues the same JWT pair on successful Google login. The Chrome extension authenticates against the same FastAPI backend using a dedicated extension token endpoint, storing the result in chrome.storage.local under AES-256 encryption.

Server provisioning and configuration is handled in this phase rather than delegated to a managed platform. The recommended VPS specifications for the MVP are a minimum of 4 vCPUs and 8 GB RAM — enough to run the FastAPI application, two Celery workers, Redis, PostgreSQL, and Nginx simultaneously without resource contention. Providers well-suited for this include Hetzner Cloud (best price-to-performance ratio in Europe), DigitalOcean (straightforward UI and good documentation), Vultr, or Linode. The VPS runs Ubuntu 24.04 LTS as the operating system.

The entire server stack is containerized using Docker and orchestrated with Docker Compose. A single docker-compose.yml file at the root of the repository defines five services: the FastAPI application (uvicorn with multiple workers), the Celery worker, Celery Beat (the scheduler), Redis (broker and cache), and PostgreSQL. This means the full production environment is reproducible locally with a single docker compose up command, eliminating the "works on my machine" class of deployment bugs entirely.

Nginx is installed directly on the host (not containerized) and acts as the reverse proxy in front of all services. It serves the React SPA's built static files from the /var/www/aplicocv directory, proxies /api requests to the FastAPI container on its internal port, handles SSL termination using a Let's Encrypt certificate managed by Certbot with auto-renewal configured as a systemd timer, and sets security headers (HSTS, X-Frame-Options, Content-Security-Policy) at the proxy layer so they apply to all responses. The Nginx configuration defines two server blocks: one for the web app domain serving static files, and one for the API subdomain proxying to FastAPI.

The GitHub Actions CI/CD pipeline is configured to build the React app, run the test suite, and on a successful push to main, SSH into the VPS, pull the latest code, rebuild the Docker images, and run docker compose up -d to redeploy with zero downtime using Docker Compose's rolling restart behavior. The SSH private key used by GitHub Actions is stored as a GitHub Actions secret and never appears in the repository.

Required Access and Accounts for this Phase:

  VPS account provisioned with Ubuntu 24.04 LTS, minimum 4 vCPU / 8 GB RAM
  SSH key pair generated and public key added to the VPS authorized_keys
  Domain registered with DNS A records pointing to the VPS public IP
  Let's Encrypt SSL certificate issued via Certbot for both the web and API domains
  Chrome Web Store Developer account (one-time $5 registration fee)
  OpenAI Platform account with billing enabled, or Anthropic API account
  AWS account with S3 bucket and IAM policy configured, or Cloudflare R2 account
  Stripe account with test mode active and webhook endpoint pointing to the VPS API domain
  Resend or SendGrid account with sender domain verified
  Sentry projects created separately for the frontend and backend
  GitHub repository with branch protection rules, Actions secrets configured (SSH key, env vars), and CI workflow scaffolded


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 2 — WEB APPLICATION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The web application is a React.js Single Page Application built with Vite as the bundler and TypeScript throughout. Tailwind CSS handles all styling using utility classes with a custom design token configuration that establishes the color palette, typography scale, and spacing system globally. React Router v6 manages client-side routing with protected route wrappers that redirect unauthenticated users to the login page. Framer Motion handles all transitions and animations. The design language is clean, modern, and purposefully minimal — generous whitespace, a restrained color palette (deep navy primary, electric blue accent, near-white backgrounds), and smooth micro-animations that reward interaction without cluttering the interface. Page entries fade-slide in, modals scale from center, cards lift on hover with a subtle shadow transition, and loading states use skeleton screens instead of spinners. The overall aesthetic communicates trust and precision — qualities that matter for a product handling someone's career.

All server communication goes through a centralized API client built on top of the native Fetch API, which automatically attaches the Authorization header, handles 401 responses by attempting a token refresh before retrying the original request, and surfaces errors to Sentry. React Query (TanStack Query) manages all server state — caching, background refetching, and optimistic updates — so the UI feels fast and responsive even on slower connections.


Landing Page

The landing page is a single-scroll experience with five distinct sections, each with its own entrance animation triggered on scroll using Intersection Observer via the Framer Motion whileInView prop. The hero section presents the core value proposition with a headline, a brief subheadline, and two CTAs (Get Started Free and Watch Demo). The background uses a subtle animated gradient mesh implemented in CSS — slow-moving, not distracting. Below the hero, an animated "How It Works" section walks through the three-step flow using illustrated steps that animate in sequentially with a staggered delay. A social proof section displays compatible portals as a horizontal ticker (LinkedIn, Workday, Indeed, Greenhouse, Glassdoor, etc.) with a smooth infinite scroll CSS animation achieved via a duplicated list and CSS keyframes. A features grid presents the six core differentiators with icon cards that expand on hover using Framer Motion's layout animation to reveal a brief description without a layout shift. The final section is a pricing comparison table with a toggle between monthly and annual billing, animating the price change with a number counter transition using Framer Motion's useMotionValue and useTransform hooks.


Authentication Pages

Registration and login pages are centered single-card layouts with a split design — the left half shows a rotating testimonial or animated feature highlight, the right half contains the form. Both halves animate in on mount with opposing slide directions. Form validation is inline and real-time, powered by React Hook Form with Zod schemas connected via the zodResolver adapter. Errors appear below each field with a smooth height animation so the layout shift is not jarring. Email verification sends a magic link via the FastAPI backend's email service. Google OAuth is integrated as a one-click button that initiates the OAuth flow via a redirect to the FastAPI authorization endpoint.


Onboarding Flow

First-time users are taken through a three-step onboarding wizard after registration, implemented as a single React component with internal step state managed by useState. A progress bar at the top animates width between steps using Framer Motion's layoutId for a smooth fill transition. Step one asks for job search preferences: target roles, seniority level, preferred locations, remote preference, and salary expectations. These are sent to the FastAPI PATCH /users/me/preferences endpoint and stored. Step two is the CV upload. The interface accepts PDF and DOCX files via drag-and-drop (react-dropzone) or file picker. Files are uploaded directly to the FastAPI POST /documents/upload endpoint, which receives the multipart form data, writes the file to a dedicated directory on the VPS (/var/aplicocv/uploads) with a UUID-prefixed filename to prevent collisions, and stores the file path in the documents table. If the project later requires offloading storage to S3 or Cloudflare R2, only the storage layer of this endpoint needs to change — the rest of the pipeline is unaffected. A progress indicator animates during upload using the Fetch API's upload progress event, then a processing state shows Server-Sent Events streamed from the FastAPI /documents/parse endpoint — the UI displays "Extracting work history...", "Identifying skills...", and "Structuring education..." as the backend progresses through each parsing stage. This is real server-pushed progress, not cosmetic animation. Step three shows the parsed profile in an editable review form before saving, allowing the user to correct any extraction errors before the data is committed.


Profile Page

The profile page is the core configuration interface, implemented as a tabbed layout using React state for tab selection with an animated underline indicator (Framer Motion layoutId shared across tab buttons). The tabs are: Personal Info, Work Experience, Education, Skills, Languages, Links, and Complementary Info. The complementary information tab is a structured freeform section where users add fields that commonly appear in job application forms but are not present in a standard CV — work authorization status, willingness to relocate, visa requirements, notice period, and preferred start date. Each section uses inline editing: clicking a field switches it from display mode to input mode with a smooth opacity and scale transition. Changes are debounced at 800ms and sent to the FastAPI PATCH /profiles/me endpoint, with a subtle "Saved" toast notification that fades in and out via Framer Motion's AnimatePresence.


Extension Download Page

A dedicated page with browser detection using the user agent string, displaying a prominent download button for Chrome users and a polite notice for other browsers. The download button links to the Chrome Web Store listing. A short CSS-animated three-frame walkthrough illustrates the extension icon, the popup interface, and the autofill action in sequence using keyframe animations. Installation instructions are displayed with numbered steps that visually check off as the user progresses — the extension announces its installation to the page via a postMessage event, which the React app listens for and uses to update the step completion state in real time.


Dashboard

The dashboard is the user's home base post-onboarding, structured as a responsive CSS Grid layout with four panels. The first panel shows application statistics — total applications, response rate, interviews received, and time saved — rendered as counting number animations on first mount using a custom useCountUp hook. The second panel is the recent applications list with portal logo, job title, company, date, and status badge. The third panel shows job recommendations with match percentage badges (Beta AI Agent feature). The fourth panel shows the ATS Score for the most recently analyzed job description, displayed as an SVG circular progress ring that fills on mount with a stroke-dashoffset animation. A persistent top navigation bar includes the user avatar, plan badge, and global search powered by a debounced query to the FastAPI GET /applications/search endpoint.


Application Tracking

A dedicated route renders all submitted applications in a Kanban-style board with columns for Applied, Viewed, Interview Scheduled, Offer, and Rejected. Cards are draggable between columns using @dnd-kit/core, which handles accessible drag-and-drop with keyboard support. Column reorder events send a PATCH request to the FastAPI /applications/{id}/status endpoint. Clicking a card opens a side drawer (Framer Motion slide from right) with full application details, the job description, the CV version used, the generated cover letter, and a notes textarea that auto-saves. Filtering controls at the top accept portal, date range, and status as parameters passed to the API query.


Credentials Manager

A settings sub-page where users manage their login credentials for each job portal. Each entry has a portal name with its logo, an email field, and a password field masked by default with a visibility toggle. On save, the frontend sends credentials to the FastAPI POST /credentials endpoint, which encrypts them using the cryptography library's Fernet implementation (AES-128-CBC with HMAC-SHA256) before persisting to the database. The raw password never touches the database. A sync status badge on each entry reflects whether the extension has validated the credentials against the portal.


Subscription and Billing

A settings sub-page powered by the Stripe Customer Portal for plan management and billing history. The FastAPI backend creates a Stripe Customer Portal session via the Stripe Python SDK and returns a redirect URL. The frontend redirects the user to Stripe's hosted portal for all subscription actions — upgrade, downgrade, and cancellation — then redirects back to the app on completion. New subscriptions go through a Stripe Checkout session initiated from the FastAPI POST /billing/checkout endpoint. Stripe webhooks to the FastAPI POST /billing/webhook endpoint handle subscription lifecycle events and update the user's plan tier in the database.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 3 — FASTAPI BACKEND AND AI SERVICES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The backend is a single Python application built with FastAPI. Because FastAPI is asynchronous by design (built on Starlette and uvicorn), all I/O-bound operations — database queries, S3 uploads, LLM API calls, and email sends — are written as async functions using asyncpg for database access and httpx for outbound HTTP requests. This gives the backend high concurrency without threads. The application is organized into routers (auth, users, profiles, documents, applications, credentials, billing, portals) with a shared dependency injection layer that handles database sessions, the current authenticated user, and plan tier enforcement per endpoint.

Pydantic v2 models define the shape of every request body and every response. Because Pydantic models are used for both API validation and as the schemas for LLM-structured output, there is a single source of truth for data shape across the entire backend. FastAPI's automatic OpenAPI documentation is available at /docs and served in development — useful for manually testing endpoints during development and as a living reference for the Chrome extension's API integration.


Document Parsing Pipeline

When a user uploads a CV, the file is received by the FastAPI POST /documents/upload endpoint as multipart form data, saved to the VPS filesystem under /var/aplicocv/uploads with a UUID-prefixed filename, and the absolute path is stored in the documents table. The backend then immediately triggers the parsing pipeline as a FastAPI BackgroundTask so the HTTP response returns quickly while parsing proceeds asynchronously. The parsing task reads the file from disk, determines the file type by inspecting the file extension and MIME type, and routes it to the appropriate parser.

DOCX files are processed with the python-docx library, which reads the document's XML structure and reconstructs a semantically meaningful text representation — preserving heading levels, list structures, and bold text that signal section boundaries in a CV. PDF files are processed with pdfplumber, which handles digital PDFs reliably including multi-column layouts that simpler tools misread. If pdfplumber extracts fewer than 100 characters from a PDF (indicating a scanned document), the file is forwarded to pytesseract with Tesseract OCR. The image conversion uses pdf2image (which wraps Poppler's pdftoppm) to rasterize each page at 300 DPI before passing the images to pytesseract for text extraction.

The extracted text is passed to the LLM via the configured provider's API (OpenAI or Anthropic) with a structured extraction prompt. The prompt instructs the model to return a JSON object conforming to the profile schema: name, contact information, work history entries with employer, title, dates, and bullet points, education entries, skills list, certifications, languages, and links. The JSON response is validated against a Pydantic model. If validation fails, a retry is triggered with a corrective prompt that includes the error description. Parsing progress is streamed to the frontend via Server-Sent Events using FastAPI's StreamingResponse with an async generator, emitting one event per extraction stage.


LLM Orchestration

All LLM interactions are centralized in a single llm_service.py module. This module exposes async functions for each task type — extract_profile, generate_cover_letter, tailor_profile, score_ats_match — and internally handles provider selection (OpenAI or Anthropic based on the environment configuration), prompt assembly from versioned template strings, response parsing, and token usage logging. Prompts are stored as versioned Jinja2 template files in a prompts/ directory, which allows prompt improvements to be deployed without code changes. Every LLM call logs the model used, prompt tokens, completion tokens, latency, and the user ID to a separate llm_usage table in PostgreSQL — this enables cost attribution per user and identifies expensive prompt patterns.

For OpenAI, the httpx async client calls the /v1/chat/completions endpoint with response_format set to json_object mode to guarantee structured output. For Anthropic, the same client calls the /v1/messages endpoint with explicit JSON schema instructions in the system prompt. The abstraction layer means switching LLM providers requires only an environment variable change, not a code change.


CV Tailoring Engine

The POST /profiles/tailor endpoint receives a job description and the user's current profile. It calls the LLM tailor_profile function with a prompt that instructs the model to reorder work history bullet points to surface the most relevant achievements first, adjust the professional summary's tone and vocabulary to reflect the job description's language, add ATS-relevant keywords from the job description where they truthfully reflect the user's experience, and adapt the perceived seniority framing based on the role. The tailored output is validated as a Pydantic ProfileResponse and stored as a new record in the documents table with a reference to the job URL. Subsequent autofill requests for the same URL retrieve this tailored version automatically.


Cover Letter Generator

The POST /cover-letters/generate endpoint receives a job description and an optional tone parameter (professional, warm, or direct). The FastAPI handler calls the LLM generate_cover_letter function, which assembles the user's profile and the job description into a cover letter prompt specifying a 250–350 word target length and explicit instructions to avoid generic openers. The generated text is stored in the cover_letters table linked to the job URL and returned to the caller. The Chrome extension calls the same endpoint from the service worker and displays the result in the popup with copy and insert actions.


ATS Score and Job Matching

The POST /ats/score endpoint receives a job description and returns a structured analysis. The LLM score_ats_match function sends both the job description and the user's profile to the model with a scoring prompt that evaluates keyword overlap (40%), seniority alignment (20%), location and remote compatibility (20%), and an estimated competition factor (20%). The model returns a match percentage, a list of matched keywords, a list of missing keywords, a qualification assessment (underqualified, strong match, or overqualified), and a ranked list of three specific improvement recommendations. This response is cached in Redis (or in-memory via a simple TTL dict for the MVP) keyed by a hash of the job description plus user profile version, to avoid redundant LLM calls when the same job is scored repeatedly.


Application Tracking

Every autofill action performed by the Chrome extension sends a POST request to the FastAPI POST /applications endpoint with the job URL, portal name, job title, company name, and timestamp. The backend stores this in the applications table. When the extension detects a post-submission confirmation page on a portal, it sends a PATCH /applications/{id}/status request to update the status field. The GET /applications endpoint supports pagination, filtering by portal and status, and sorting by date, and is used by the dashboard's tracking page and Kanban board.


Background Task Processing

Long-running operations that should not block the HTTP response — such as parsing a newly uploaded CV or running the Beta AI Job Agent scan — are executed as FastAPI BackgroundTasks for lightweight jobs, or dispatched to a Celery task queue backed by Redis for heavier operations like the agent's job portal scanning loop. Celery workers run as separate processes alongside the FastAPI application. The agent's scan schedule is configured using Celery Beat with a per-user configurable interval. Task results are written to the database, and the frontend polls the relevant endpoint to detect completion — the same polling pattern used by the Chrome extension for LLM results.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 4 — CHROME EXTENSION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Chrome extension is built with TypeScript and Manifest V3. It consists of three distinct execution contexts that communicate via chrome.runtime.sendMessage: the popup (the visible UI when the extension icon is clicked), the content script (injected into job portal pages), and the service worker (background processing).


Manifest V3 Architecture and the Service Worker Problem

Manifest V3 replaced persistent background pages with service workers that the browser can terminate after 30 seconds of inactivity. This creates a critical architectural constraint: any operation that relies on the service worker being alive when a response arrives — such as a long LLM call — will silently fail if the worker has been terminated. The solution implemented here is that no long-running operation uses a direct message response. Instead, the extension initiates processing by calling the FastAPI backend endpoint, the backend processes asynchronously via a BackgroundTask or Celery job, and the result is written to the database. The extension's content script polls the FastAPI GET /operations/{id}/result endpoint every two seconds until the result is ready. The UI reflects the pending state with a loading animation and resolves when polling returns a completed result. This pattern makes the extension resilient to service worker lifecycle termination regardless of how long the backend operation takes.


Authentication Flow in the Extension

When the extension popup is opened for the first time, it detects the absence of a stored auth token and displays a prompt to log in via the web app. It opens the web app's login page in a new tab with a redirect parameter. After successful login, the web app sends the extension's auth token via a postMessage event, the extension receives it in the content script injected on the web app's domain and forwards it to the service worker via chrome.runtime.sendMessage, and the service worker stores it in chrome.storage.local under AES-256 encryption. Subsequent popup opens check for the token, validate it against the FastAPI GET /auth/me endpoint, and proceed directly to the main popup UI.


Popup Interface

The popup is a 380x520px panel with a clean card-based layout styled using Tailwind CSS compiled into the extension's build output via PostCSS. At the top is the current site's logo and domain name, detected from the active tab's URL by the service worker. Below that is a status badge: "Compatible" (green), "Partially Compatible" (yellow), or "Not Supported" (grey). The main action area shows a prominent autofill button when the site is compatible. Below the button is the ATS score for any detected job description on the page, displayed as a circular progress ring animated with CSS stroke-dashoffset on mount. A toggle allows the user to switch between their default CV and a tailored version if one exists for this job URL. The cover letter section shows a preview of the generated letter with Copy and Insert buttons. At the bottom, icons link to the dashboard (opens in a new tab), settings, and a feedback form. All state transitions use CSS transitions — the ATS ring fills clockwise on load, status badges fade in, and the autofill button pulses once to draw attention.


Content Script and Form Detection

The content script is injected on all pages matching the declared host permissions. It uses MutationObserver to detect dynamically rendered form fields, which is essential for Single Page Applications like LinkedIn and Workday that inject form elements after the initial page load. When the user clicks Autofill in the popup, the service worker retrieves the user's profile from a short-lived chrome.storage.session cache (refreshed from the FastAPI API on popup open) and passes it to the content script via chrome.tabs.sendMessage.

Field detection uses a multi-strategy approach. First, label matching reads the text of each form label and compares it against a normalized dictionary of known field names with fuzzy matching to handle variations. Second, attribute matching checks name, id, placeholder, and aria-label attributes on input elements. Third, for known portals, it uses pre-defined selector maps fetched from the FastAPI GET /portals/configs endpoint and cached in chrome.storage.local with a one-hour TTL.

Once a field is matched to a data value, the content script simulates native browser input events — mousedown, focus, input, change, blur — in sequence to ensure the portal's JavaScript framework registers the change correctly. Simply setting element.value does not trigger React or Vue state updates; the full event sequence is required. For dropdown fields, the script selects the matching option by value or visible text. For rich text areas such as cover letter fields, it uses the Clipboard API with permission to paste formatted text.


Login Automation

When the extension detects a login form — identified by the presence of a password input field and the current domain matching a stored credential entry — it retrieves the encrypted credentials from chrome.storage.local, requests decryption from the FastAPI POST /credentials/decrypt endpoint (the decryption key lives only on the server, never in the extension), and fills the email and password fields using the same event simulation approach. A small non-intrusive overlay appears at the top of the page: "AplicoCV detected a login form — autofill credentials?" with Confirm and Skip buttons. This confirmation step is always shown to respect user control.


Portal Compatibility Map

The extension ships with a pre-built compatibility configuration for the target portals defined by the client: LinkedIn, Workday, Indeed, Get on Board, Computrabajo, Glassdoor, Zonajobs, Bumeran, Trabajando.com, Laborum, RemoteOK, We Work Remotely, WeRemoto, and Konzerta. Each portal configuration includes the domain pattern, the field selector map, known form quirks such as Workday's multi-step pagination, and the portal's logo URL for display in the popup. These configurations are stored in the portal_configs database table and served by the FastAPI backend, meaning they can be updated server-side without requiring a new extension release. For unlisted portals, the extension falls back to the label and attribute matching strategy.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 5 — DIFFERENTIATING AI FEATURES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are the features that differentiate AplicoCV from existing competitors. They are scoped for development after the core autofill MVP is stable and validated.


Beta AI Job Agent (Recommended for First Post-MVP Release)

The Beta AI Job Agent runs as a Celery periodic task scheduled by Celery Beat. When enabled by the user, the task runs on a configurable interval (default every 6 hours) and queries job listing APIs and public RSS feeds for portals that expose their data — Indeed, RemoteOK, We Work Remotely, and others. The agent filters results using the user's stored preferences: target role keywords, seniority level, location, remote preference, salary range, and blacklisted companies. Filtered results are scored against the user's profile using the FastAPI ATS scoring logic. Only results above a configurable threshold (default 65% match) are written to the job_recommendations table. When the user logs in, the React dashboard displays a "New Matches" panel — a React Query-powered list that fetches from GET /recommendations — with each entry showing the job title, company, portal, match score, and a "Go and Apply" button that opens the job URL in a new tab with the extension ready to autofill.


Predictive Apply Score

Displayed in the extension popup and on the dashboard when a job URL is analyzed. The score combines four weighted signals computed by the LLM: profile-to-job keyword overlap (40%), seniority alignment (20%), location and remote compatibility (20%), and an estimated competition factor based on posting age and portal activity (20%). The FastAPI response includes a percentage, a color classification (red below 50%, yellow 50–70%, green above 70%), a natural language explanation, and a checklist of the top three improvements. The React popup renders the score as an SVG ring and the checklist as a collapsible panel.


Real Auto-Tailoring

When a user initiates autofill on a job page, the extension's service worker calls the FastAPI GET /profiles/tailor-for-url endpoint with the current job URL. The backend checks whether a tailored version already exists for that URL in the documents table. If not, it dispatches a Celery task to generate one and returns a 202 Accepted response with a task ID. The extension polls GET /operations/{task_id}/result until the tailored version is ready, then presents it in the popup as an alternative to the default profile. The user can review the tailoring before confirming autofill.


ATS Simulator

A dedicated React route on the dashboard where the user pastes a job description into a textarea. Submitting calls the FastAPI POST /ats/score endpoint and renders the response as a split-panel visualization: the CV text on the left with color-coded keyword highlights applied via a React component that wraps matched terms in styled spans, and the analysis panel on the right showing the match percentage ring, a horizontal bar chart (Recharts) of keyword coverage per CV section, and a missing keywords list with one-click "Add to Profile" buttons that call PATCH /profiles/me/skills.


Ghost Recruiter Recommendations

Integrated into the job recommendations panel on the dashboard. For each surfaced job, the Celery agent task also calls the LLM with a brief strategic analysis prompt — evaluating whether the company shows signs of a hiring freeze, whether the portal is highly competitive for this role type, and whether similar roles with fewer applicants were found during the same scan. These notes are stored alongside the recommendation and displayed in the React card as a collapsible "Strategic Note" section.


One-Click Multilingual

Available from the extension popup when the active tab's domain is detected as a job portal in a language different from the user's primary profile language (detected from the Accept-Language header or the portal's HTML lang attribute). A language selector dropdown appears in the popup. Selecting a language calls the FastAPI POST /profiles/localize endpoint with the target language and regional variant. The backend calls the LLM with a localization prompt that instructs it to translate, adapt cultural tone and formality, and align seniority vocabulary to the regional professional standard. The localized version is returned and used for autofill without overwriting the user's primary profile.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 6 — TESTING AND QUALITY ASSURANCE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Testing covers four dimensions: functional correctness, extension reliability across portals, AI output quality, and security.


Functional Testing

End-to-end flows are tested using Playwright, which supports Chrome extension testing via the --load-extension flag. The critical path — registration, CV upload, profile review, extension authentication, navigation to a job portal, autofill trigger, and result verification — is automated as a regression test suite that runs on every push to the main branch via GitHub Actions. Each of the fourteen target portals has a dedicated test scenario using a synthetic test account. Tests verify that every mapped field is filled correctly, that dynamically rendered fields are detected by MutationObserver, and that the submission confirmation (where detectable) is logged correctly to the FastAPI tracking endpoint.

FastAPI backend endpoints are tested independently using pytest with the httpx AsyncClient pointed at a test instance of the application backed by a separate PostgreSQL test database provisioned by Docker Compose. Each router module has a corresponding test file covering happy paths, validation errors, authentication failures, and plan tier enforcement. Fixture factories create test users, profiles, and documents in the test database without calling external APIs — LLM calls are mocked using pytest-mock to return pre-defined fixture responses.


Extension Reliability Testing

Service worker termination is simulated by programmatically idling the extension beyond 30 seconds during a long LLM operation (using Playwright's extension debugging tools). The test verifies that the result is still retrieved correctly via polling when the worker restarts and that no application data is lost. Login automation is tested on each portal with correct credentials, with incorrect credentials to verify graceful error handling without auto-retrying, and on pages where a CAPTCHA is present — the expected behavior is a graceful fallback that prompts the user to log in manually before the autofill proceeds.


AI Output Quality Testing

A dataset of 20 anonymized CVs in PDF and DOCX formats, including scanned and multi-column layouts, is used to benchmark the parsing pipeline. Each parsed result is compared against a manually verified ground truth JSON file. The acceptable accuracy threshold is 95% field-level extraction accuracy for digital documents and 85% for OCR-processed scans. Cover letter quality is evaluated through a rubric applied to 10 generated samples per role category. ATS scores are validated by comparing the model's match percentages against assessments from three experienced human recruiters on the same CV-job pairings, with an acceptable deviation of plus or minus 12 percentage points.


Security Review

All credential storage paths are audited to confirm that passwords are never written to application logs, database columns store only Fernet-encrypted ciphertext, and the encryption key is stored only in the FastAPI environment and never transmitted to the frontend or extension. The extension's content script is reviewed for XSS vectors — all data inserted into the DOM is sanitized using DOMPurify before insertion. FastAPI endpoints are tested for authentication bypass, rate limiting (implemented via slowapi), and injection vulnerabilities using OWASP ZAP in active scan mode against the staging environment. The Chrome extension permissions are reviewed against the principle of least privilege and confirmed against the Chrome Web Store's current policy before submission.


Performance Validation

The autofill operation from click to completion should resolve in under three seconds for profiles with pre-cached data. The CV parsing pipeline should complete within fifteen seconds for a standard digital PDF. The FastAPI application runs with multiple uvicorn workers (set to the number of VPS vCPUs) managed by a process supervisor — either Gunicorn as a process manager with uvicorn workers, or a systemd service wrapping Docker Compose restart policies. VPS resource usage (CPU, memory, disk I/O) is monitored using a lightweight agent such as Netdata or the VPS provider's built-in metrics dashboard, with alerts configured if memory usage exceeds 80% or disk usage exceeds 70% of the volume. The FastAPI application's response times are additionally monitored with Sentry Performance, with alerts configured if the 95th percentile for any endpoint exceeds 500ms for synchronous responses. The React application's Lighthouse score target is 90 or above across all four categories on the landing page and dashboard, measured against the production deployment served through Nginx.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECHNOLOGY STACK SUMMARY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Web Application        React.js, Vite, TypeScript, Tailwind CSS, Framer Motion, React Router v6
  Server State           TanStack Query (React Query), custom Fetch-based API client
  Forms and Validation   React Hook Form, Zod, zodResolver
  Chrome Extension       TypeScript, Manifest V3, Content Scripts, Service Worker, chrome.storage
  Backend API            Python, FastAPI, SQLAlchemy (async), Alembic, Pydantic v2, uvicorn + Gunicorn
  Task Queue             Celery, Celery Beat, Redis (broker and result backend)
  Authentication         python-jose (JWT), Authlib (Google OAuth), Fernet (credential encryption)
  Document Parsing       python-docx (DOCX), pdfplumber (PDF), pytesseract + pdf2image (OCR)
  LLM Integration        OpenAI Python SDK or Anthropic Python SDK, Jinja2 prompt templates
  Database               PostgreSQL, asyncpg
  File Storage           VPS local filesystem (/var/aplicocv/uploads), optionally migrated to S3/R2 later
  Web Server             Nginx (reverse proxy, static file serving, SSL termination)
  SSL                    Let's Encrypt via Certbot with systemd auto-renewal
  Payments               Stripe Python SDK, Stripe Checkout, Stripe Customer Portal
  Email                  Resend or SendGrid Python SDK
  Charts and Data Viz    Recharts (React dashboard charts)
  Containerization       Docker, Docker Compose (FastAPI, Celery, Redis, PostgreSQL)
  Testing                Playwright (E2E + extension), pytest + httpx (API), pytest-mock
  CI/CD                  GitHub Actions (test, build, SSH deploy to VPS)
  Monitoring             Sentry (frontend + backend), Netdata or VPS provider metrics (server health)
  VPS                    Ubuntu 24.04 LTS, minimum 4 vCPU / 8 GB RAM (Hetzner, DigitalOcean, Vultr, or Linode)
  Dependency Management  Poetry (Python), npm (TypeScript/React)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

End of Document
