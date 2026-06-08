// Injected only on the AplicoCV web app's own domain. The web app posts the
// extension auth token via window.postMessage after login; this bridge forwards
// it to the service worker, which stores it encrypted in chrome.storage.local.

;(() => {
  // Only trust token messages from the AplicoCV web app's own origins.
  const ALLOWED_ORIGIN = /^https:\/\/([a-z0-9-]+\.)?aplicocv\.com$|^http:\/\/localhost:5173$/

  // This content script keeps running in already-open tabs after the extension is
  // reloaded or auto-updated, which invalidates its extension context. Any chrome.*
  // call then throws "Extension context invalidated". `alive()` detects that so we
  // can skip the call (and stop listening) instead of throwing into the page.
  function alive() {
    try {
      return Boolean(chrome.runtime && chrome.runtime.id)
    } catch {
      return false
    }
  }

  function onMessage(event) {
    if (event.source !== window) return
    if (!ALLOWED_ORIGIN.test(event.origin)) return // ignore forged/cross-origin messages
    const data = event.data
    if (!(data?.source === 'aplicocv-web' && data?.type === 'AUTH_TOKEN' && data.token)) return

    if (!alive()) {
      // The extension was reloaded/updated; this stale bridge can't reach it.
      window.removeEventListener('message', onMessage)
      return
    }
    try {
      chrome.runtime.sendMessage({ type: 'SET_TOKEN', token: data.token }, () => {
        try {
          void chrome.runtime.lastError // read to silence "unchecked lastError"
          // Tell the page the extension is connected so it can update the UI.
          window.postMessage({ source: 'aplicocv-extension', type: 'installed' }, event.origin)
        } catch {
          /* context went away between the call and the callback — ignore */
        }
      })
    } catch {
      // Context invalidated mid-call; stop listening so we don't error again.
      window.removeEventListener('message', onMessage)
    }
  }

  window.addEventListener('message', onMessage)

  // Announce presence on load (a page-only postMessage; safe even if the context is gone).
  try {
    window.postMessage({ source: 'aplicocv-extension', type: 'installed' }, window.location.origin)
  } catch {
    /* no-op */
  }
})()
