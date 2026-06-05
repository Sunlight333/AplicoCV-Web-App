import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import type { Profile, Recommendation } from '@/types'
import { mockRecommendations } from './mock/data'
import { delay, store } from './mock/store'

export type CoverLetterTone = 'professional' | 'warm' | 'direct'

export interface SuperCvResult {
  cvText: string
  atsScore: number
  gaps: string[]
  documentId: string
}

/** Super-CV: X-Y-Z rewrite optimized for ATS (credit-priced). */
export async function generateSuperCv(input: {
  targetRole: string
  jobDescription?: string
  cvText?: string
}): Promise<SuperCvResult> {
  if (env.useMocks) {
    await delay(1200)
    return { cvText: `# Optimized CV\n**${input.targetRole}**\n\n- Accomplished X, measured by Y, by doing Z.`, atsScore: 88, gaps: ['Kubernetes', 'Terraform'], documentId: 'mock' }
  }
  return api.post<SuperCvResult>('/ai/super-cv', input)
}

export async function getPersonalAnalysis(): Promise<{ strengths: string[]; weaknesses: string; motivation: string }> {
  if (env.useMocks) {
    await delay(800)
    return { strengths: ['Ownership', 'Clear communication', 'Fast learner'], weaknesses: 'Delegation.', motivation: 'Greater impact.' }
  }
  return api.post('/ai/personal-analysis')
}

export async function getSkillSuggestions(): Promise<string[]> {
  if (env.useMocks) {
    await delay(700)
    return ['TypeScript', 'Docker', 'GraphQL']
  }
  const res = await api.post<{ skills: string[] }>('/ai/skill-suggestions')
  return res.skills
}

/** Generate a cover letter for a job description (POST /cover-letters/generate). */
export async function generateCoverLetter(
  jobDescription: string,
  tone: CoverLetterTone,
): Promise<string> {
  if (env.useMocks) {
    await delay(900)
    const name = store.profile.personal.fullName || 'the candidate'
    const opener = {
      professional: 'I am writing to express my strong interest in this role.',
      warm: 'I was genuinely excited to come across this opening.',
      direct: 'I’m applying for this role.',
    }[tone]
    return (
      `${opener} With a track record of delivering measurable results, I bring directly ` +
      `relevant experience to your team.\n\nIn my recent work I led initiatives that improved ` +
      `outcomes and collaborated across functions to ship high-quality products. The ` +
      `responsibilities here align closely with my strengths in execution and ownership.\n\n` +
      `I would welcome the chance to discuss how I can contribute. Thank you for your ` +
      `consideration.\n\nSincerely,\n${name}`
    )
  }
  const res = await api.post<{ text: string }>('/cover-letters/generate', {
    jobDescription,
    tone,
  })
  return res.text
}

/** Tailor the profile to a job description (POST /profiles/tailor, premium). */
export async function tailorProfile(jobDescription: string): Promise<Profile> {
  if (env.useMocks) {
    await delay(900)
    const jd = jobDescription.toLowerCase()
    const skills = [...store.profile.skills].sort(
      (a, b) => Number(!jd.includes(a.toLowerCase())) - Number(!jd.includes(b.toLowerCase())),
    )
    return { ...store.profile, skills, version: store.profile.version + 1 }
  }
  return api.post<Profile>('/profiles/tailor', { jobDescription })
}

/** Localize the profile to another language (POST /profiles/localize). */
export async function localizeProfile(language: string, region?: string): Promise<Profile> {
  if (env.useMocks) {
    await delay(700)
    const headline = store.profile.personal.headline
    return {
      ...store.profile,
      personal: { ...store.profile.personal, headline: `${headline} (${language})` },
      version: store.profile.version + 1,
    }
  }
  return api.post<Profile>('/profiles/localize', { language, region })
}

/** Run the Beta AI Job Agent scan (POST /agent/scan, premium). */
export async function runAgentScan(): Promise<Recommendation[]> {
  if (env.useMocks) {
    await delay(1200)
    return mockRecommendations
  }
  return api.post<Recommendation[]>('/agent/scan')
}
