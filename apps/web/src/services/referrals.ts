import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { delay } from './mock/store'

export interface ReferralState {
  code: string
  link: string
  referredCount: number
  earned: number
  reward: number
}

export interface RedeemResult {
  ok: boolean
  amount: number
  message: string
}

export async function getReferral(): Promise<ReferralState> {
  if (env.useMocks) {
    await delay(200)
    return {
      code: 'DEMO1234',
      link: 'https://aplicocv.com/register?ref=DEMO1234',
      referredCount: 2,
      earned: 200,
      reward: 100,
    }
  }
  return api.get<ReferralState>('/referrals')
}

export async function redeemReferral(code: string): Promise<RedeemResult> {
  if (env.useMocks) {
    await delay(400)
    return { ok: true, amount: 100, message: 'Success! You both earned 100 credits.' }
  }
  return api.post<RedeemResult>('/referrals/redeem', { code })
}
