AplicoCV — Verification and Deploy Checklist (client-feedback work)

This summarizes everything implemented from CLIENT_FEEDBACK_DEVELOPMENT_PLAN.md, how to
verify it, and how to deploy it safely. It reflects the real production setup (systemd +
venv + SQLite + Nginx, per deploy/README.md).


1. What was implemented (by plan phase)

Done and in the codebase:
   Phase 1.1  Navigation no longer needs a refresh (removed the stuck animated-route swap).
   Phase 1.2  "Back to site" link in the app header to return to the public site.
   Phase 1.3  Landing and Plans pricing unified to one set of numbers.
   Phase 1.4  Exported CV no longer prints the words "Super CV".
   Phase 1.5 / cross-cutting  Every AI feature now answers in the user's language
              (interview, ATS score and simulator, Super CV, cover letters, predictive
              score, ghost recruiter, salary, field answers, tailoring).
   Phase 2    Mandatory preferences questionnaire: a full Preferences page (employment
              status, up to 5 roles, dual-currency salary, industries, modality, remote
              scope and regions, on-site cities with work-status, availability, relocation,
              licence, gender, disability, veteran, "how did you hear", default acceptances).
              The extension fills these new fields, including Yes/No radios and the consent
              checkbox.
   Phase 3.1  Editable studies with a standardized degree-level dropdown (fixes the
              "Master vs Master Degree" form errors); extension fills "education level".
   Phase 3.2  Skill typo-correction ("Did you mean Business Development?").
   Phase 3.3  Editable languages with overall + oral/written/reading levels and a native flag.
   Phase 4    Mark a generated CV as default (stored in preferences). See limitation below.
   Phase 5.2  Free plan limited to 15 applications/month (enforced server-side; dashboard
              shows usage). Pro updated to $7/mo with unlimited applications.
   Phase 5    Credit costs shown on the AI tools (no tool looks "free").
   Phase 5.6  Pricing bullets restructured (ATS, AI Agent, AI interviews as separate lines).
   Phase 6.1  Marketing no longer commits to a fixed portal count.
   Phase 7    ATS Simulator vs AI Tools differentiated with a clear cross-link.
   Phase 8    Autonomous assistant: opt-in email digest + "prepare strong matches" toggle;
              the scheduled scan queues strong matches and emails a high-match digest.
   Phase 9    Extension autofill hardened: multilingual Yes/No (Yes/Sí/Sim), radio-group
              questions, degree level, and more field synonyms. Greenhouse + Lever added
              earlier. (Live per-portal QA still required — see "Remaining".)
   Phase 10.2 The "How to use" guide is fully translated (EN/ES/PT).

Remaining (cannot be completed from the dev environment):
   Phase 9    Real, live test applications on each portal (Workday and company-site
              redirects, auto account creation). This is hands-on QA against live sites.
   Phase 10.1 A short how-to video (media production). The extension/guide pages are ready
              to embed one.


2. Database: no migration needed

All changes use either NEW tables (apply_tasks, autofill_events — created automatically by
create_all on restart) or JSON columns that already exist (users.preferences, profiles.data).
No new column was added to any existing table. So a normal restart picks everything up; no
Alembic step is required for this work.


3. Environment keys for full functionality

Already set:
   OPENAI_API_KEY  — AI features run at full quality (confirmed connected).

Set these to switch on the remaining behaviour:
   EMAIL_PROVIDER + RESEND_API_KEY or SENDGRID_API_KEY
       Needed for the Phase 8 digest emails. Without a provider the email is logged to the
       console (EMAIL_PROVIDER=console), so the feature is testable but no mail is sent.
   REDIS_URL
       Needed for the scheduled autonomous assistant (Celery beat). Without it, the scan and
       digest run only on demand via POST /api/agent/scan, not on a schedule.
   STRIPE_SECRET_KEY + STRIPE_PUBLISHABLE_KEY (and VITE_STRIPE_PUBLISHABLE_KEY for the web)
       Needed to actually charge for Free/Premium. Without them checkout stubs.
   VITE_CHROME_STORE_URL
       Set once the extension listing is approved so the install button goes live.


4. Verify before deploy

Backend (on the server or any machine with Python — there is no Python on the Windows dev box):
   cd apps/api
   pytest
   Expectation: the existing suite passes. Note: the pre-existing test
   test_premium_gate_on_tailor asserts a free user is blocked on /profiles/tailor; this
   depends on TRIAL_DAYS — unrelated to this work.

Web:
   cd apps/web
   npm run build        (tsc -b && vite build) — type-checks and builds. This was run
                        repeatedly during development and passes clean.

Extension (manual, in Chrome):
   Load apps/extension unpacked (Developer mode → Load unpacked). Open a real application
   form on a supported portal and click Autofill. Confirm it fills contact, work history,
   education (incl. degree level), Yes/No radios, and ticks only the privacy-consent box —
   and that it never submits the form.


5. Manual smoke test of the new features (5 minutes)

   1. Switch the language to Spanish. Open AI Tools, Interview, ATS Simulator, Optimize →
      every AI result must come back in Spanish (no English).
   2. From the dashboard, click between sections — each opens immediately, no refresh.
   3. Click "Back to site" in the header → lands on the public home page.
   4. Open Preferences → fill several fields → Save → reload → values persist.
   5. Profile → Education: edit, pick a degree level, save. Languages: set oral/written/
      reading levels. Skills: type "Business Developtem" → see the "Did you mean" suggestion.
   6. Optimize → generate a Super CV → Download PDF → the file does not say "Super CV".
   7. Landing pricing vs Plans page → the Pro price matches ($7).
   8. As a free account, the dashboard shows "N/15 applications this month".
   9. Preferences → Smart Assistant → enable the email digest (with a provider key set, or
      check the server log with EMAIL_PROVIDER=console).


6. Deploy (matches the live systemd + SQLite setup)

   1. Build the SPA:            cd apps/web && npm run build   (outputs apps/web/dist)
   2. Upload changed files to the VPS (tarball / pscp), including apps/api/app, apps/web/dist,
      and apps/extension if republishing the extension.
   3. Restart the API:          sudo systemctl restart aplicocv-api
      (create_all adds the new tables on boot; JSON-field changes need nothing.)
   4. Reload Nginx if the SPA path changed:  sudo nginx -t && sudo systemctl reload nginx
   5. Health check:             curl https://aplicocv.com/api/health
      Confirm "llm" shows openai, and email/stripe/redis reflect the keys you set.
   6. Re-zip and re-upload the extension package (apps/extension) for the manual-install
      download, and submit the new 1.4.0 build to the Chrome Web Store review.


7. Honest limitations to keep in mind

   - Default CV (Phase 4): browsers do not let an extension attach a file to an upload field,
     so this marks/stores the preferred CV but cannot auto-upload the PDF into a job form.
   - Autonomous auto-apply (ALPHA): by design it only QUEUES strong matches for your review;
     it never submits without a human, for legal/ToS safety. It is also off unless enabled in
     config and opted into per user.
   - Portal compatibility: the autofill is much broader now, but every job site renders forms
     differently. Expect ongoing per-portal tuning; budget for it.
