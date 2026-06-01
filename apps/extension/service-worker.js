// MV3 background service worker. Owns auth token storage, profile fetching, and
// the active-tab portal detection. It does NOT keep long operations alive in
// memory — anything slow goes through the backend and is polled from the page.

import { API_BASE } from './src/config.js'

const SUPPORTED = [
  { name: 'LinkedIn', match: /linkedin\.com/ },
  { name: 'Workday', match: /myworkdayjobs\.com/ },
  { name: 'Indeed', match: /indeed\.com/ },
  { name: 'Get on Board', match: /getonbrd\.com/ },
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
  return authToken || null
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

// Message router for popup + content/bridge scripts.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  ;(async () => {
    try {
      switch (msg.type) {
        case 'SET_TOKEN':
          await chrome.storage.local.set({ authToken: msg.token })
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
          // Short-lived session cache the content script can read.
          await chrome.storage.session.set({ profile })
          sendResponse({ profile })
          break
        }
        case 'DETECT_PORTAL': {
          const portal = detectPortal(msg.url)
          sendResponse({ portal: portal?.name ?? null, supported: !!portal })
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
          await chrome.storage.session.remove('profile')
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
