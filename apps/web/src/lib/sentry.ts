/**
 * Sentry error monitoring. Stays fully dormant unless VITE_SENTRY_DSN is set,
 * so development and the mock build never phone home. Initialised once at app
 * startup; the API client reports server/network failures via captureException.
 */
import * as Sentry from '@sentry/react'
import { env } from './env'

let initialized = false

export function initSentry(): void {
  if (!env.sentryEnabled || initialized) return
  Sentry.init({
    dsn: env.sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  })
  initialized = true
}

export function captureException(error: unknown): void {
  if (initialized) Sentry.captureException(error)
}
