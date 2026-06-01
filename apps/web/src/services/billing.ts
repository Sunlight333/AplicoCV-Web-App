import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { delay } from './mock/store'

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
