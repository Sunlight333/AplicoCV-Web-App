import type { ApplicationStatus } from '@/types'
import type { Dictionary } from '@/i18n/dictionaries'

type Tone = 'neutral' | 'success' | 'warning' | 'info' | 'danger'

export const statusOrder: ApplicationStatus[] = [
  'applied',
  'viewed',
  'interview',
  'offer',
  'rejected',
]

const tones: Record<ApplicationStatus, Tone> = {
  applied: 'neutral',
  viewed: 'info',
  interview: 'warning',
  offer: 'success',
  rejected: 'danger',
}

/** Localized label + tone for a given application status. */
export function statusMeta(t: Dictionary, status: ApplicationStatus): { label: string; tone: Tone } {
  return { label: t.app.status[status], tone: tones[status] }
}
