import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { FullPageLoader } from '@/components/FullPageLoader'

/**
 * Gate for authenticated routes. While the silent-refresh bootstrap runs we show
 * a loader rather than flashing the login page. Unauthenticated users are sent to
 * /login with the attempted path preserved for post-login redirect.
 *
 * Authenticated-but-not-onboarded users are funneled into the onboarding wizard.
 */
export function ProtectedRoute({ requireOnboarded = true }: { requireOnboarded?: boolean }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (requireOnboarded && !user.onboarded) return <Navigate to="/onboarding" replace />

  return <Outlet />
}
