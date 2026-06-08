AplicoCV — Chrome Web Store Publishing Guide

This guide follows the actual Developer Dashboard screens for the AplicoCV
extension, in the order they appear in the left-hand menu. Plan for three to
seven business days of Google review for a new extension.

The dashboard groups the screens like this:

  Compilation
    State
    Package
    Play Store Fact Sheet
    Privacy
    Distribution
  Access
    Test instructions
  Analysis
    Installations and removals, Views, Users, Qualification (statistics only)

You fill in the Compilation and Access screens. The Analysis screens are
read-only statistics that appear after the extension is published. When every
required screen is complete, the greyed-out "Send for review" button at the top
becomes active.


Before you start

  - A Google account, signed in to https://chrome.google.com/webstore/devconsole
  - The one-time developer registration fee of five US dollars, paid once
  - The extension folder at apps/extension
  - The backend reachable over HTTPS (this is now the case: the API is live at
    https://aplicocv.com/api). Google rejects extensions that call a plain-HTTP
    or bare-IP backend, so this matters.


Step 1 — Prepare the extension files for production

Open apps/extension/src/config.js and confirm it points at the live HTTPS
backend, not localhost:

    const DEV = false
    const PROD = {
      API_BASE:    'https://aplicocv.com/api',
      WEB_APP_URL: 'https://aplicocv.com',
    }

Open manifest.json and make sure the production origin appears in two places:

  - in "host_permissions", the entry "https://aplicocv.com/*"
  - in the bridge content script "matches", the entry "https://aplicocv.com/*"

Set the "version" in manifest.json. The current package is 1.4.4 (the
ready-to-upload zip is apps/extension/AplicoCV-extension-1.4.4.zip). Every
resubmission must use a higher number than the previously uploaded draft.

Replace the placeholder toolbar icons in apps/extension/icons if you have not
already. The store also needs a separate 128 by 128 listing icon, which is
prepared for you at apps/extension/store-icon-128.png.


Step 2 — Test it locally one last time

  1. Open chrome://extensions and turn on Developer mode.
  2. Choose "Load unpacked" and select the apps/extension folder.
  3. Sign in on the web app so the bridge captures your token.
  4. Open a supported job portal, click the AplicoCV icon, and run autofill.
  5. On chrome://extensions, open "Inspect views: service worker" and confirm
     there are no errors in its console.


Step 3 — Package the extension as a ZIP

The store expects a ZIP whose manifest.json sits at the top level, not inside a
parent folder. From the apps/extension directory:

    zip -r ../aplicocv-extension.zip . -x "*.md" -x ".*" -x "*/.DS_Store"

Confirm the manifest is at the root of the archive:

    unzip -l ../aplicocv-extension.zip | head


Step 4 — State screen

This screen shows the item name, the draft status, and the item ID. There is
nothing to fill in here. Use it to confirm you are editing the right item and to
read the "Why can't I send it?" link, which lists whatever is still missing.


Step 5 — Package screen

This is where you upload the ZIP from Step 3. After it uploads, the dashboard
reads the manifest and shows the version and the permissions it requests. If the
upload is rejected, the message almost always points to the manifest version or
to a permission that needs justifying on the Privacy screen.


Step 6 — Play Store Fact Sheet screen

This is the public product page. Despite the "Play Store" label, it is the
Chrome Web Store listing. Fill in each field.

Title. Already set to: AplicoCV — One-click job applications

Summary. A short single line, for example: Autofill job application forms across
major portals with your AplicoCV profile.

Description. The longer text that explains what the extension does and why
someone should install it.

IMPORTANT — keyword-spam rejection. Google rejected an earlier draft under "Spam
and placement" because the description listed every supported portal by name,
which reads as keyword stuffing. Do NOT paste a long list of portal/brand names.
Describe coverage in plain language instead. Use this cleaned copy:

    AplicoCV fills out job application forms for you, in one click.

    Tired of retyping your name, email, work history and skills into every job
    site? Upload your CV once to AplicoCV and our AI structures your professional
    profile. After that, the extension completes application forms on the sites
    you already use — so you spend your time applying, not copy-pasting.

    What it does
    - One-click autofill on job application forms
    - Recognizes fields by their labels, even on modern sites that load their
      forms dynamically
    - Fills using native input events, so forms built with frameworks like React
      or Vue register your details correctly
    - Shows whether the current page is supported, right in the popup
    - Optional login autofill for saved portal credentials, always with your
      confirmation

    Where it works
    It supports the major international and Latin American job portals, and falls
    back to smart field detection on other sites, so it keeps working across the
    places you actually apply.

    Privacy and security
    Your sign-in token is stored encrypted on your device. Saved portal passwords
    are encrypted and only decrypted on the server, on demand, and always after
    you confirm. Your data is used only to autofill your applications and is never
    sold.

    A free AplicoCV account is required. Sign in once and the extension connects
    to your profile automatically.

Category. Choose Tools.

Language. Choose English (United States). You can add Spanish and Portuguese
listings later for the LATAM audience.

Graphic resources on this same screen:

  - Chrome Web Store icon, 128 by 128 pixels. Use
    apps/extension/store-icon-128.png.
  - Screenshots, at least one, up to five, sized 1280 by 800, saved as 24-bit
    JPEG or PNG with no transparency. Two ready-to-use captures of the live site
    are at apps/extension/store-assets.
  - The promotional video, small promotional image, and marquee image are
    optional. You can leave them empty.

Additional fields lower on the screen:

  - Official URL. Leave as None for now. Linking it requires verifying domain
    ownership in Google Search Console, which you can do later.
  - Homepage URL. Enter https://aplicocv.com
  - Support URL ("URL of the assistance"). Enter https://aplicocv.com, or a
    dedicated support page once one exists.
  - Adult content. Leave this off.


Step 7 — Privacy screen

This screen decides most approvals and rejections, so be accurate.

Single purpose. State it in one sentence, for example: AplicoCV autofills job
application forms using the data in the user's AplicoCV profile.

Permission justifications. The extension requests only two API permissions plus
host access. Justify each exactly as requested (do not list permissions you do
not request — the earlier "scripting"/"activeTab" entries were removed):

  - storage: to cache the encrypted sign-in token and a short-lived copy of the
    profile used to fill forms
  - tabs: to detect which job site the user is on and show whether it is
    supported
  - host permissions: each supported site's domain is needed so the extension
    can read and fill that site's application form (the content script that does
    the filling is declared statically in the manifest, so no "scripting"
    permission is needed)

