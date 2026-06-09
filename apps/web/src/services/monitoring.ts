import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { delay } from './mock/store'

export interface MonitoringStatus {
  active: boolean
  premium: boolean
  until: string | null
  costTokens: number
  days: number
}

/** Whether smart job monitoring is active for the user, and the pass price. */
export async function getMonitoringStatus(): Promise<MonitoringStatus> {
  if (env.useMocks) {
    await delay(200)
    return { active: false, premium: false, until: null, costTokens: 200, days: 7 }
  }
  return api.get<MonitoringStatus>('/monitoring/status')
}

/** Activate monitoring — included for Premium, else spends the token pass. */
export async function activateMonitoring(): Promise<MonitoringStatus> {
  if (env.useMocks) {
    await delay(400)
    const until = new Date(Date.now() + 7 * 864e5).toISOString()
    return { active: true, premium: false, until, costTokens: 200, days: 7 }
  }
  return api.post<MonitoringStatus>('/monitoring/activate')
}
