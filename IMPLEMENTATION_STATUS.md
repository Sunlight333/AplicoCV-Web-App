AplicoCV — Implementation Status (development pass against COMPLETION_DEVELOPMENT_PLAN.md)

This records what was built in this pass. Legend:
   Built       working code, integrated end to end
   Scaffold    code in place but gated/partial by design (needs an external account,
               a human-in-the-loop decision, or a follow-up UI)
   Deferred    not started in this pass

Verification done this pass: the web app passes a full TypeScript typecheck
(tsc -b --noEmit, no errors). The Python backend could not be executed locally
(this Windows machine has no Python interpreter; the API runs/tests on the Linux
VPS), so backend changes were verified by static review against the existing
patterns and the test suite's assertions. Most AI features still return deterministic
placeholder output until a real OpenAI/Anthropic key is set (LLM_PROVIDER).


PHASE 0 — Foundations

   Built     0.1 LLM provider already key-ready; added new tasks behind the same
             stub/real switch and per-action credit costs.
   Built     0.2 Job-posting fetcher service — apps/api/app/services/job_fetch_service.py
             (fetch + HTML-to-text + cache; fails soft to pasted text).
   Built     0.3 New tables added via create_all (no migration needed): ApplyTask,
             AutofillEvent — apps/api/app/models.py.


PHASE 1 — Core promise (autofill + apply loop)

   Built     1.1 Autofill of work history, education and skills — added to the field
             dictionary plus repeating-row logic — apps/extension/content-script.js.
   Built     1.2 Greenhouse and Lever added to host_permissions, content_scripts and
             portal detection — apps/extension/manifest.json, service-worker.js.
   Built     1.3 Apply-on-your-behalf queue — apps/api/app/routers/apply.py (tailors a
             CV + cover letter, queues, records the application on submit). Web button
             "Apply for me" on the dashboard — apps/web/src/pages/DashboardPage.tsx.
   Scaffold  1.3 The extension service worker exposes APPLY_QUEUE / APPLY_SUBMITTED, but
             the popup does not yet auto-pull the queue and report submission — follow-up.
   Built     1.4 AI smart open-text answers — POST /ai/field-answer + llm_service
             smart_field_answer + web service wrapper getFieldAnswer.
   Built     1.5 Encrypt the cached profile in the extension (AES-256-GCM, was plaintext)
             — apps/extension/service-worker.js (profileEnc).


PHASE 2 — Make the AI genuinely deliver

   Built     2.1 Real tailoring fetches the posting text from the URL before tailoring
             — apps/api/app/routers/profiles.py (was passing the URL string).
   Built     2.2 Multilingual CV adaptation UI — a panel in the profile "AI Insights"
             tab calls localize and lets you apply the adapted result
             — apps/web/src/pages/ProfilePage.tsx.
   Built     2.3 Deeper ATS simulator — POST /ai/ats-simulate (parse score, sections
             detected/dropped, formatting + invisible errors) + simulateAts wrapper.
   Built     2.4 Predictive Apply Score — POST /ai/predictive-score (success %, fit
             breakdown, missing skills/keywords, overqualified, ATS-pass) + wrapper.
   Built     2.5 Measured time-saved — extension reports fields filled
             (POST /applications/autofill-event); stats derive minutes from real
             telemetry instead of a flat 30-min constant.
   Built     2.6 Interview memory — interview/start now feeds weak-area notes from past
             sessions into new question generation — apps/api/app/routers/ai.py.


PHASE 3 — Differentiating analysis features

   Built     3.1 Ghost Recruiter — POST /ai/ghost-recruiter (apply / caution / skip with
             honest reasons) + getGhostRecruiter wrapper.
   Built     3.2 Junk/scam-posting detection — POST /insights/scam-check (rule-based
             signals, works offline) — apps/api/app/services/insight_service.py.
   Built     3.3 Job Copilot salary + negotiation — POST /ai/salary-insights + wrapper.
   Built     3.4 Burnout detector — GET /insights/burnout (from the user's real
             application activity and response rate).
   Deferred  3.5 Automatic feedback loop (learning ranker) — needs an outcome-learning
             pipeline; not started.


PHASE 4 — Differentiators at scale

   Built     4.1 Job-market heatmap — GET /insights/market-heatmap (top skills/companies/
             portals, remote share) aggregated across users.
   Built     4.2 Anonymous collective intelligence — folded into the heatmap aggregate
             (no per-user data exposed); a minimum-sample threshold constant is in place
             for production tightening.
   Deferred  4.3 Auto networking — highest ToS/legal risk; not started.
   Scaffold  4.4 ALPHA autonomous agent — agent_service.autonomous_apply_for_user QUEUES
             high-confidence matches for review (never auto-submits). OFF by default;
             gated by config (alpha_agent_enabled) + per-user preferences.autoApply +
             a high match threshold. Wiring it to the Celery beat schedule and the
             human-review UI is the remaining work.


PHASE 5 — Go-live (external accounts — cannot be completed in code alone)

   Deferred  5.1 Stripe live — needs real keys (the code path already exists).
   Deferred  5.2 Chrome Web Store publication — needs a store account + listing review.
   Deferred  5.3 Production AI keys + limits — needs the provider key + infra config.


New API surface added this pass
   POST /ai/predictive-score
   POST /ai/ats-simulate
   POST /ai/ghost-recruiter
   POST /ai/salary-insights
   POST /ai/field-answer
   POST /insights/scam-check
   GET  /insights/burnout
   GET  /insights/market-heatmap
   POST /apply/request, GET /apply/tasks, GET /apply/queue,
   POST /apply/{id}/submitted, POST /apply/{id}/dismiss
   POST /applications/autofill-event

What still needs a real environment to be "done"
   - Set OPENAI_API_KEY or ANTHROPIC_API_KEY so the AI features produce real output.
   - Run the backend test suite on the Linux VPS / CI (no Python locally on Windows).
   - Stripe + Chrome Web Store + production keys (Phase 5).
   - Finish the extension popup wiring for the apply queue (1.3 scaffold) and the
     ALPHA review UI + schedule (4.4 scaffold).
