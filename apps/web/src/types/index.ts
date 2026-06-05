/**
 * Domain models shared across the web app.
 *
 * In the full monorepo these live in `packages/types` and are imported by both
 * the web app and the Chrome extension. They are colocated here for Phase 2 and
 * should be lifted out verbatim when `packages/types` is created.
 */

export type PlanTier = 'free' | 'premium'

export interface User {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  plan: PlanTier
  onboarded: boolean
  preferences: JobPreferences
  /** False for Google accounts that haven't set a password yet. */
  hasPassword?: boolean
  /** Premium unlocked: paid OR within the free trial window. */
  premiumActive?: boolean
  /** Currently on the free trial (premium unlocked, not paying). */
  onTrial?: boolean
  /** ISO timestamp the free trial ends; null/undefined for paying members. */
  trialEndsAt?: string | null
}

export interface JobPreferences {
  targetRoles: string[]
  seniority: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal'
  locations: string[]
  remote: 'onsite' | 'hybrid' | 'remote' | 'any'
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  salaryPeriod?: 'year' | 'month' | 'hour'
  salaryType?: 'gross' | 'net'
  availability?: string
  workAuthorization?: string
  industries?: string[]
}

export interface WorkExperience {
  id: string
  employer: string
  title: string
  startDate: string
  endDate: string | null // null === present
  location?: string
  bullets: string[]
}

export interface Education {
  id: string
  institution: string
  degree: string
  field?: string
  startDate: string
  endDate: string | null
}

export interface LanguageSkill {
  id: string
  language: string
  level: 'basic' | 'conversational' | 'professional' | 'native'
}

export interface ProfileLink {
  id: string
  label: string
  url: string
}

export interface ComplementaryInfo {
  workAuthorization?: string
  willingToRelocate?: boolean
  visaRequired?: boolean
  noticePeriod?: string
  preferredStartDate?: string
}

export interface PersonalInfo {
  fullName: string
  headline: string
  email: string
  phone?: string
  location?: string
  summary: string
}

export interface Certification {
  id: string
  name: string
  issuer?: string
  year?: string
  credentialUrl?: string
}

export interface ProjectItem {
  id: string
  name: string
  description?: string
  url?: string
  skills?: string[]
}

export interface PersonalAnalysis {
  strengths: string[]
  weaknesses: string
  motivation: string
}

export interface Profile {
  personal: PersonalInfo
  experience: WorkExperience[]
  education: Education[]
  skills: string[]
  skillsToAvoid?: string[]
  languages: LanguageSkill[]
  links: ProfileLink[]
  certifications?: Certification[]
  projects?: ProjectItem[]
  baseCoverLetter?: string
  complementary: ComplementaryInfo
  analysis?: PersonalAnalysis | null
  version: number
}

export type ApplicationStatus =
  | 'applied'
  | 'viewed'
  | 'interview'
  | 'offer'
  | 'rejected'

export interface Application {
  id: string
  jobUrl: string
  portal: string
  jobTitle: string
  company: string
  status: ApplicationStatus
  appliedAt: string
  cvVersionLabel?: string
  coverLetter?: string
  jobDescription?: string
  notes?: string
}

export interface DashboardStats {
  totalApplications: number
  responseRate: number // 0..1
  interviews: number
  minutesSaved: number
}

export interface Recommendation {
  id: string
  jobTitle: string
  company: string
  portal: string
  matchScore: number // 0..100
  jobUrl: string
  strategicNote?: string
}

export interface AtsAnalysis {
  matchScore: number // 0..100
  matchedKeywords: string[]
  missingKeywords: string[]
  qualification: 'underqualified' | 'strong match' | 'overqualified'
  recommendations: string[]
}

export interface PortalCredential {
  id: string
  portal: string
  email: string
  /** Whether the extension has validated these against the live portal. */
  syncStatus: 'unverified' | 'verified' | 'invalid'
}

/** Server-sent event payload emitted during CV parsing. */
export interface ParseProgressEvent {
  stage: string
  message: string
  done: boolean
  profile?: Profile
}
