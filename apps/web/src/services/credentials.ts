import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import type { PortalCredential } from '@/types'
import { delay, mockId, store } from './mock/store'

export async function listCredentials(): Promise<PortalCredential[]> {
  if (env.useMocks) {
    await delay()
    return store.credentials.map((c) => ({ ...c }))
  }
  return api.get<PortalCredential[]>('/credentials')
}

export interface SaveCredentialInput {
  portal: string
  email: string
  password: string
}

export async function saveCredential(
  input: SaveCredentialInput,
): Promise<PortalCredential> {
  if (env.useMocks) {
    await delay()
    const existing = store.credentials.find((c) => c.portal === input.portal)
    if (existing) {
      existing.email = input.email
      existing.syncStatus = 'unverified'
      return { ...existing }
    }
    const created: PortalCredential = {
      id: mockId('cred'),
      portal: input.portal,
      email: input.email,
      syncStatus: 'unverified',
    }
    store.credentials.push(created)
    return { ...created }
  }
  // The raw password is sent once over TLS; the backend Fernet-encrypts it and
  // never returns it. We only ever read back metadata.
  return api.post<PortalCredential>('/credentials', input)
}

export async function deleteCredential(id: string): Promise<void> {
  if (env.useMocks) {
    await delay(150)
    store.credentials = store.credentials.filter((c) => c.id !== id)
    return
  }
  await api.delete(`/credentials/${id}`)
}
