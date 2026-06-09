import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { delay } from './mock/store'

export interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year' | 'once'
  credits: number | null
  features: string[]
  highlighted: boolean
  kind: 'subscription' | 'credits'
  current: boolean
}

const MOCK_PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: 0, currency: 'CLP', interval: 'month', credits: null, kind: 'subscription', highlighted: false, current: true, features: ['100 welcome credits', 'Daily check-in rewards', 'Browser extension', 'Basic ATS score'] },
  { id: 'pro_monthly', name: 'Pro', price: 6990, currency: 'CLP', interval: 'month', credits: 1000, kind: 'subscription', highlighted: true, current: false, features: ['Everything in Free', '1,000 credits / month', 'Unlimited Super-CV & cover letters', 'AI mock interviews', 'Priority AI'] },
  { id: 'pro_annual', name: 'Pro Annual', price: 69900, currency: 'CLP', interval: 'year', credits: 12000, kind: 'subscription', highlighted: false, current: false, features: ['Everything in Pro', '12,000 credits / year', '2 months free', 'Early access to new features'] },
  { id: 'pack_500', name: '500 credits', price: 4990, currency: 'CLP', interval: 'once', credits: 500, kind: 'credits', highlighted: false, current: false, features: ['One-time top-up', 'Never expires'] },
  { id: 'pack_1500', name: '1,500 credits', price: 11990, currency: 'CLP', interval: 'once', credits: 1500, kind: 'credits', highlighted: true, current: false, features: ['Best value', 'One-time top-up', 'Never expires'] },
  { id: 'pack_5000', name: '5,000 credits', price: 29990, currency: 'CLP', interval: 'once', credits: 5000, kind: 'credits', highlighted: false, current: false, features: ['Power user', 'One-time top-up', 'Never expires'] },
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
    return { currency: 'CLP', plans: MOCK_PLANS }
  }
  return api.get<PublicPricing>('/billing/pricing')
}

/** Buy a one-off credit pack. Redirects to Stripe when configured. */
export async function buyCreditPack(pack: string): Promise<void> {
  if (env.useMocks) {
    await delay(400)
    alert(`[mock] Would buy credit pack ${pack}.`)
    return
  }
  const { url } = await api.post<{ url: string }>('/billing/credits/checkout', { pack })
  window.location.href = url
}

/** Begin a Stripe Checkout session for a new subscription. */
export async function startCheckout(): Promise<void> {
  if (env.useMocks) {
    await delay(400)
    alert('[mock] Would redirect to Stripe Checkout for the Premium plan.')
    return
  }
  const { url } = await api.post<{ url: string }>('/billing/checkout', {
    plan: 'premium',
  })
  window.location.href = url
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
