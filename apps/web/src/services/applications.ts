import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import type { Application, ApplicationStatus } from '@/types'
import { delay, store } from './mock/store'

export interface ApplicationFilters {
  portal?: string
  status?: ApplicationStatus
  search?: string
}

export async function listApplications(
  filters: ApplicationFilters = {},
): Promise<Application[]> {
  if (env.useMocks) {
    await delay()
    return store.applications.filter((a) => {
      if (filters.portal && a.portal !== filters.portal) return false
      if (filters.status && a.status !== filters.status) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !a.jobTitle.toLowerCase().includes(q) &&
          !a.company.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }
  const params = new URLSearchParams()
  if (filters.portal) params.set('portal', filters.portal)
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  const qs = params.toString()
  return api.get<Application[]>(`/applications${qs ? `?${qs}` : ''}`)
}

export interface NewApplication {
  company: string
  jobTitle: string
  portal: string
  jobUrl?: string
  jobDescription?: string
}

/** Manually add an application (the extension adds them automatically too). */
export async function createApplication(input: NewApplication): Promise<Application> {
  if (env.useMocks) {
    await delay(200)
    const app: Application = {
      id: `app_${Date.now()}`,
      jobUrl: input.jobUrl || '',
      portal: input.portal || 'Manual',
      jobTitle: input.jobTitle,
      company: input.company,
      status: 'applied',
      appliedAt: new Date().toISOString(),
    }
    store.applications.unshift(app)
    return { ...app }
  }
  return api.post<Application>('/applications', {
    jobUrl: input.jobUrl || '',
    portal: input.portal || 'Manual',
    jobTitle: input.jobTitle,
    company: input.company,
    jobDescription: input.jobDescription,
  })
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<Application> {
  if (env.useMocks) {
    await delay(150)
    const app = store.applications.find((a) => a.id === id)
    if (!app) throw new Error('Application not found')
    app.status = status
    return { ...app }
  }
  return api.patch<Application>(`/applications/${id}/status`, { status })
}

export async function updateApplicationNotes(
  id: string,
  notes: string,
): Promise<Application> {
  if (env.useMocks) {
    await delay(150)
    const app = store.applications.find((a) => a.id === id)
    if (!app) throw new Error('Application not found')
    app.notes = notes
    return { ...app }
  }
  return api.patch<Application>(`/applications/${id}`, { notes })
}
