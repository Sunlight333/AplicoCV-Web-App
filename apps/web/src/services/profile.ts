import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import type { Profile } from '@/types'
import { delay, store } from './mock/store'

export async function getProfile(): Promise<Profile> {
  if (env.useMocks) {
    await delay()
    return structuredClone(store.profile)
  }
  return api.get<Profile>('/profiles/me')
}

/** Partial update — the profile page sends only the changed slice (debounced). */
export async function patchProfile(patch: Partial<Profile>): Promise<Profile> {
  if (env.useMocks) {
    await delay(200)
    store.profile = { ...store.profile, ...patch, version: store.profile.version + 1 }
    return structuredClone(store.profile)
  }
  return api.patch<Profile>('/profiles/me', patch)
}

export async function addSkills(skills: string[]): Promise<Profile> {
  if (env.useMocks) {
    await delay(200)
    const merged = Array.from(new Set([...store.profile.skills, ...skills]))
    store.profile = { ...store.profile, skills: merged, version: store.profile.version + 1 }
    return structuredClone(store.profile)
  }
  return api.patch<Profile>('/profiles/me/skills', { skills })
}
