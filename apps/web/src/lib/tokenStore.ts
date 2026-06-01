/**
 * The access token lives in memory only (never localStorage) to limit XSS blast
 * radius. The refresh token is an HttpOnly cookie the browser sends automatically
 * to the refresh endpoint, so it never touches JS.
 *
 * Because the access token is in memory, a hard refresh / new tab starts with no
 * token — the app performs a silent refresh on mount (see AuthProvider bootstrap).
 */
let accessToken: string | null = null

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token
  },
  clear: () => {
    accessToken = null
  },
}
