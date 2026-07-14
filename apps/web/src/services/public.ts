import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { delay } from './mock/store'

export interface Teaser {
  atsScore: number
  wins: string[]
  matchCount: number
  role: string
}

/** Anonymous landing "carrot": instant ATS score + matching-role count. */
export async function getTeaser(cvText: string, role: string): Promise<Teaser> {
  if (env.useMocks) {
    await delay(500)
    const words = cvText.trim().split(/\s+/).filter(Boolean).length
    const wins: string[] = []
    if (!/\d+\s?%|\$\s?\d|\d{3,}/.test(cvText)) wins.push('quantify')
    if (!/linkedin/i.test(cvText)) wins.push('add_linkedin')
    if (words < 150) wins.push('more_detail')
    return {
      atsScore: Math.max(20, Math.min(96, 45 + Math.min(40, Math.floor(words / 8)))),
      wins: wins.slice(0, 3).length ? wins.slice(0, 3) : ['tailor'],
      matchCount: role ? 20 : 0,
      role: role || cvText.trim().split('\n')[0]?.slice(0, 80) || '',
    }
  }
  return api.post<Teaser>('/public/teaser', { cvText, role }, { anonymous: true })
}
