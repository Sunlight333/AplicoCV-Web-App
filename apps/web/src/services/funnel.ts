import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { delay } from './mock/store'

// Preview of how many live postings match the funnel answers — powers the
// "matching…" and "we found N jobs" screens BEFORE the account exists.
//
// Honesty note (see ENFOQUE_2.0_ONBOARDING_FUNNEL_PLAN.md §4): the number shown to
// the user should come from the real search (the 4 live feeds + portal catalogue),
// not a fabricated figure. Until the backend `/public/funnel-preview` endpoint is
// live, this falls back to a profile-derived estimate and flags it as such, so we
// never hard-code an impressive-but-false "556".

export interface FunnelPreview {
  count: number
  /** true when `count` is the real live-search result; false when it's the estimate. */
  live: boolean
}

/** Rough, deterministic estimate from the answers — used only as a graceful
 *  fallback when the live endpoint isn't reachable. Kept conservative on purpose. */
function estimate(answers: Record<string, unknown>): number {
  const cats = Array.isArray(answers.categories) ? answers.categories.length : 1
  // modality is now a multi-select list; remote/hybrid widen the reachable pool.
  const modality = Array.isArray(answers.modality)
    ? (answers.modality as string[])
    : answers.modality
      ? [answers.modality as string]
      : []
  const remote = modality.includes('remote') ? 1.6 : modality.includes('hybrid') ? 1.2 : 1
  const base = 40 + cats * 22
  return Math.round(base * remote)
}

export async function previewMatches(
  answers: Record<string, unknown>,
): Promise<FunnelPreview> {
  if (env.useMocks) {
    await delay(600)
    return { count: estimate(answers), live: false }
  }
  try {
    const res = await api.post<{ count: number; live: boolean }>(
      '/public/funnel-preview',
      { answers },
      { anonymous: true },
    )
    // Honour the server's own honesty flag: it reports live=false when it could not
    // truly search (e.g. no feed covers this work style), and we must not present an
    // estimate as a real result. Fall back to the estimate in that case.
    if (res.live && res.count > 0) return { count: res.count, live: true }
    return { count: estimate(answers), live: false }
  } catch {
    // Endpoint not deployed yet, or the search failed — degrade to the estimate
    // rather than blocking the funnel.
    return { count: estimate(answers), live: false }
  }
}

/** Capture the lead email before checkout (remarketing / recovery). Best-effort. */
export async function captureLead(email: string, answers: Record<string, unknown>): Promise<void> {
  if (env.useMocks) {
    await delay(200)
    return
  }
  try {
    await api.post('/public/funnel-lead', { email, answers }, { anonymous: true })
  } catch {
    /* never block the funnel on lead capture */
  }
}

/** Persist the funnel answers on the (now authenticated) account AND apply them to
 *  the user's job preferences, so the profile lands pre-filled. Best-effort — a
 *  failure never blocks the funnel; the answers also live in localStorage. */
export async function adoptFunnel(answers: Record<string, unknown>): Promise<void> {
  if (env.useMocks) {
    await delay(150)
    return
  }
  try {
    await api.post('/users/me/funnel', { answers })
  } catch {
    /* best-effort: the raw answers remain in localStorage for a later retry */
  }
}
