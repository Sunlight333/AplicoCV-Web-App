AplicoCV — Development Plan from Client Feedback (Funcionalidades Proyecto.docx)

This plan turns the client's review of the live product into concrete work, ordered by
priority. The review was very positive on design, onboarding clarity, the "know before
you apply" section, referrals and pricing layout. The items below are what needs fixing
or adding.

Priority: P0 breaks or blocks the experience, P1 high value, P2 medium, P3 later.
Effort: S up to ~2 days, M ~3-5 days, L ~1-2 weeks, XL multiple weeks.

A note that runs through everything: several complaints share one root cause, the AI
answers in English even when the app and the job are in Spanish. Fixing the language
handling once (passing the user's language into every AI request and telling it to reply
in that language) resolves the interview, ATS recommendations and Super CV complaints
together. It is listed as a cross-cutting item and referenced where relevant.


PHASE 1 — Critical fixes (do first)

1.1 Navigation needs a refresh to work. P0, effort M.
   The client reports that clicking a section does not open it; the page has to be
   refreshed for it to load, and it is slow. This is the most damaging issue because it
   makes the whole app feel broken. Action: reproduce and fix client side navigation so
   each section opens immediately on click with no refresh. Likely areas: the page
   transition and lazy loading setup in App.tsx (the animated route switch and the
   Suspense fallback), and the sidebar links. Confirm there is no error that silently
   blocks the first render until reload.

1.2 No way back to the public website from inside the app. P0, effort S.
   Once in the dashboard the user cannot return to the landing site, not even by clicking
   the logo. Action: make the logo, or a clear menu item, link back to the home page, and
   add a simple "Back to site" entry. (apps/web/src/components/layout/AppLayout.tsx — the
   logo currently points to the dashboard.)

1.3 Prices differ between the landing page and the Plans and Credits page. P0, effort S.
   Action: make pricing come from one single source so both pages always match.

1.4 The downloaded CV shows the words "Super CV". P0, effort S.
   Nobody would send a CV with that label. Action: remove the "Super CV" wording from the
   exported PDF; keep it only inside the app as a tool name.

1.5 Language is mixed in AI outputs. P0, effort M. (See the cross-cutting language item.)
   Three concrete reports: the simulated interview questions come in English, the ATS
   simulator skill recommendations come in English, and the generated Super CV mixes
   Spanish and English in the same document. Action: every AI feature must answer in the
   user's chosen language.


PHASE 2 — The mandatory preferences questionnaire (the most important addition)

The client calls this fundamental: without it, the autofill leaves fields empty or causes
errors, and recommendations cannot be accurate. It is an expanded, required questionnaire
that feeds both the autofill answers and the job matching. Reference app named by the
client: AIApply. P1, effort L to XL (build in stages).

Fields requested:
2.1 Current employment situation: unemployed, unemployed but not in a hurry, employed but
    needs a change, employed but open to opportunities.
2.2 Main jobs sought: a searchable dropdown of roles, allow up to 5, and have the AI adapt
    the job title to each posting. Example: Commercial Manager.
2.3 Salary: allow a minimum or desired amount, with two separate currency fields, local
    currency and US dollars, both completed by the user (since a local amount and a dollar
    amount are very different).
2.4 Industry: multi select with no limit (Healthcare and Life Science, Banking and Finance
    and Insurance, Sales and Business Development, and so on).
