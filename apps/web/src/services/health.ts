import { env } from '@/lib/env'

export interface HealthReport {
  status: string
  environment?: string
  integrations?: {
    llm?: string
    payments?: string
    stripe?: boolean
    mercadopago?: boolean
    google_oauth?: boolean
    storage?: string
    email?: string
    sentry?: boolean
  }
}

/**
 * Probe the backend's public /api/health endpoint. Returns null if it can't be
 * reached (network error / non-200) so the Status page can show a degraded state
 * instead of pretending everything is fine. In mock mode there is no backend, so
 * we report a healthy stub.
 */
export async function getHealth(): Promise<HealthReport | null> {
  if (env.useMocks) {
    return { status: 'ok', integrations: { llm: 'mock', storage: 'local', email: 'console' } }
  }
  try {
    const res = await fetch(`${env.apiBaseUrl}/health`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    return (await res.json()) as HealthReport
  } catch {
    return null
  }
}
