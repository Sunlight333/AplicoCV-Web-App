AplicoCV — Requirements Verification Checklist

Purpose: a plain checklist you can use to review the project against the brief in
ProyectoAplicoCvEnglish.docx. Each item shows an assessed status and a short note with
where it lives in the code, plus an empty box you can tick once you have confirmed it
yourself.

Status legend
   Done            built and working in code
   Partial         partly built, or works differently / more shallowly than the brief
   Not implemented no code for this yet


IMPORTANT GLOBAL NOTE — read this first

The AI features (cover letter, ATS score, CV tailoring, multilingual, interview prep)
are wired to a real language-model provider, BUT the project ships with the provider set
to a built-in "stub" by default. With no API key configured, those features still respond,
but with deterministic placeholder logic (keyword heuristics and template text) instead of
real AI. To see the genuine AI behaviour, an OpenAI or Anthropic key must be set on the
backend. Evidence: apps/api/app/services/llm_service.py (stub vs real split).

Likewise the website can run against mock data (VITE_USE_MOCKS) for demos, and two external
integrations are not yet live: the Chrome Web Store link (waiting on a store URL) and Stripe
checkout (waiting on a publishable key).


SECTION 1 — Core concept and message

[ ] Upload your CV once and reuse it everywhere.
      Done. Onboarding uploads and parses the CV, then stores a structured profile.
      apps/web/src/pages/OnboardingPage.tsx, apps/api/app/routers/documents.py

[ ] "Fills forms, does not replace your judgement — review before submitting."
      Done. The extension fills fields but never submits the form; the user reviews and
      submits manually. apps/extension/content-script.js (no submit call anywhere)

[ ] A different, more advanced tool than the competition (an evolution).
      Partial. Several advanced ideas are built (interview prep, ATS scoring, beta job
      agent), but most of the headline "differentiating" features in Section 5 are not yet
      implemented (see that section).


SECTION 2 — How it works (create profile / onboarding)

[ ] Create a profile on the website.
      Done. Registration plus a guided onboarding flow.
      apps/web/src/pages/auth, apps/web/src/pages/OnboardingPage.tsx

[ ] Complete your information (preferences, upload, review).
      Done. Three steps: Preferences, Upload CV, Review.
      apps/web/src/pages/onboarding/PreferencesStep.tsx, UploadStep.tsx, ReviewStep.tsx


SECTION 3 — Where it works (portals)

[ ] Works on the main enterprise / international ATS platforms.
      Partial. The extension targets 14 of the named portals. Greenhouse and Lever, which
      the brief mentions by name in the summary, are NOT yet covered.
      apps/extension/manifest.json, apps/extension/service-worker.js

[ ] Specific portals present in the extension:
      Done for: LinkedIn, Workday, Indeed, Get on Board, Computrabajo, Glassdoor, Zonajobs,
      Bumeran, Trabajando.com, Laborum, RemoteOK, We Work Remotely, WeRemoto, Konzerta.
      Not present: Greenhouse, Lever.
      Company websites (generic): only partly — the generic field matcher runs only on the
      14 listed hosts, so truly arbitrary company sites are not auto-injected yet.

[ ] The full list of compatible platforms is published on the website.
      Done. Public page plus an in-app page.
      apps/web/src/pages/marketing/SupportedPortalsPublicPage.tsx,
      apps/web/src/pages/SupportedPortalsPage.tsx


SECTION 4 — Main features

[ ] Autofill of contact details, address, work history, education, links and skills.
      Partial. Contact details, address (single field), and links are filled. Work history,
      education and skills are NOT filled by the extension yet.
      apps/extension/content-script.js (FIELD_DEFS dictionary)

[ ] Works on major domestic and international job portals.
      Partial. Same as Section 3 (14 portals, Greenhouse/Lever missing).

[ ] AI cover-letter generator for a pasted job description.
      Done (real AI path; placeholder when no API key).
      apps/api/app/routers/ai.py, apps/web/src/pages/AiToolsPage.tsx

[ ] One-click insertion of the cover letter into compatible forms.
      Done. apps/extension/popup.js, content-script.js (insertCoverLetter)

[ ] Time-saved metrics.
      Done, but the figure is a fixed estimate of 30 minutes per application rather than a
      measured value. apps/api/app/routers/applications.py (minutesSaved),
      apps/web/src/pages/DashboardPage.tsx

[ ] Reports / tracking of which jobs you applied to.
      Done. Full kanban tracker with statuses, portal filter, search and notes.
      apps/web/src/pages/TrackingPage.tsx, apps/api/app/routers/applications.py

[ ] ATS score / job-match percentage ("87% match").
      Done (real AI path; the placeholder uses a simple keyword heuristic).
      apps/api/app/routers/ai.py (ats/score), apps/web/src/pages/AtsSimulatorPage.tsx

[ ] Recommends jobs from your skills/preferences, then asks to apply on your behalf.
      Partial. Job recommendations with match scores are built. The "shall I apply on your
      behalf?" confirm-and-apply step is NOT built — the only action is an external
      "Go apply" link. apps/api/app/routers/recommendations.py, DashboardPage.tsx


SECTION 5 — Detailed main features

[ ] Intelligent CV parsing — a tailored version of the CV per opening.
      Partial. CV parsing is real and solid. Per-opening tailoring exists as an endpoint,
      but the tailoring is shallow by default (see auto-tailoring below).
      apps/api/app/routers/documents.py, profiles.py

[ ] Automatically complete forms.
      Partial. Same coverage as the autofill item above (no work history / education / skills).

