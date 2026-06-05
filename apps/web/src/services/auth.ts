import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { tokenStore } from '@/lib/tokenStore'
import type { JobPreferences, User } from '@/types'
import { persistedAuth } from './mock/data'
import { delay, store } from './mock/store'

export interface Credentials {
  email: string
  password: string
}

export interface RegisterInput extends Credentials {
  fullName: string
}

interface AuthResponse {
  accessToken: string
  user: User
}

/**
 * Restore a session on app mount. With the access token held only in memory, a
 * page load starts unauthenticated; we attempt a silent refresh using the
 * HttpOnly refresh cookie, then fetch the current user. Returns null when there
 * is no valid session.
 */
export async function bootstrapSession(): Promise<User | null> {
  if (env.useMocks) {
    await delay(250)
    return persistedAuth.load() ? store.user : null
  }
  const refreshed = await api.refresh()
  if (!refreshed) return null
  return api.get<User>('/auth/me')
}

export async function login(creds: Credentials): Promise<User> {
  if (env.useMocks) {
    await delay()
    tokenStore.set('mock-access-token')
    persistedAuth.save(true)
    return store.user
  }
  const res = await api.post<AuthResponse>('/auth/login', creds, { anonymous: true })
  tokenStore.set(res.accessToken)
  return res.user
}

export async function register(input: RegisterInput): Promise<User> {
  if (env.useMocks) {
    await delay()
    store.user = { ...store.user, fullName: input.fullName, email: input.email, onboarded: false }
    tokenStore.set('mock-access-token')
    persistedAuth.save(true)
    return store.user
  }
  const res = await api.post<AuthResponse>('/auth/register', input, { anonymous: true })
  tokenStore.set(res.accessToken)
  return res.user
}

export async function logout(): Promise<void> {
  if (env.useMocks) {
    await delay(150)
    tokenStore.clear()
    persistedAuth.save(false)
    return
  }
  await api.post('/auth/logout')
  tokenStore.clear()
}

export async function updatePreferences(prefs: JobPreferences): Promise<User> {
  if (env.useMocks) {
    await delay()
    store.user = { ...store.user, preferences: prefs }
    return store.user
  }
  return api.patch<User>('/users/me/preferences', prefs)
}

export async function completeOnboarding(): Promise<User> {
  if (env.useMocks) {
    await delay(150)
    store.user = { ...store.user, onboarded: true }
    persistedAuth.save(true)
    return store.user
  }
  return api.patch<User>('/users/me', { onboarded: true })
}

/**
 * Set or change the account password. `currentPassword` is null for accounts
 * that don't have one yet (e.g. created via Google). Returns the updated user.
 */
export async function setPassword(currentPassword: string | null, newPassword: string): Promise<User> {
  if (env.useMocks) {
    await delay()
    store.user = { ...store.user, hasPassword: true }
    return store.user
  }
  return api.post<User>('/users/me/password', { currentPassword, newPassword })
}

/** Request a password-reset email. Resolves regardless of whether the email exists. */
export async function forgotPassword(email: string): Promise<void> {
  if (env.useMocks) {
    await delay()
    return
  }
  await api.post('/auth/forgot-password', { email }, { anonymous: true })
}

/** Consume a reset token, set the new password, and sign in. */
export async function resetPassword(token: string, newPassword: string): Promise<User> {
  if (env.useMocks) {
    await delay()
    tokenStore.set('mock-access-token')
    persistedAuth.save(true)
    return store.user
  }
  const res = await api.post<AuthResponse>('/auth/reset-password', { token, newPassword }, { anonymous: true })
  tokenStore.set(res.accessToken)
  return res.user
}

/** Kick off the server-driven Google OAuth redirect. */
export function startGoogleOAuth() {
  window.location.href = env.googleOAuthUrl
}
