# AplicoCV — Chrome Extension (Phase 4)

Manifest V3 extension that autofills job-application forms across 12+ portals
using your AplicoCV profile.

## Architecture

Three execution contexts communicating via `chrome.runtime` messages:

- **Service worker** (`service-worker.js`) — owns the auth token
  (`chrome.storage.local`), fetches the profile, detects the active portal, and
  proxies all backend calls. Stateless re: long jobs (MV3 workers can be killed).
- **Content script** (`content-script.js`) — injected on portal pages. Detects
  fields (label + attribute matching, multilingual EN/ES/PT), fills them with
  **native input-event simulation** so React/Vue forms register the change, uses
  a `MutationObserver` for SPA-rendered fields, and shows a login-autofill prompt.
- **Popup** (`popup.html` / `popup.js`) — the UI: compatibility badge, the
  Autofill button, dashboard/sign-out links.
- **Bridge** (`bridge.js`) — injected only on the AplicoCV web app; receives the
  auth token from the page via `postMessage` and hands it to the service worker.

## The MV3 service-worker problem

Long operations never rely on a live message response (the worker can be
terminated after ~30s). Instead the backend does the work and the result is
polled from a content script — see `POLL_INTERVAL_MS` in `src/config.js`.

## Load it (unpacked)

1. Run the backend (`apps/api`) and web app (`apps/web`) locally.
2. Chrome → `chrome://extensions` → enable **Developer mode**.
3. **Load unpacked** → select this `apps/extension` folder.
4. Sign in at http://localhost:5173/login — the bridge captures your token.
5. Open any supported portal and click the AplicoCV icon → **Autofill**.

No build step: the extension is plain JS/HTML loaded directly. Update
`src/config.js` (`API_BASE`, `WEB_APP_URL`) to point at deployed URLs for release.

## Supported portals

LinkedIn, Workday, Indeed, Get on Board, Computrabajo, Glassdoor, Bumeran,
Zonajobs, Laborum, Konzerta, RemoteOK, We Work Remotely. Unlisted sites fall back
to generic label/attribute matching.
