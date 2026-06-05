import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { delay } from './mock/store'

export interface CreditState {
  balance: number
  streak: number
  dayInCycle: number
  todayClaimed: boolean
  checkinAmount: number
  doubleDays: number[]
  cycleDays: number
  completion: { sections: Record<string, boolean>; percent: number }
  earn: { key: string; label: string; amount: number; claimed: boolean; ready: boolean }[]
  transactions: { amount: number; reason: string; at: string }[]
}

const MOCK: CreditState = {
  balance: 160,
  streak: 3,
  dayInCycle: 3,
  todayClaimed: false,
  checkinAmount: 10,
  doubleDays: [7, 14, 21, 30],
  cycleDays: 30,
  completion: {
    sections: { cv: true, preferences: true, experience: true, skills: true, education: false, faq: false },
    percent: 67,
  },
  earn: [
    { key: 'cv', label: 'Add your CV', amount: 50, claimed: true, ready: true },
    { key: 'preferences', label: 'Set your job preferences', amount: 25, claimed: false, ready: true },
    { key: 'experience', label: 'Add work experience', amount: 25, claimed: true, ready: true },
    { key: 'skills', label: 'Add your skills', amount: 25, claimed: false, ready: true },
    { key: 'faq', label: 'Answer 3 common questions', amount: 25, claimed: false, ready: false },
    { key: 'extension', label: 'Install the browser extension', amount: 100, claimed: false, ready: true },
  ],
  transactions: [{ amount: 100, reason: 'welcome_bonus', at: new Date().toISOString() }],
}

export async function getCredits(): Promise<CreditState> {
  if (env.useMocks) {
    await delay(200)
    return MOCK
  }
  return api.get<CreditState>('/credits')
}

export async function checkin(): Promise<{ claimed: boolean; amount?: number; balance: number; streak: number }> {
  if (env.useMocks) {
    await delay()
    return { claimed: true, amount: 10, balance: MOCK.balance + 10, streak: MOCK.streak + 1 }
  }
  return api.post('/credits/checkin')
}

export async function claimEarn(key: string): Promise<{ ok: boolean; amount?: number; balance?: number }> {
  if (env.useMocks) {
    await delay()
    return { ok: true, amount: 25, balance: MOCK.balance + 25 }
  }
  return api.post(`/credits/claim/${key}`)
}
