import { Suspense, lazy } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { FullPageLoader } from '@/components/FullPageLoader'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const AccountPage = lazy(() => import('@/pages/settings/AccountPage'))
const RewardsPage = lazy(() => import('@/pages/RewardsPage'))
const FaqPage = lazy(() => import('@/pages/FaqPage'))
const OptimizePage = lazy(() => import('@/pages/OptimizePage'))
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const TrackingPage = lazy(() => import('@/pages/TrackingPage'))
const AiToolsPage = lazy(() => import('@/pages/AiToolsPage'))
const CredentialsPage = lazy(() => import('@/pages/CredentialsPage'))
const BillingPage = lazy(() => import('@/pages/BillingPage'))
const ExtensionPage = lazy(() => import('@/pages/ExtensionPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

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
              <Route path="/ai-tools" element={<AiToolsPage />} />
              <Route path="/rewards" element={<RewardsPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/optimize" element={<OptimizePage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/settings/account" element={<AccountPage />} />
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
