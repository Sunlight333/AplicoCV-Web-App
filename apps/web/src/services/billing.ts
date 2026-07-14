import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { delay, store } from './mock/store'
import { persistedAuth } from './mock/data'

export interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'week' | 'month' | 'year' | 'once'
  credits: number | null
  features: string[]
  highlighted: boolean
  kind: 'subscription' | 'credits'
  current: boolean
}

// Enfoque 2.0: subscription‑only, two USD plans, no free tier and no credit packs.
const MOCK_PLANS: Plan[] = [
  { id: 'weekly', name: 'Weekly', price: 9, currency: 'USD', interval: 'week', credits: null, kind: 'subscription', highlighted: false, current: false, features: ['Full access to every feature', 'Autonomous AI job search', 'CV tailored to each job (ATS)', 'AI mock interviews', 'Cancel anytime'] },
  { id: 'monthly', name: 'Monthly', price: 17, currency: 'USD', interval: 'month', credits: null, kind: 'subscription', highlighted: true, current: false, features: ['Everything in Weekly', 'Best value', 'Autonomous AI job search', 'CV tailored to each job (ATS)', 'AI mock interviews'] },
]

export async function getPlans(): Promise<Plan[]> {
  if (env.useMocks) {
    await delay(200)
    return MOCK_PLANS
  }
  return api.get<Plan[]>('/billing/plans')
}

export interface PublicPricing {
  currency: string
  plans: Pick<Plan, 'id' | 'name' | 'interval' | 'credits' | 'kind' | 'price' | 'currency'>[]
}

/** Public catalogue + prices in the active currency (no auth) — for the landing. */
export async function getPublicPricing(): Promise<PublicPricing> {
  if (env.useMocks) {
    await delay(150)
    return { currency: 'USD', plans: MOCK_PLANS }
  }
  return api.get<PublicPricing>('/billing/pricing')
}

/** Begin a checkout session for the chosen subscription plan ('weekly' | 'monthly'). */
export async function startCheckout(plan: string = 'monthly'): Promise<void> {
  if (env.useMocks) {
    // Simulate a completed purchase so the demo's pay→portal flow works end to end.
    await delay(400)
    store.user = { ...store.user, plan: 'premium', premiumActive: true }
    persistedAuth.savePremium(true)
    window.location.href = '/subscribe?upgraded=1'
    return
  }
  const { url } = await api.post<{ url: string }>('/billing/checkout', { plan })
  window.location.href = url
}

/**
 * Reconcile any paid-but-unfulfilled MercadoPago order. Called when the user
 * returns to the billing page after checkout, as a fallback for a webhook that
 * never arrived (so a charged customer still gets their credits / upgrade).
 * Returns how many orders were applied. Idempotent server-side.
 */
export async function reconcilePayments(): Promise<{ fulfilled: number }> {
  if (env.useMocks) {
    await delay(100)
    return { fulfilled: 0 }
  }
  try {
    return await api.post<{ fulfilled: number }>('/billing/reconcile')
  } catch {
    return { fulfilled: 0 }
  }
}

/** Open the Stripe Customer Portal for plan / billing management. */
export async function openCustomerPortal(): Promise<void> {
  if (env.useMocks) {
    await delay(400)
    alert('[mock] Would redirect to the Stripe Customer Portal.')
    return
  }
  const { url } = await api.post<{ url: string }>('/billing/portal')
  window.location.href = url
}
