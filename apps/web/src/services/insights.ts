import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { delay } from './mock/store'

// Phase 3.2 — scam / junk-posting detection
export interface ScamCheck {
  riskLevel: 'low' | 'medium' | 'high'
  riskScore: number
  signals: string[]
  advice: string
}

export async function checkScam(input: {
  jobTitle?: string
  company?: string
  jobDescription?: string
  jobUrl?: string
}): Promise<ScamCheck> {
  if (env.useMocks) {
    await delay(600)
    return {
      riskLevel: 'low',
      riskScore: 8,
      signals: ['No strong scam signals matched.'],
      advice: 'No strong scam signals detected, but always verify the employer.',
    }
  }
  return api.post<ScamCheck>('/insights/scam-check', input)
}

// Phase 3.4 — job-search burnout detector
export interface Burnout {
  level: 'healthy' | 'elevated' | 'high'
  score: number
  applicationsLast7Days: number
  responseRate: number
  signals: string[]
  suggestions: string[]
}

export async function getBurnout(): Promise<Burnout> {
  if (env.useMocks) {
    await delay(500)
    return {
      level: 'healthy',
      score: 12,
      applicationsLast7Days: 4,
      responseRate: 0.18,
      signals: ['Activity looks balanced.'],
      suggestions: ['Your pace looks sustainable — keep tailoring each application.'],
    }
  }
  return api.get<Burnout>('/insights/burnout')
}

// Phase 4.1 / 4.2 — market heatmap (anonymous aggregate)
export interface MarketStat {
  label: string
  value: number
}
export interface MarketHeatmap {
  topSkills: MarketStat[]
  topCompanies: MarketStat[]
  topPortals: MarketStat[]
  remoteShare: number
  sampleSize: number
  insight: string
}

export async function getMarketHeatmap(): Promise<MarketHeatmap> {
  if (env.useMocks) {
    await delay(700)
    return {
      topSkills: [
        { label: 'React', value: 42 },
        { label: 'TypeScript', value: 38 },
        { label: 'Python', value: 31 },
      ],
      topCompanies: [{ label: 'Acme', value: 9 }],
      topPortals: [{ label: 'LinkedIn', value: 24 }],
      remoteShare: 61,
      sampleSize: 120,
      insight: 'Most in-demand skills cluster around React, TypeScript, Python. 61% prefer remote or hybrid roles.',
    }
  }
  return api.get<MarketHeatmap>('/insights/market-heatmap')
}
