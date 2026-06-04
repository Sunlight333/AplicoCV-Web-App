import { env } from './env'
import { tokenStore } from './tokenStore'
import { captureException } from './sentry'

export class ApiError extends Error {
  status: number
  detail: unknown
  constructor(status: number, message: string, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Skip the automatic 401 → refresh → retry dance (used by the refresh call itself). */
  skipAuthRetry?: boolean
  /** Skip attaching the Authorization header (used for login/register/refresh). */
  anonymous?: boolean
}

/**
 * Single-flight refresh: if many requests 401 at once we only hit /auth/refresh
 * once and let them all await the same promise.
 */
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // send the HttpOnly refresh cookie
        })
        if (!res.ok) return false
        const data = (await res.json()) as { accessToken: string }
        tokenStore.set(data.accessToken)
        return true
      } catch {
        return false
      } finally {
        // Reset on next tick so concurrent callers share this attempt.
        setTimeout(() => {
          refreshPromise = null
        }, 0)
      }
    })()
  }
  return refreshPromise
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) return res.json()
  if (res.status === 204) return null
  return res.text()
}

async function rawRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const { body, anonymous, skipAuthRetry, headers, ...rest } = options

  const finalHeaders = new Headers(headers)
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders.set('Content-Type', 'application/json')
  }
  const token = tokenStore.get()
  if (!anonymous && token) {
    finalHeaders.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    headers: finalHeaders,
    credentials: 'include',
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  })

  if (res.status === 401 && !anonymous && !skipAuthRetry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return rawRequest<T>(path, { ...options, skipAuthRetry: true })
    }
    tokenStore.clear()
    throw new ApiError(401, 'Session expired')
  }

  if (!res.ok) {
    const detail = await parseBody(res).catch(() => undefined)
    const message =
      (detail && typeof detail === 'object' && 'detail' in detail
        ? String((detail as Record<string, unknown>).detail)
        : undefined) ?? `Request failed with ${res.status}`
    const error = new ApiError(res.status, message, detail)
    // Report server-side failures to Sentry (no-op unless a DSN is configured).
    // Client/validation errors (4xx) are expected and left out to reduce noise.
    if (res.status >= 500) captureException(error)
    throw error
  }

  return (await parseBody(res)) as T
}

export const api = {
  get: <T>(path: string, options: RequestOptions = {}) =>
    rawRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    rawRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    rawRequest<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    rawRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options: RequestOptions = {}) =>
    rawRequest<T>(path, { ...options, method: 'DELETE' }),
  refresh: refreshAccessToken,
}
