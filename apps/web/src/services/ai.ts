import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { currentLocale } from '@/lib/locale'
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
  return api.post<SuperCvResult>('/ai/super-cv', { ...input, language: currentLocale() })
}

export async function getPersonalAnalysis(): Promise<{ strengths: string[]; weaknesses: string; motivation: string }> {
  if (env.useMocks) {
    await delay(800)
    return { strengths: ['Ownership', 'Clear communication', 'Fast learner'], weaknesses: 'Delegation.', motivation: 'Greater impact.' }
  }
  return api.post(`/ai/personal-analysis?language=${encodeURIComponent(currentLocale())}`)
}

export async function getSkillSuggestions(): Promise<string[]> {
  if (env.useMocks) {
    await delay(700)
    return ['TypeScript', 'Docker', 'GraphQL']
  }
  const res = await api.post<{ skills: string[] }>(
    `/ai/skill-suggestions?language=${encodeURIComponent(currentLocale())}`,
  )
  return res.skills
}

/** 100%-personalized, from-scratch cover letter (40 credits). */
export async function generatePersonalizedLetter(input: {
  jobDescription: string
  company?: string
  role?: string
  highlights?: string
  tone: CoverLetterTone
}): Promise<string> {
  if (env.useMocks) {
    await delay(1100)
    return `Dear Hiring Team at ${input.company || 'your company'},\n\nI am writing to apply for the ${input.role || 'role'}…`
  }
  const res = await api.post<{ text: string }>('/ai/cover-letter-pro', {
    ...input,
    language: currentLocale(),
  })
  return res.text
}

// --- AI mock interview --------------------------------------------------------

export type InterviewKind = 'behavioral' | 'technical' | 'mixed'

export interface InterviewStart {
  sessionId: string
  questions: string[]
}

export interface InterviewQuestionFeedback {
  question: string
  answer: string
  rating: number
  feedback: string
}

export interface InterviewFeedback {
  overallScore: number
  summary: string
  perQuestion: InterviewQuestionFeedback[]
}

export interface InterviewSessionSummary {
  id: string
  role: string
  kind: string
  createdAt: string
  questionCount: number
  overallScore: number | null
  completed: boolean
}

/** Start a mock interview (30 credits) — returns tailored questions. */
export async function startInterview(input: {
  role: string
  jobDescription?: string
  kind: InterviewKind
}): Promise<InterviewStart> {
  if (env.useMocks) {
    await delay(900)
    return {
      sessionId: 'mock',
      questions: [
        `Tell me about yourself and why you're a fit for the ${input.role} role.`,
        'Describe a challenging problem you solved and your specific contribution.',
        'Tell me about a time you disagreed with a teammate. How did you handle it?',
        'What are your biggest strengths for this role?',
        'Where do you see yourself in three years, and why this company?',
      ],
    }
  }
  return api.post<InterviewStart>('/ai/interview/start', { ...input, language: currentLocale() })
}

/** Submit answers and get per-question + overall feedback. */
export async function submitInterview(
  sessionId: string,
  answers: string[],
): Promise<InterviewFeedback> {
  if (env.useMocks) {
    await delay(1200)
    return {
      overallScore: 82,
      summary: 'Strong overall — concrete, outcome-focused answers.',
      perQuestion: answers.map((a, i) => ({
        question: `Question ${i + 1}`,
        answer: a,
        rating: 4,
        feedback: 'Good structure — quantify the result to make it land harder.',
      })),
    }
  }
  return api.post<InterviewFeedback>('/ai/interview/feedback', {
    sessionId,
    answers,
    language: currentLocale(),
  })
}

