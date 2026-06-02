# Deploying AplicoCV to the Chrome Web Store

A step-by-step guide to publish the AplicoCV extension (`apps/extension`) to the
Chrome Web Store. Budget **3–7 business days** for Google's review of a new
extension.

---

## 0. Prerequisites

- A Google account for the developer dashboard.
- The **one-time US$5** developer registration fee (a payment card).
- The extension source in `apps/extension/`.
- The backend reachable over **HTTPS** in production (see the warning in §3).

---

## 1. Create the developer account

1. Go to the **Chrome Web Store Developer Dashboard**:
   https://chrome.google.com/webstore/devconsole
2. Sign in, accept the developer agreement, and pay the **US$5** one-time fee.
3. (Recommended) Verify a publisher email/group so the listing shows a trusted
   publisher name.

---

## 2. Pre-flight: get the extension production-ready

### 2a. Point the extension at production
Edit `apps/extension/src/config.js`:
```js
const DEV = false                 // false = use the PROD block below
const PROD = {
  API_BASE:    'https://api.aplicocv.com/api',   // your HTTPS backend
  WEB_APP_URL: 'https://aplicocv.com',
}
```
Then update the production URLs in **two** places in `manifest.json` to match:
- `host_permissions` — add `"https://api.aplicocv.com/*"` (and the web app origin).
- the **bridge** content-script `matches` — add `"https://aplicocv.com/*"`.

> The current files use the VPS IP `http://162.243.229.139`. Google **requires
> HTTPS** for remote hosts and generally rejects bare-IP host permissions, so
> put the backend behind a domain + TLS first (see §3).

### 2b. Bump the version
In `manifest.json`, set `"version"` (e.g. `1.0.0`). Every store update needs a
higher version than the last published one.

### 2c. Replace the placeholder icons
`icons/icon16.png|icon48.png|icon128.png` are minimal generated marks. Replace
the 128px with a crisp branded icon (you can export from the generated 3D logo at
`apps/web/public/brand/logo-3d.png`, flattened on a solid or transparent square).
The 128px icon is shown prominently in the store.

### 2d. Final local test
1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
   select `apps/extension/`.
2. Sign in on the web app, open a supported portal, confirm autofill works and
   no console errors appear in the service worker (`chrome://extensions` →
   *Inspect views: service worker*).

---

## 3. ⚠️ HTTPS is required before publishing

The extension talks to the backend with `fetch`. Chrome blocks mixed/insecure
content and the store review will flag plain-HTTP remote calls. Before
submitting:

1. Point a **domain** (e.g. `api.aplicocv.com`) at the VPS `162.243.229.139`.
2. Issue a TLS cert with **Certbot** on the server:
   ```bash
   apt-get install -y certbot python3-certbot-nginx
   certbot --nginx -d aplicocv.com -d api.aplicocv.com
   ```
   Certbot rewrites nginx to listen on 443 and sets up auto-renewal.
3. Update `config.js` + `manifest.json` to the `https://` URLs (§2a).

(If you don't yet have a domain, you can still privately test via *Load unpacked*,
but the public store listing should not ship pointing at bare HTTP.)

---

## 4. Package the extension

The store wants a **ZIP of the extension folder contents** (manifest at the ZIP
root — not nested inside a parent folder):

```bash
cd apps/extension
zip -r ../aplicocv-extension.zip . \
  -x "*.md" -x ".*" -x "*/.DS_Store"
```

Verify the ZIP has `manifest.json` at its top level:
```bash
unzip -l ../aplicocv-extension.zip | head
```

---

## 5. Create the store listing

In the Developer Dashboard → **Add new item** → upload the ZIP, then fill in the
**Store listing** tab:

| Field | Guidance |
| --- | --- |
| **Name** | AplicoCV — One-click job applications |
| **Summary** (132 chars) | Autofill job applications across LinkedIn, Workday, Indeed & 11 more — tailored by AI. |
| **Description** | What it does, supported portals, that it needs a free AplicoCV account. |
| **Category** | Productivity |
| **Language** | English (add Spanish/Portuguese listings later for LATAM reach) |
| **Icon** | 128×128 PNG (from §2c) |
| **Screenshots** | 1–5 at **1280×800** or 640×400 — show the popup + an autofill in action |
| **Small promo tile** | 440×280 (optional but recommended) |

---

## 6. Privacy & permissions (required, and review-critical)

This is where most new extensions get delayed. Fill the **Privacy practices** tab
carefully and truthfully:

- **Single purpose** — one sentence: *"AplicoCV autofills job-application forms
  using the data in the user's AplicoCV profile."*
- **Permission justifications** — justify each:
  - `storage` — cache the encrypted auth token and a short-lived profile copy.
  - `activeTab` / `scripting` — read and fill form fields on the page the user
    explicitly triggers autofill on.
  - `tabs` — detect the active job portal to show compatibility.
  - **host permissions** — list why each portal domain is needed (to fill that
    portal's application form).
- **Remote code** — declare **"No, I am not using remote code"** (all JS ships in
  the package; you only fetch *data* via your API).
- **Data usage** — disclose that the extension transmits profile data to your
  backend to perform autofill; link a **Privacy Policy URL** (required when you
  handle personal data). Host a privacy policy page (e.g. `aplicocv.com/privacy`).
- Confirm you **do not sell** user data and use it only for the stated purpose.

> Credential autofill note: the extension stores portal passwords encrypted and
> decrypts them server-side on demand, always behind an explicit user
> confirmation. Describe this accurately — handling login credentials draws extra
> review scrutiny, so transparency speeds approval.

---

## 7. Distribution & submit

1. **Visibility** — Public, Unlisted, or Private. For a first launch, **Unlisted**
   (anyone with the link, not searchable) is a good way to pilot before going
   fully Public.
2. **Regions** — all, or restrict to your launch markets (e.g. LATAM + US).
3. Click **Submit for review**.

You'll get an email when it's approved or if changes are requested. New-extension
review is typically **3–7 business days**.

---

## 8. After approval

- The public URL is `https://chrome.google.com/webstore/detail/<your-extension-id>`.
- Put that link behind the **Extension** page's "Add to Chrome" button — update
  `CHROME_STORE_URL` in `apps/web/src/pages/ExtensionPage.tsx`.
- The extension ID is stable across updates; the web app's `bridge.js` handshake
  keeps working as long as the listed web-app origin matches `WEB_APP_URL`.

### Publishing updates
1. Bump `manifest.json` `"version"`.
2. Re-zip (§4) and upload a new package to the same item.
3. Submit — updates usually review faster than the initial submission.

---

## 9. Pre-submit checklist

- [ ] `DEV = false`; `config.js` + `manifest.json` use **HTTPS** production URLs.
- [ ] `manifest.json` `version` bumped.
- [ ] 128px branded icon in place.
- [ ] Loaded unpacked and autofill verified end-to-end with no console errors.
- [ ] Privacy Policy URL live and reachable.
- [ ] Permission justifications written for every permission + host.
- [ ] "No remote code" declared.
- [ ] Screenshots (1280×800) and summary prepared.
- [ ] ZIP has `manifest.json` at the root.
