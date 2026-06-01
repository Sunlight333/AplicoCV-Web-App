/**
 * The access token lives in memory only (never localStorage) to limit XSS blast
 * radius. The refresh token is an HttpOnly cookie the browser sends automatically
 * to the refresh endpoint, so it never touches JS.
 *
 * Because the access token is in memory, a hard refresh / new tab starts with no
 * token — the app performs a silent refresh on mount (see AuthProvider bootstrap).
 */
let accessToken: string | null = null

/**
 * Broadcast the token to the AplicoCV Chrome extension (if installed). Its bridge
 * content script listens for this postMessage and stores it for autofill.
 */
function broadcastToExtension(token: string | null) {
  if (token) {
    window.postMessage({ source: 'aplicocv-web', type: 'AUTH_TOKEN', token }, window.location.origin)
  }
}

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token
    broadcastToExtension(token)
  },
  clear: () => {
    accessToken = null
  },
}