2.5 Work modality: multiple selection, Part Time, Full Time, Remote, or All.
2.6 Remote versus on site preference: ask whether they want fully remote ("you can work
    remotely for anywhere in the world") or on site or hybrid ("we will look together for
    an office job near your city"), to raise match quality.
2.7 Preferred remote regions: multi select, Europe, North America, South America, Oceania,
    Asia, Africa, Worldwide.
2.8 Preferred on site locations: a city and capital dropdown with type ahead. After
    choosing a city, ask citizenship status for that place: Citizen, Permanent Resident,
    Work Visa, Open Work Visa or Permit, Not Yet Authorized — asked per city or country.
2.9 Start availability: default today, or next week, or as soon as possible.
2.10 Relocation: yes or no.
2.11 Driver's license: yes or no.
2.12 Gender identity: Man, Woman, Non binary, and so on.
2.13 Disability: do you have a disability, and do you need any special arrangement for
     interviews.
2.14 Veteran: yes or no.
2.15 Default acceptances to fill tricky application checkboxes automatically: that the
     person has not worked at that company before, does not know anyone there, is applying
     under the "none of the above" or out of US option, and accepts the data policy of the
     site being applied to.
2.16 "How did you hear about this job": provide default answers so the form can auto
     advance, for example Job Board or LinkedIn.

Build order suggestion: first the items that unblock autofill the most (jobs sought,
salary with two currencies, modality, locations with work authorization, studies, the
default acceptances), then the rest.


PHASE 3 — Profile accuracy and data quality

3.1 Studies cannot be edited, and degree wording breaks forms. P1, effort M.
   Make studies editable and use a dropdown of standard degree levels (Bachelor, Master,
   PhD, Certification, Secondary, and so on) plus an area of study, so the value maps
   cleanly across sites that say "Master" versus "Master Degree". Provide a sensible
   default so application forms do not error on the studies field.

3.2 Skills do not correct or normalize what the user types. P1, effort M.
   Example given: "Business Developtem" was not corrected to "Business Development". Add
   skill suggestions and correction, so typed skills snap to recognized skill names.

3.3 Languages need detailed levels. P1, effort M.
   Sites often ask for several language items: overall level (basic, conversational,
   professional, advanced, bilingual) and separate oral, writing and reading levels, plus
   whether it is a native language. Capture these, or derive them sensibly from the CV, so
   the autofill can answer all the language sub questions and tick the right boxes.

3.4 Allow a second, optional contact phone. P2, effort S.

3.5 Clarify how the AI analysis connects to the saved CV used for autofill. P2, effort S.
   The client asks which CV the autofill actually uses, and whether the suggested skills
   from the analysis get applied automatically. Action: make this explicit in the
   interface and ensure accepted suggestions update the profile that the autofill uses.


PHASE 4 — CV and document management

4.1 Choose which CV the extension uses when applying. P1, effort M.
   The user can create several tailored CVs (Super CVs); they need to pick a default CV
   (and cover letter) for the day. Surface this selection in Profile or in Documents, and
   have the extension use the selected one.

4.2 Remove the "Super CV" label from exports. P0, effort S. (Same as item 1.4.)

4.3 Fix Super CV language mixing. P0, effort M. (Covered by the language item.)


PHASE 5 — Plans, credits and pricing

5.1 Define and clearly explain the credits system. P1, effort M.
   The client wants to understand exactly what each tool and section costs in credits, and
   what is free. Today some tools (for example the AI Tool) appear to have no cost. Action:
   set a clear price for every action, decide what is free and what is paid, and show a
   short, simple explanation in the app.

5.2 Free plan application limit. P1, effort M.
   The free plan should always allow 15 well completed automatic applications per month,
   then stop. They can be used all in one day or spread out, within that month, and they do
   not carry over. Keep the 100 welcome credits. Action: count applications per user per
   month and enforce the limit.

5.3 Update the Pro plan. P1, effort S.
   Pro includes everything in Free, 1,000 credits per month, unlimited Super CV and cover
   letters, AI mock interviews, priority AI, and, most importantly, unlimited job
   applications. Target price around 7 US dollars. A marketing hook line can be added later.

5.4 Fix the pricing mismatch between pages. P0, effort S. (Same as item 1.3.)

5.5 Show prices in the buyer's local currency. P2, effort S to M.
   This is mostly handled by the payment provider; enable currency localization when the
   payment account is connected.

5.6 Restructure the pricing presentation. P2, effort S.
   Separate "AI Agent" and "ATS Score" into their own lines, and add "AI Simulated
   Interview" to the paid plan since it is high value.


PHASE 6 — Landing page and feature presentation

6.1 Do not commit to a specific number of portals. P2, effort S.
   Reword "fills forms on 14 portals" so it does not lock to 14, 15 or 19.

6.2 Remove "(Beta)" from "AI Job Agent". P3, effort S.

6.3 Make the cover letter tone options stand out (Professional, Close, Direct). P2, S.

6.4 Improve discoverability of features the client could not find. P1, effort M.
   The client could not see where the ATS score, the cover letters, the Kanban tracking and
   the ATS simulator live. Part of this is the navigation bug in Phase 1; the rest is making
   these easier to reach and clearly labeled from the dashboard and menu.


PHASE 7 — ATS tools experience and differentiation

7.1 Differentiate the two similar tools. P2, effort M.
   The "ATS Simulator" and the "AI Tool" overlap. Present them as clearly distinct, for
   example "ATS and AI Simulator" versus "Cover Letter Generator", and adopt the graphics
   style of the AI Tool, which the client preferred.

7.2 Update the input wording to accept a link. P2, effort S.
   Pasting a job link already works well. Change "Paste the job description" to "Paste the
   job link here", while still accepting pasted text.

7.3 Recommendations must be in the user's language. P0 to P1. (Language item.)


PHASE 8 — The strategic added value: autonomous assistant and labor intelligence

8.1 Autonomous job assistant. P1, effort L.
   The client sees this as the real differentiator. While the user is offline it searches by
   their parameters, monitors on its own, and on the next login (or by email) recommends
   jobs that match their profile and preferences above a high threshold, for example 90 per
   cent. We already have a job scan; this extends it with the new preferences from Phase 2,
   a high match filter, and an email digest.

8.2 Labor intelligence dashboard. P2, effort M.
   A dashboard of most in demand skills, salaries, hiring trends, countries hiring, remote
   trends and growing technologies. A first version exists (the market view); this confirms
   it shows real data and is easy to reach.


PHASE 9 — Portal compatibility and autofill robustness

9.1 Verify real compatibility per portal. P1, effort L, ongoing.
   Run real test applications on the listed portals, record which questions appear and which
   errors or limits we hit, and add those fields to our questionnaire so coverage grows over
   time.

9.2 Handle redirects to company career sites. P1, effort L.
   Many listings on LinkedIn redirect to company sites such as Abbott, AbbVie, Amazon or
   Nestle. Workday is the key processor to support well. Strengthen filling on these.

9.3 Auto handle the tricky acceptance checkboxes and "how did you hear" fields. P2, M.
   Use the defaults from Phase 2 so these common fields are answered automatically.

9.4 Explore automatic account creation on portals. P3, effort L, uncertain.
   Investigate creating the account automatically using the user's email and a preselected
   password. Flagged by the client as difficult; treat as research.


PHASE 10 — Onboarding help and the extension guide

10.1 Add a short how to use video for the extension. P2, effort S.
   The audience is often over 40 and not very technical, so a short visual guide helps.

10.2 Translate the "How to use" page to Spanish. P1, effort S.
   It is currently in English. Also add the video there.


CROSS-CUTTING — Language consistency (high priority, fixes several complaints at once)

Pass the user's selected language into every AI request and instruct the AI to answer only
in that language. This single change fixes the English interview questions, the English ATS
recommendations, and the mixed language Super CV. It affects the interview, ATS scoring and
simulation, cover letters, Super CV, ghost recruiter, salary insights and field answers.
Effort M. Treat as P0 because it touches the most visible features.


SUGGESTED ORDER OF WORK

First, Phase 1 and the cross cutting language fix, because they make the product feel solid
and remove the most visible problems. Second, Phase 2, the mandatory preferences
questionnaire, since it unlocks correct autofill and better recommendations and is the
client's top functional priority. Third, Phases 3, 4 and 5, profile accuracy, document
selection, and the credits and plans clarity. Then Phases 6 and 7 for presentation and the
ATS tools. Then Phase 8, the autonomous assistant, as the strategic value. Phases 9 and 10,
portal hardening and the help materials, run alongside as ongoing work.

One guiding sentence from the client to keep in mind: the main pain point is saving time in
the job search, so anything that makes the autofill complete and reliable, with no empty
fields or errors, is the highest value we can deliver.