export async function getInterviewHistory(): Promise<InterviewSessionSummary[]> {
  if (env.useMocks) {
    await delay(300)
    return []
  }
  return api.get<InterviewSessionSummary[]>('/ai/interview/history')
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
    language: currentLocale(),
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
  return api.post<Profile>('/profiles/tailor', { jobDescription, language: currentLocale() })
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

// --- Phase 2/3 — per-posting intelligence ------------------------------------

export interface PredictiveScore {
  successProbability: number
  fitBreakdown: { skills: number; seniority: number; location: number }
  missingSkills: string[]
  keywordsToAdd: string[]
  overqualified: boolean
  atsPass: boolean
  advice: string
}

/** Phase 2.4 — predicted chance of success for a posting (15 credits). */
export async function getPredictiveScore(input: {
  jobDescription?: string
  jobUrl?: string
}): Promise<PredictiveScore> {
  if (env.useMocks) {
    await delay(900)
    return {
      successProbability: 72,
      fitBreakdown: { skills: 78, seniority: 70, location: 70 },
      missingSkills: ['Kubernetes', 'Terraform'],
      keywordsToAdd: ['Kubernetes', 'Terraform'],
      overqualified: false,
      atsPass: true,
      advice: 'Add the missing keywords where they truthfully apply, then re-score.',
    }
  }
  return api.post<PredictiveScore>('/ai/predictive-score', { ...input, language: currentLocale() })
}

export interface AtsSimulation {
  parseScore: number
  sectionsDetected: string[]
  likelyDropped: string[]
  formattingIssues: string[]
  invisibleErrors: string[]
  summary: string
}

/** Phase 2.3 — simulate how an ATS parses the CV (15 credits). */
export async function simulateAts(): Promise<AtsSimulation> {
  if (env.useMocks) {
    await delay(900)
    return {
      parseScore: 84,
      sectionsDetected: ['Contact', 'Summary', 'Experience', 'Skills'],
      likelyDropped: ['Education'],
      formattingIssues: ['Multi-column layouts and tables are often mis-parsed — use a single column.'],
      invisibleErrors: ['No quantified achievements found — add numbers/percentages.'],
      summary: 'An ATS would cleanly read 4 of 5 core sections.',
    }
  }
  return api.post<AtsSimulation>(`/ai/ats-simulate?language=${encodeURIComponent(currentLocale())}`)
}

export interface GhostRecruiter {
  verdict: 'apply' | 'caution' | 'skip'
  reasons: string[]
  betterFitNote?: string | null
}

/** Phase 3.1 — should you apply here? (10 credits). */
export async function getGhostRecruiter(input: {
  jobDescription?: string
  jobUrl?: string
}): Promise<GhostRecruiter> {
  if (env.useMocks) {
    await delay(800)
    return { verdict: 'apply', reasons: ['Strong keyword and seniority match.'], betterFitNote: null }
  }
  return api.post<GhostRecruiter>('/ai/ghost-recruiter', { ...input, language: currentLocale() })
}

export interface SalaryInsights {
  role: string
  estimatedRange: string
  currency: string
  negotiationPoints: string[]
  marketNote: string
}

/** Phase 3.3 — Job Copilot: salary + negotiation guidance (15 credits). */
export async function getSalaryInsights(input: {
  role: string
  region?: string
}): Promise<SalaryInsights> {
  if (env.useMocks) {
    await delay(800)
    return {
      role: input.role,
      estimatedRange: '$110k–$150k',
      currency: 'USD',
      negotiationPoints: ['Anchor to the top of the range with measurable wins.', 'Negotiate total comp, not just base.'],
      marketNote: 'Estimate from seniority and role; verify against a live benchmark.',
    }
  }
  return api.post<SalaryInsights>('/ai/salary-insights', { ...input, language: currentLocale() })
}

/** Phase 1.4 — generate a smart answer to one open application field (5 credits). */
export async function getFieldAnswer(input: {
  fieldLabel: string
  jobDescription?: string
}): Promise<string> {
  if (env.useMocks) {
    await delay(700)
    return `Draft answer for: ${input.fieldLabel} — review and edit before submitting.`
  }
  const res = await api.post<{ answer: string }>('/ai/field-answer', {
    ...input,
    language: currentLocale(),
  })
  return res.answer
}
