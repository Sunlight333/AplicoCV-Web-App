AplicoCV — Development Plan to Complete the Missing Requirements

This plan covers everything marked Partial or Not implemented in VERIFICATION_CHECKLIST.md.
It is ordered by priority and dependency: each phase builds on the one before it. Effort is
a rough size, not a fixed quote.

Effort scale
   S    up to ~2 days
   M    ~3 to 5 days
   L    ~1 to 2 weeks
   XL   multiple weeks, needs design and external/legal review

Risk flags
   Tech    technical complexity / reliability risk
   Legal   terms-of-service, scraping or automated-application risk
   Cost    ongoing language-model or infrastructure spend
   Ext     depends on an external account going live (Stripe, Chrome store, AI key)


PHASE 0 — Foundations and shared enablers (do first)

These unblock most other work. Several later features depend on them, so building them
once here avoids repeating the work.

   0.1 Turn on a real language-model provider.
       Why: most AI features currently fall back to placeholder logic with no API key.
       What: provision an OpenAI or Anthropic key, set it in the backend config, add cost
       guards (per-user daily caps), and a simple usage dashboard.
       Where: apps/api/app/config.py, apps/api/app/services/llm_service.py,
       apps/api/app/models.py (LlmUsage already exists).
       Effort S. Flags Cost, Ext.

   0.2 Job-posting fetcher service (shared dependency).
       Why: tailoring, ATS scoring, predictive score, scam detection and the apply flow all
       need the real text of a posting, not just its URL. Today tailor-by-URL never fetches it.
       What: a server-side service that takes a job URL, fetches and cleans the posting text
       (HTML to text, with per-portal extractors for the main sites), with caching and a
       timeout/fallback to user-pasted text.
       Where: new apps/api/app/services/job_fetch_service.py, called from profiles.py and ai.py.
       Effort M. Flags Tech, Legal (respect robots/ToS, cache politely).

   0.3 Data-model groundwork.
       What: add the tables the new features need so migrations land once:
       recruiter/contact, market-stat snapshots, scam-signal cache, apply-job queue,
       burnout/activity metrics.
       Where: apps/api/app/models.py, apps/api/migrations.
       Effort S.


PHASE 1 — Complete the core promise (autofill + the apply loop)

This is the headline product. These gaps are the most visible to users and the cheapest
wins relative to impact.

   1.1 Autofill work history, education and skills.
       Gap: the extension only fills contact, address and links; the repeating
       experience/education/skills sections are not handled.
       What: extend the field dictionary and add repeating-section logic that detects and
       fills multiple rows (add-another-entry buttons on Workday/Greenhouse-style forms),
       map profile.experience[], profile.education[], profile.skills[].
       Where: apps/extension/content-script.js (FIELD_DEFS and the fill loop).
       Effort L. Flags Tech (every portal renders these sections differently).

   1.2 Add Greenhouse and Lever, plus true generic company-site support.
       Gap: both are named in the brief but absent; generic matching only runs on the 14
       listed hosts.
       What: add host patterns and adapters for Greenhouse and Lever; add an opt-in generic
       content-script match (broad host permission or activeTab on user click) so arbitrary
       company career pages get the generic matcher.
       Where: apps/extension/manifest.json, service-worker.js, content-script.js.
       Effort M. Flags Tech, Legal (broad host permissions affect store review).

   1.3 Apply-on-your-behalf confirmation flow.
       Gap: recommendations exist, but there is no "shall I apply for you?" step — only an
       external link.
       What: an apply queue. From a recommendation the user confirms "apply"; the backend
       prepares the tailored CV and cover letter, the extension opens the posting and
       autofills it, and the application is recorded automatically in tracking.
       Where: new apps/api/app/routers (apply queue), recommendations.py, the extension
       service-worker, apps/web/src/pages/DashboardPage.tsx.
       Effort L. Flags Tech, Legal (assisted apply, user must confirm and review).

   1.4 AI smart responses for open-text fields.
       Gap: open-text answers come from a static bank the user pre-writes.
       What: when an open-text field is detected and no saved answer fits, call the backend
       to generate a short, human-toned answer from the profile and the field label/JD, show
       it to the user to accept or edit before it is inserted.
       Where: apps/api/app/routers/ai.py (new endpoint), apps/extension/content-script.js,
       apps/api/app/services/llm_service.py.
       Effort M. Flags Cost.

   1.5 Encrypt the cached profile in the extension.
       Gap: only the auth token is encrypted at rest; the cached profile is plaintext.
       What: reuse the existing AES-256-GCM helper to encrypt the cached profile blob in
       chrome.storage, decrypt on use.
       Where: apps/extension/src/crypto.js, service-worker.js.
       Effort S.


