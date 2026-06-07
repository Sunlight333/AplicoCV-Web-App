// MV3 background service worker. Owns auth token storage, profile fetching, and
// the active-tab portal detection. It does NOT keep long operations alive in
// memory — anything slow goes through the backend and is polled from the page.

import { API_BASE, POLL_INTERVAL_MS } from './src/config.js'
import { encrypt, decrypt } from './src/crypto.js'

const SUPPORTED = [
  { name: 'LinkedIn', match: /linkedin\.com/ },
  { name: 'Workday', match: /myworkdayjobs\.com/ },
  { name: 'Indeed', match: /indeed\.com/ },
  { name: 'Get on Board', match: /getonbrd\.com/ },
  { name: 'Greenhouse', match: /greenhouse\.io/ },
  { name: 'Lever', match: /lever\.co/ },
  { name: 'Computrabajo', match: /computrabajo\./ },
  { name: 'Glassdoor', match: /glassdoor\./ },
  { name: 'Bumeran', match: /bumeran\./ },
  { name: 'Zonajobs', match: /zonajobs\./ },
  { name: 'Laborum', match: /laborum\./ },
  { name: 'Konzerta', match: /konzerta\./ },
  { name: 'Trabajando.com', match: /trabajando\.com/ },
  { name: 'WeRemoto', match: /weremoto\.com/ },
  { name: 'RemoteOK', match: /remoteok\.com/ },
  { name: 'We Work Remotely', match: /weworkremotely\.com/ },
]

async function getToken() {
  const { authToken } = await chrome.storage.local.get('authToken')
  if (!authToken) return null
  try {
    return await decrypt(authToken)
  } catch {
    return null
  }
}

async function apiFetch(path, options = {}) {
  const token = await getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.status === 204 ? null : res.json()
}

function detectPortal(url) {
  if (!url) return null
  return SUPPORTED.find((p) => p.match.test(url)) || null
}

// Portal selector maps come from the backend (GET /portals/configs) and are
// cached for an hour so they can be updated server-side without an extension
// release. Falls back to the last cached copy if the network is unavailable.
const CONFIG_TTL_MS = 60 * 60 * 1000

async function getPortalConfigs() {
  const { portalConfigs } = await chrome.storage.local.get('portalConfigs')
  if (portalConfigs && Date.now() - portalConfigs.ts < CONFIG_TTL_MS) return portalConfigs.data
  try {
    const data = await apiFetch('/portals/configs')
    await chrome.storage.local.set({ portalConfigs: { ts: Date.now(), data } })
    return data
  } catch {
    return portalConfigs?.data || []
  }
}

async function getPortalConfig(url) {
  const portal = detectPortal(url)
  if (!portal) return null
  const configs = await getPortalConfigs()
  return configs.find((c) => c.name === portal.name) || null
}