[ ] Smart responses for open-text fields with a human tone.
      Partial. Open-text fields are filled from a bank of answers the user pre-writes
      (an FAQ store), not generated on the fly by AI.
      apps/api/app/routers/faq.py, apps/extension/content-script.js (matchFaqAnswer)

[ ] Automatic CV tailoring for each job description.
      Partial. A real tailoring prompt exists, but the tailor-by-URL path does not fetch the
      job posting text, and the offline placeholder only re-sorts skills. Genuine
      reorganisation needs a real AI key. apps/api/app/services/llm_service.py (tailor)

[ ] Application tracking summary across all portals.
      Done. apps/web/src/pages/TrackingPage.tsx, apps/api/app/routers/applications.py


SECTION 6 — Differentiating features (the ideal target)

[ ] ALPHA AI agent — autonomously applies on your behalf while you are offline, then reports back.
      Not implemented. Background machinery only refreshes recommendations; nothing submits
      applications autonomously. (The brief itself flagged this as the most complex item.)
      apps/api/app/tasks.py

[ ] BETA AI agent — monitors portals while offline and returns recommended jobs with apply links.
      Done (modest). Calls a live jobs API and scores results against your skills, on a
      scheduled background run for premium users.
      apps/api/app/services/agent_service.py, apps/api/app/celery_app.py

[ ] Predictive Apply Score (chance %, missing skills, keywords, overqualified, ATS-pass).
      Partial. Covered indirectly by the ATS score (match %, missing keywords, qualification).
      There is no separate predictive "chance with this job" feature or UI.
      apps/api/app/routers/ai.py

[ ] REAL auto-tailoring (reorganises achievements, tone, seniority — startup vs corporate).
      Partial. The real prompt asks for this, but the default placeholder does not reorganise
      anything; needs a real AI key to behave as described.
      apps/api/app/services/llm_service.py

[ ] Ghost Recruiter — advises where it makes sense to apply (and where not).
      Not implemented.

[ ] Anonymous collective intelligence — insights from aggregated user data.
      Not implemented.

[ ] One-click multilingual CV adaptation (cultural tone, not just translation).
      Partial. A backend endpoint exists with a real adaptation prompt, but no page in the
      web app calls it yet, so there is no user-facing feature. (Separately, the website
      interface itself is fully translated into English, Spanish and Portuguese — see
      Section 7.) apps/api/app/routers/agent.py (localize), apps/web/src/services/ai.ts

[ ] Real ATS simulator (how the ATS "sees" the CV, parsing score, invisible errors).
      Partial. An ATS simulator page exists with keyword coverage and tips, but it does not
      yet show parsing-level / formatting / "invisible error" analysis.
      apps/web/src/pages/AtsSimulatorPage.tsx

[ ] Job Copilot — interview, salary and negotiation strategy.
      Partial. Interview preparation is fully built (questions, answers, feedback, history).
      Salary benchmarking and negotiation advice are not built.
      apps/api/app/routers/ai.py (interview), apps/web/src/pages/InterviewPage.tsx

[ ] Auto networking — detect recruiters/alumni and draft outreach (ask before sending).
      Not implemented.

[ ] Detection of junk postings (ghost jobs, scams, recycled vacancies).
      Not implemented.

[ ] Job market heatmap (in-demand skills, salaries, trends dashboard).
      Not implemented.

[ ] Interview memory (remembers past interviews and learns from them).
      Partial. Past interview sessions and feedback are stored and viewable, but that history
      is not yet fed back into generating new questions. apps/api/app/routers/ai.py

[ ] Automatic feedback loop (learns which applications get interviews and optimises).
      Not implemented. Response-rate stats exist, but nothing learns from them.

[ ] Burnout detector for the job search.
      Not implemented.


SECTION 7 — Plans, privacy and website

[ ] Free and Premium plans.
      Done. Plans, credit packs, Stripe checkout and webhooks, plus premium gating and a
      free-trial window. Stripe needs a live key to transact.
      apps/api/app/routers/billing.py, apps/web/src/pages/BillingPage.tsx

[ ] Privacy of stored data.
      Partial. There is a Privacy page, and the extension encrypts the auth token at rest
      (AES-256-GCM). The cached profile data itself is stored in plaintext in the browser,
      so "encrypted profile data" is not fully met.
      apps/extension/src/crypto.js, apps/web/src/pages/PrivacyPage.tsx

[ ] Website pages behind every link (About, Help, Security, Status, Blog, Careers,
    Contact, Cookies, Terms).
      Done (static content pages). apps/web/src/pages/marketing, PrivacyPage, TermsPage

[ ] Website available in multiple languages.
      Done. English, Spanish and Portuguese (Brazil), with a language switcher.
      apps/web/src/i18n

[ ] Extra: referrals and rewards (credits, daily check-in streak).
      Done. apps/web/src/pages/ReferralPage.tsx, RewardsPage.tsx


SUMMARY COUNT

Done or essentially done: 19 items
Partial / different from the brief: 13 items
Not implemented yet: 8 items
   ALPHA autonomous apply agent, Ghost Recruiter, Anonymous collective intelligence,
   Auto networking, Junk-posting detection, Job market heatmap, Automatic feedback loop,
   Burnout detector.


HOW TO CONFIRM EACH ITEM YOURSELF

   Web app          run the frontend in apps/web and click through the pages listed above.
   AI quality       set a real OpenAI or Anthropic key on the backend, otherwise AI features
                    return placeholder output.
   Extension        load apps/extension as an unpacked Chrome extension and try a real form
                    on one of the supported portals; confirm it fills but does not submit.
   Portals          open apps/extension/manifest.json to see the exact site list.
