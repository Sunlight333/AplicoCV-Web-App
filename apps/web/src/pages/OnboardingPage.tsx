import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/Toast'
import { updatePreferences, completeOnboarding } from '@/services/auth'
import { saveParsedProfile } from '@/services/documents'
import { ApiError } from '@/lib/apiClient'
import type { JobPreferences, Profile } from '@/types'
import { PreferencesStep } from './onboarding/PreferencesStep'
import { UploadStep } from './onboarding/UploadStep'
import { ReviewStep } from './onboarding/ReviewStep'
import { useT } from '@/i18n/I18nProvider'

export default function OnboardingPage() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const t = useT()
  const to = t.app.onboarding
  const STEPS = to.steps
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [parsed, setParsed] = useState<Profile | null>(null)

  const handlePreferences = async (prefs: JobPreferences) => {
    setSaving(true)
    try {
      const updated = await updatePreferences(prefs)
      setUser(updated)
      setStep(1)
    } catch {
      toast(to.prefsError, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleParsed = (profile: Profile) => {
    setParsed(profile)
    setStep(2)
  }

  const handleConfirm = async (profile: Profile) => {
    setSaving(true)
    try {
      await saveParsedProfile(profile)
      const updated = await completeOnboarding()
      setUser(updated)
      toast(to.allSet)
      navigate('/dashboard', { replace: true })
    } catch (e) {
      toast(e instanceof ApiError ? e.message : to.finishError, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-50">
      <header className="flex h-16 items-center justify-between border-b border-navy-100 bg-white px-5">
        <Logo />
        <span className="text-sm text-navy-400">{to.stepOf(step + 1, STEPS.length)}</span>
      </header>

      <div className="mx-auto max-w-xl px-5 py-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`text-xs font-semibold ${i <= step ? 'text-electric-600' : 'text-navy-300'}`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-navy-100">
            <motion.div
              className="h-full rounded-full bg-electric-500"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-7 shadow-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && user && (
                <PreferencesStep initial={user.preferences} onNext={handlePreferences} saving={saving} />
              )}
              {step === 1 && <UploadStep onParsed={handleParsed} />}
              {step === 2 && parsed && (
                <ReviewStep profile={parsed} onConfirm={handleConfirm} saving={saving} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
