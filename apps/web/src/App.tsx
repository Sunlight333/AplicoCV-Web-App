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
const InterviewPage = lazy(() => import('@/pages/InterviewPage'))
const AtsSimulatorPage = lazy(() => import('@/pages/AtsSimulatorPage'))
const ReferralPage = lazy(() => import('@/pages/ReferralPage'))
const GuidePage = lazy(() => import('@/pages/GuidePage'))
const SupportedPortalsPage = lazy(() => import('@/pages/SupportedPortalsPage'))
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
const AboutPage = lazy(() => import('@/pages/marketing/AboutPage'))
const BlogPage = lazy(() => import('@/pages/marketing/BlogPage'))
const CareersPage = lazy(() => import('@/pages/marketing/CareersPage'))
const ContactPage = lazy(() => import('@/pages/marketing/ContactPage'))
const HelpPage = lazy(() => import('@/pages/marketing/HelpPage'))
const SupportedPortalsPublicPage = lazy(() => import('@/pages/marketing/SupportedPortalsPublicPage'))
const StatusPage = lazy(() => import('@/pages/marketing/StatusPage'))
const SecurityPage = lazy(() => import('@/pages/marketing/SecurityPage'))
const CookiesPage = lazy(() => import('@/pages/marketing/CookiesPage'))
const ChromeExtensionPage = lazy(() => import('@/pages/marketing/ChromeExtensionPage'))
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
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/supported-portals" element={<SupportedPortalsPublicPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/chrome-extension" element={<ChromeExtensionPage />} />

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
              <Route path="/interview" element={<InterviewPage />} />
              <Route path="/ats" element={<AtsSimulatorPage />} />
              <Route path="/referrals" element={<ReferralPage />} />
              <Route path="/guide" element={<GuidePage />} />
              <Route path="/portals" element={<SupportedPortalsPage />} />
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