Remote code. Answer that you are NOT using remote code. All JavaScript ships
inside the package; the extension only fetches data from your API.

Data usage and privacy policy. Disclose that the extension sends profile data to
your backend in order to perform autofill, and provide a Privacy Policy URL.
This URL is required because the extension handles personal data. Plan to host
a policy page, for example at https://aplicocv.com/privacy, before you submit.
Confirm that you do not sell user data and use it only for the stated purpose.

Because the extension can autofill saved portal passwords, describe that flow
plainly: passwords are stored encrypted, decrypted only on the server on demand,
and filled only after the user confirms. Being upfront about credential handling
speeds review rather than slowing it.


Step 8 — Distribution screen

Visibility. For a first launch, Unlisted is a safe choice: anyone with the link
can install it, but it does not appear in search. You can switch to Public
later. The "Change visibility here" link on the dashboard opens this same
setting.

Regions. Choose all regions, or limit to your launch markets such as Latin
America and the United States.


Step 9 — Test instructions screen (under Access)

Reviewers need a working account to test autofill. Provide the demo login and a
short script, for example:

    Sign in at https://aplicocv.com/login with:
      email: demo@aplicocv.com
      password: password123
    Then open any supported job portal (for example LinkedIn), click the
    AplicoCV toolbar icon, and press Autofill. The form fields will populate.


Step 10 — Send for review

When the State screen and the "Why can't I send it?" link no longer list
anything missing, the "Send for review" button at the top becomes active. Click
it. Google emails you when the extension is approved or if changes are
requested. New-extension review usually takes three to seven business days.


After approval

The public address is https://chrome.google.com/webstore/detail/your-extension-id.
Put that link behind the "Add to Chrome" button on the web app by updating
CHROME_STORE_URL in apps/web/src/pages/ExtensionPage.tsx. The extension ID stays
the same across updates, and the web app's token handshake keeps working as long
as the listed web-app origin matches WEB_APP_URL in config.js.

To publish an update later: raise the version in manifest.json, re-zip as in
Step 3, upload the new package to the same item, and submit again. Updates are
usually reviewed faster than the first submission.


Quick checklist before submitting

  - config.js has DEV set to false and uses the HTTPS production URLs
  - manifest.json version raised, production origin present in host_permissions
    and in the bridge matches
  - 128 by 128 listing icon uploaded
  - at least one 1280 by 800 screenshot uploaded, with no transparency
  - description, category (Tools), and language filled in
  - Homepage and Support URLs entered
  - Privacy Policy URL live and reachable
  - permission justifications written, remote code answered No
  - test instructions include the demo login
  - loaded unpacked and verified autofill works with no service-worker errors
