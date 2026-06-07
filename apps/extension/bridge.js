// Injected only on the AplicoCV web app's own domain. The web app posts the
// extension auth token via window.postMessage after login; this bridge forwards
// it to the service worker, which stores it encrypted in chrome.storage.local.

;(() => {
  // Only trust token messages from the AplicoCV web app's own origins.
  const ALLOWED_ORIGIN = /^https:\/\/([a-z0-9-]+\.)?aplicocv\.com$|^http:\/\/localhost:5173$/

  window.addEventListener('message', (event) => {
    if (event.source !== window) return
    if (!ALLOWED_ORIGIN.test(event.origin)) return // ignore forged/cross-origin messages
    const data = event.data
    if (data?.source === 'aplicocv-web' && data?.type === 'AUTH_TOKEN' && data.token) {
      chrome.runtime.sendMessage({ type: 'SET_TOKEN', token: data.token }, () => {
        // Tell the page the extension is connected so it can update the UI.
        window.postMessage({ source: 'aplicocv-extension', type: 'installed' }, event.origin)
      })
    }
  })

  // Announce presence on load so the Extension Download page can check off "installed".
  window.postMessage({ source: 'aplicocv-extension', type: 'installed' }, window.location.origin)
})()
