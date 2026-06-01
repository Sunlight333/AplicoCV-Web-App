import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import type { AtsAnalysis, DashboardStats, Recommendation } from '@/types'
import { mockRecommendations, mockStats } from './mock/data'
import { delay } from './mock/store'

export async function getStats(): Promise<DashboardStats> {
  if (env.useMocks) {
    await delay()
    return mockStats
  }
  return api.get<DashboardStats>('/applications/stats')
}

export async function getRecommendations(): Promise<Recommendation[]> {
  if (env.useMocks) {
    await delay(600)
    return mockRecommendations
  }
  return api.get<Recommendation[]>('/recommendations')
}

export async function scoreAts(jobDescription: string): Promise<AtsAnalysis> {
  if (env.useMocks) {
    await delay(900)
    const words = jobDescription.toLowerCase()
    const pool = ['react', 'typescript', 'tailwind', 'graphql', 'testing', 'node', 'aws', 'docker']
    const matched = pool.filter((w) => words.includes(w))
    const missing = pool.filter((w) => !words.includes(w)).slice(0, 4)
    const score = Math.min(95, 45 + matched.length * 8)
    return {
      matchScore: score,
      matchedKeywords: matched.length ? matched : ['react', 'typescript'],
      missingKeywords: missing,
      qualification: score > 75 ? 'strong match' : score > 55 ? 'strong match' : 'underqualified',
      recommendations: [
        'Add the missing keywords to your summary where they truthfully apply.',
        'Quantify two more achievements in your most recent role.',
        'Mirror the job title language in your headline.',
      ],
    }
  }
  return api.post<AtsAnalysis>('/ats/score', { jobDescription })
}
