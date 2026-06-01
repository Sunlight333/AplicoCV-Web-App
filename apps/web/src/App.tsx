import { Suspense, lazy } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { FullPageLoader } from '@/components/FullPageLoader'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const TrackingPage = lazy(() => import('@/pages/TrackingPage'))
const CredentialsPage = lazy(() => import('@/pages/CredentialsPage'))
const BillingPage = lazy(() => import('@/pages/BillingPage'))
const ExtensionPage = lazy(() => import('@/pages/ExtensionPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export function App() {
  const location = useLocation()
  return (
    <Suspense fallback={<FullPageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated, pre-onboarding */}
          <Route element={<ProtectedRoute requireOnboarded={false} />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* Authenticated app shell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/applications" element={<TrackingPage />} />
              <Route path="/settings/credentials" element={<CredentialsPage />} />
              <Route path="/settings/billing" element={<BillingPage />} />
              <Route path="/extension" element={<ExtensionPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
