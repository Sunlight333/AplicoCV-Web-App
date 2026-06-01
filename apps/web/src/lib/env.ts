/**
 * Centralised, typed access to build-time configuration.
 * Keeping this in one place means we never read `import.meta.env` ad hoc.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  useMocks: (import.meta.env.VITE_USE_MOCKS ?? 'false') === 'true',
  googleOAuthUrl: import.meta.env.VITE_GOOGLE_OAUTH_URL ?? '/api/auth/google/login',
} as const