// MV3 resilience: long backend work returns an Operation id which we poll until
// it resolves, instead of holding a single long-lived request open (the worker
// can be terminated after ~30s of inactivity). See GET /operations/{id}/result.
async function pollOperation(opId, { tries = 40 } = {}) {
  for (let i = 0; i < tries; i++) {
    const op = await apiFetch(`/operations/${opId}/result`)
    if (op.status === 'completed') return op.result
    if (op.status === 'error') throw new Error(op.result?.error || 'operation failed')
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  throw new Error('operation timed out')
}

// Message router for popup + content/bridge scripts.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  ;(async () => {
    try {
      switch (msg.type) {
        case 'SET_TOKEN':
          // Stored under AES-256-GCM encryption (see src/crypto.js).
          await chrome.storage.local.set({ authToken: await encrypt(msg.token) })
          sendResponse({ ok: true })
          break
        case 'GET_AUTH': {
          const token = await getToken()
          if (!token) return sendResponse({ authenticated: false })
          try {
            const user = await apiFetch('/auth/me')
            sendResponse({ authenticated: true, user })
          } catch {
            sendResponse({ authenticated: false })
          }
          break
        }
        case 'GET_PROFILE': {
          const profile = await apiFetch('/profiles/me')
          // Attach the user's job preferences (gender, veteran, licence, default
          // acceptances, how-did-you-hear, etc.) so the content script can fill the
          // tricky application fields the CV alone does not cover (Phase 2).
          try {
            const me = await apiFetch('/auth/me')
            if (me && me.preferences) profile.preferences = me.preferences
          } catch {
            /* preferences are best-effort */
          }
          // Short-lived session cache, encrypted at rest (Phase 1.5) — the cached
          // profile is no longer stored in plaintext.
          try {
            await chrome.storage.session.set({ profileEnc: await encrypt(JSON.stringify(profile)) })
          } catch {
            /* caching is best-effort; the response below is the source of truth */
          }
          sendResponse({ profile })
          break
        }
        case 'AUTOFILL_EVENT': {
          // Telemetry for measured time-saved (Phase 2.5).
          try {
            await apiFetch('/applications/autofill-event', {
              method: 'POST',
              body: JSON.stringify({
                fieldsFilled: msg.fieldsFilled || 0,
                portal: msg.portal || null,
                jobUrl: msg.jobUrl || null,
              }),
            })
          } catch {
            /* non-critical */
          }
          sendResponse({ ok: true })
          break
        }
        case 'FIELD_ANSWER': {
          // Phase 1.4 — AI-generated answer for one open-text application field.
          try {
            const res = await apiFetch('/ai/field-answer', {
              method: 'POST',
              body: JSON.stringify({
                fieldLabel: msg.fieldLabel || '',
                jobDescription: msg.jobDescription || null,
              }),
            })
            sendResponse({ answer: res.answer })
          } catch (err) {
            sendResponse({ error: String(err) })
          }
          break
        }
        case 'APPLY_QUEUE': {
          // Prepared "apply on your behalf" tasks the extension can autofill.
          try {
            sendResponse({ tasks: await apiFetch('/apply/queue') })
          } catch {
            sendResponse({ tasks: [] })
          }
          break
        }
        case 'APPLY_SUBMITTED': {
          try {
            await apiFetch(`/apply/${encodeURIComponent(msg.taskId)}/submitted`, { method: 'POST' })
            sendResponse({ ok: true })
          } catch (err) {
            sendResponse({ error: String(err) })
          }
          break
        }
        case 'GET_FAQ': {
          // Saved answers to common application questions → open-text autofill.
          try {
            sendResponse({ faq: await apiFetch('/faq') })
          } catch {
            sendResponse({ faq: [] })
          }
          break
        }
        case 'GET_CREDITS': {
          try {
            sendResponse({ credits: await apiFetch('/credits') })
          } catch {
            sendResponse({ credits: null })
          }
          break
        }
        case 'DETECT_PORTAL': {
          const portal = detectPortal(msg.url)
          if (!portal) {
            sendResponse({ supported: false, level: 'none', portal: null, selectors: {} })
            break
          }
          // Tri-state: a known portal WITH a selector map is "full"; a known
          // portal without one falls back to generic matching ("partial").
          let selectors = {}
          let quirks = null
          try {
            const cfg = await getPortalConfig(msg.url)
            selectors = cfg?.selectors || {}
            quirks = cfg?.quirks || null
          } catch {
            /* offline → generic matching still works */
          }
          const level = Object.keys(selectors).length ? 'full' : 'partial'
          sendResponse({ supported: true, level, portal: portal.name, selectors, quirks })
          break
        }
        case 'TRACK_APPLICATION':
          await apiFetch('/applications', {
            method: 'POST',
            body: JSON.stringify(msg.payload),
          })
          sendResponse({ ok: true })
          break
        case 'ATS_SCORE': {
          const result = await apiFetch('/ats/score', {
            method: 'POST',
            body: JSON.stringify({ jobDescription: msg.jobDescription }),
          })
          sendResponse({ result })
          break
        }
        case 'COVER_LETTER': {
          const result = await apiFetch('/cover-letters/generate', {
            method: 'POST',
            body: JSON.stringify({
              jobDescription: msg.jobDescription,
              tone: msg.tone || 'professional',
            }),
          })
          sendResponse({ text: result.text })
          break
        }
        case 'TAILOR_FOR_URL': {
          // Phase 5 Real Auto-Tailoring. Returns immediately if a tailored
          // version is cached; otherwise the backend runs it as a job and we
          // poll the operation so a terminated worker can't drop the result.
          const op = await apiFetch(
            `/profiles/tailor-for-url?url=${encodeURIComponent(msg.url)}`,
          )
          const profile = op.status === 'completed' ? op.result : await pollOperation(op.id)
          sendResponse({ profile })
          break
        }
        case 'DECRYPT_CREDENTIAL': {
          // The decryption key lives only on the server; request the plaintext
          // for the matching portal just-in-time to fill a login form.
          const portal = detectPortal(`https://${msg.portal}`)?.name ?? msg.portal
          try {
            const credential = await apiFetch(
              `/credentials/decrypt?portal=${encodeURIComponent(portal)}`,
              { method: 'POST' },
            )
            sendResponse({ credential })
          } catch {
            sendResponse({ credential: null })
          }
          break
        }
        case 'LOGOUT':
          await chrome.storage.local.remove('authToken')
          await chrome.storage.session.remove('profileEnc')
          sendResponse({ ok: true })
          break
        default:
          sendResponse({ error: 'unknown message' })
      }
    } catch (err) {
      sendResponse({ error: String(err) })
    }
  })()
  return true // keep the message channel open for the async response
})
