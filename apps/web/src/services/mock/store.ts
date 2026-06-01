import type { Application, PortalCredential, Profile, User } from '@/types'
import {
  emptyProfile,
  mockApplications,
  mockCredentials,
  mockUser,
  persistedAuth,
} from './data'

/** Simulate network latency so loading/skeleton states are visible in mock mode. */
export const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms))

/** Deterministic-enough id generator for mock-created records. */
let seq = 1000
export const mockId = (prefix: string) => `${prefix}_${++seq}`

/**
 * Mutable singleton holding mock state for the tab session. Services mutate this
 * directly; React Query caches the reads.
 */
export const store = {
  user: { ...mockUser, onboarded: persistedAuth.load() } as User,
  profile: structuredClone(emptyProfile) as Profile,
  applications: structuredClone(mockApplications) as Application[],
  credentials: structuredClone(mockCredentials) as PortalCredential[],
}