PHASE 2 — Make the AI features genuinely deliver

These already exist as endpoints or pages but behave shallowly. Phase 0.1 and 0.2 make them
real.

   2.1 Real automatic CV tailoring per job description.
       Gap: tailor-by-URL never reads the posting; the offline placeholder only sorts skills.
       What: feed the fetched posting text (0.2) into the real tailoring prompt so it
       reorganises achievements, tone and perceived seniority; store a tailored CV version
       per application.
       Where: apps/api/app/routers/profiles.py, apps/api/app/services/llm_service.py.
       Effort M. Flags Cost.

   2.2 Multilingual CV adaptation — add the user interface.
       Gap: a real backend localize endpoint exists, but no page calls it.
       What: a "translate and adapt my CV" panel that calls localizeProfile, shows the
       adapted result, and lets the user save it as a regional version.
       Where: apps/web/src/pages/ProfilePage.tsx or OptimizePage.tsx,
       apps/web/src/services/ai.ts (localizeProfile already defined).
       Effort S.

   2.3 Deepen the ATS simulator.
       Gap: it shows keyword coverage only; the brief asks how the ATS "sees" the CV, parsing
       score and invisible errors.
       What: add CV-parsing simulation (extract the CV the way an ATS would, flag sections
       likely dropped, columns/tables/headers/images that break parsing) and a parse-quality
       score alongside the keyword score.
       Where: apps/api/app/routers/ai.py, llm_service.py, apps/web/src/pages/AtsSimulatorPage.tsx.
       Effort L. Flags Tech.

   2.4 Predictive Apply Score as its own feature.
       Gap: only the ATS match % exists; no "your chance with this job" view.
       What: combine match score, seniority fit, location/salary fit and an estimate of
       competition into a single predicted-success percentage, with the missing-skill and
       keyword guidance, surfaced on each recommendation and on the posting.
       Where: apps/api/app/routers/ai.py (new endpoint), apps/web (recommendation cards,
       a dedicated panel).
       Effort M. Flags Cost.

   2.5 Measured time-saved instead of a fixed 30 minutes.
       Gap: minutesSaved is a flat constant.
       What: record how many fields the extension actually filled per application and derive a
       defensible time estimate from that.
       Where: apps/extension (report fields filled), apps/api/app/routers/applications.py.
       Effort S.

   2.6 Interview memory feeding new questions.
       Gap: history is stored and viewable but not used to shape future sessions.
       What: read recent sessions and feedback when generating a new interview so weak areas
       are reinforced, with a short "based on your past interviews" note.
       Where: apps/api/app/routers/ai.py (interview/start), llm_service.py.
       Effort S. Flags Cost.


PHASE 3 — Differentiating analysis features (batch A)

Self-contained, mostly language-model plus existing data. Lower infrastructure risk; these
are the strongest "evolution" selling points.

   3.1 Ghost Recruiter — where to apply and where not.
       What: given a posting and the user profile, advise apply / do-not-bother with a reason
       (low fit, very competitive, related opening is a better fit). Builds on 0.2 and 2.4.
       Where: apps/api/app/routers/ai.py, surfaced on recommendations.
       Effort M. Flags Cost.

   3.2 Junk / ghost / scam posting detection.
       What: signal-based classifier (reposted-for-months, vague pay, off-platform contact,
       known-pattern language) plus a model pass, shown as a warning badge.
       Where: apps/api/app/services (new scam_signal_service), recommendations and apply flow.
       Effort M. Flags Tech, Cost.

   3.3 Job Copilot — salary and negotiation.
       What: extend the existing interview copilot with desired-salary guidance from the
       profile and (where available) market benchmarks, plus negotiation talking points.
       Depends on 4.1 market data for real benchmarks; can ship with model estimates first.
       Where: apps/api/app/routers/ai.py, apps/web/src/pages/InterviewPage.tsx or OptimizePage.tsx.
       Effort M. Flags Cost.

   3.4 Burnout detector.
       What: from application activity and response rates, detect over-applying / low-response
       streaks and suggest quality-over-quantity adjustments and pacing.
       Where: apps/api/app/routers/applications.py (activity metrics), a dashboard card.
       Effort M.

   3.5 Automatic feedback loop.
       What: learn from outcomes (which applications reached interview/offer, which CV
       versions and answers performed) and feed that back into recommendation ranking and
       tailoring suggestions.
       Where: apps/api/app/services (new optimization service), recommendations, tailoring.
       Effort L. Flags Tech.


