import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { delay } from './mock/store'

// Phase 1.3 — assisted "apply on your behalf" queue.
export interface ApplyTask {
  id: string
  jobUrl: string
  portal: string
  jobTitle: string
  company: string
  status: 'queued' | 'prepared' | 'submitted' | 'dismissed' | 'error'
  cvVersionLabel?: string | null
  coverLetter?: string | null
  matchScore?: number | null
  createdAt: string
}

/** Confirm "apply on my behalf" for one posting (premium). The backend tailors a
 * CV + writes a cover letter and queues it for the extension to autofill. */
export async function requestApply(input: {
  recommendationId?: string
  jobUrl: string
  portal: string
  jobTitle: string
  company: string
  jobDescription?: string
  autoTailor?: boolean
}): Promise<ApplyTask> {
  if (env.useMocks) {
    await delay(1100)
    return {
      id: 'mock',
      jobUrl: input.jobUrl,
      portal: input.portal,
      jobTitle: input.jobTitle,
      company: input.company,
      status: 'prepared',
      cvVersionLabel: `Tailored — ${input.jobTitle}`,
      matchScore: 88,
      createdAt: new Date().toISOString(),
    }
  }
  return api.post<ApplyTask>('/apply/request', input)
}

export async function listApplyTasks(): Promise<ApplyTask[]> {
  if (env.useMocks) {
    await delay(400)
    return []
  }
  return api.get<ApplyTask[]>('/apply/tasks')
}

export async function dismissApplyTask(id: string): Promise<ApplyTask> {
  return api.post<ApplyTask>(`/apply/${id}/dismiss`)
}
