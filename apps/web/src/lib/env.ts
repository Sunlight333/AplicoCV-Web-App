/**
 * Centralised, typed access to build-time configuration.
 * Keeping this in one place means we never read `import.meta.env` ad hoc.
 *
 * Optional integration keys (Stripe publishable, Sentry DSN) are read here too;
 * features that depend on them check the `*Enabled` flags and stay dormant when
 * the key is unset.
 */
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? ''
const sentryDsn = import.meta.env.VITE_SENTRY_DSN ?? ''

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  useMocks: (import.meta.env.VITE_USE_MOCKS ?? 'false') === 'true',
  googleOAuthUrl: import.meta.env.VITE_GOOGLE_OAUTH_URL ?? '/api/auth/google/login',

  stripePublishableKey,
  sentryDsn,
  stripeEnabled: Boolean(stripePublishableKey),
  sentryEnabled: Boolean(sentryDsn),
} as const