PHASE 4 — Differentiating features at scale (batch B)

Heavier: they need data pipelines, aggregation, or higher legal scrutiny. Plan and design
before committing.

   4.1 Job market heatmap.
       What: aggregate postings the platform already touches (from the beta agent and apply
       flow) into trend snapshots — in-demand skills, salary bands, hiring trends, remote
       share, growing technologies — and a dashboard.
       Where: a scheduled aggregation task (apps/api/app/tasks.py), market-stat tables (0.3),
       a new web dashboard page.
       Effort L. Flags Tech, Cost.

   4.2 Anonymous collective intelligence.
       What: privacy-safe aggregation across users — which CV formats and salary ranges get
       responses, which companies reply and how fast — surfaced as "users like you" insights.
       Requires anonymisation, minimum-sample thresholds and a privacy review.
       Where: aggregation pipeline plus the dashboard from 4.1.
       Effort L. Flags Legal (privacy), Tech.

   4.3 Auto networking.
       What: detect recruiters / hiring managers / alumni linked to a posting, draft
       personalised outreach, and ask before sending.
       Note: sourcing contact data and sending messages on platforms like LinkedIn is the
       highest legal/ToS risk item here. Scope carefully — likely limited to drafting messages
       the user sends themselves, not automated sending.
       Where: new service plus contact tables (0.3), a web UI.
       Effort XL. Flags Legal, Tech.

   4.4 ALPHA autonomous apply agent.
       What: the fully autonomous version of 1.3 — finds, tailors, writes the letter and
       submits applications while the user is offline, then reports back. The brief itself
       flagged this as the most complex item.
       Why last: it depends on rock-solid autofill (1.1, 1.2), the apply queue (1.3), real
       tailoring (2.1), scam detection (3.2) and predictive score (2.4) all being reliable,
       plus headless browser automation, anti-bot handling, and a clear legal stance on
       applying without per-application review.
       Where: a worker/automation service, the apply queue, scheduled tasks.
       Effort XL. Flags Legal, Tech, Cost.


PHASE 5 — Go-live of external integrations

Can run in parallel once the relevant features are ready.

   5.1 Stripe live.
       What: real publishable/secret keys, products/prices, verified webhooks, tax as needed.
       Where: apps/api/app/routers/billing.py, apps/web/src/services/billing.ts.
       Effort S. Flags Ext.

   5.2 Chrome Web Store publication.
       What: finalise the store listing and submit; wire the live store URL so the install
       button leaves "coming soon". Note phase 1.2's broad permissions will affect review.
       Where: apps/extension/store-assets, apps/web/src/pages/ExtensionPage.tsx (store URL).
       Effort M. Flags Ext.

   5.3 Production AI keys and limits.
       What: provider keys in production, rate limits, spend alerts, observability for AI
       endpoints.
       Effort S. Flags Cost, Ext.


SUGGESTED SEQUENCING AND MILESTONES

   Milestone A — credible core (Phases 0 and 1).
      Full autofill, all named portals, assisted apply, smart answers, real AI switched on.
      This makes the headline promise actually true end to end.

   Milestone B — real AI value (Phase 2).
      Genuine tailoring, multilingual CV, deeper ATS simulator, predictive score, real metrics.

   Milestone C — the differentiators (Phase 3, then Phase 4).
      The "evolution" features that set the product apart, lighter ones first.

   Milestone D — commercial go-live (Phase 5), folded in as each milestone is ready.


CROSS-CUTTING CONCERNS TO DECIDE EARLY

   Legal stance on automated applying and outreach. Phases 1.3, 4.3 and 4.4 need a clear
   policy: how much the user must review, what is submitted on their behalf, and which
   platforms' terms allow it. Decide before building 4.4.

   Language-model cost at scale. Tailoring, scoring and generation run per job. Set per-user
   caps, cache aggressively (0.2), and tie heavier features to the Premium plan.

   Portal fragility. Autofill and any automation break when sites change their forms. Budget
   for ongoing per-portal maintenance and add monitoring that flags when a portal's fill rate
   drops.

   Privacy. Collective intelligence (4.2) and stored CV data need anonymisation, retention
   limits and a privacy review, consistent with the Privacy page already shipped.
