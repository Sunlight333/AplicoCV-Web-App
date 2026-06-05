import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/auth/AuthContext'
import { useI18n } from '@/i18n/I18nProvider'

// 7-day trial → start nudging once 3 or fewer days remain (≈ day 4 onward).
const NUDGE_WHEN_DAYS_LEFT_AT_MOST = 3
const DISMISS_KEY = 'aplicocv.trialNudge'

const COPY = {
  en: {
    titleActive: 'Your free Premium trial',
    titleExpired: 'Your free trial has ended',
    bodyActive: (d: number) =>
      `You have ${d} day${d === 1 ? '' : 's'} of free Premium left — AI CV tailoring, cover letters, unlimited applications and the AI Job Agent. Upgrade to keep them after your trial.`,
    bodyExpired:
      'Upgrade to Premium to keep AI CV tailoring, cover letters, unlimited applications and the AI Job Agent.',
    upgrade: 'Upgrade to Premium',
    later: 'Maybe later',
    badge: (d: number) => `${d} day${d === 1 ? '' : 's'} left`,
  },
  es: {
    titleActive: 'Tu prueba Premium gratis',
    titleExpired: 'Tu prueba gratis terminó',
    bodyActive: (d: number) =>
      `Te queda${d === 1 ? '' : 'n'} ${d} día${d === 1 ? '' : 's'} de Premium gratis — adaptación de CV con IA, cartas de presentación, postulaciones ilimitadas y el Agente de Empleo IA. Mejora para conservarlos.`,
    bodyExpired:
      'Mejora a Premium para conservar la adaptación de CV con IA, cartas de presentación, postulaciones ilimitadas y el Agente de Empleo IA.',
    upgrade: 'Mejorar a Premium',
    later: 'Quizás luego',
    badge: (d: number) => `${d} día${d === 1 ? '' : 's'} restante${d === 1 ? '' : 's'}`,
  },
  'pt-BR': {
    titleActive: 'Seu teste Premium grátis',
    titleExpired: 'Seu teste grátis terminou',
    bodyActive: (d: number) =>
      `Você tem ${d} dia${d === 1 ? '' : 's'} de Premium grátis — adaptação de currículo com IA, cartas de apresentação, candidaturas ilimitadas e o Agente de Empregos IA. Faça upgrade para mantê-los.`,
    bodyExpired:
      'Faça upgrade para o Premium e mantenha a adaptação de currículo com IA, cartas de apresentação, candidaturas ilimitadas e o Agente de Empregos IA.',
    upgrade: 'Fazer upgrade',
    later: 'Talvez depois',
    badge: (d: number) => `${d} dia${d === 1 ? '' : 's'} restante${d === 1 ? '' : 's'}`,
  },
} as const

function daysLeft(trialEndsAt: string): number {
  return Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Free-trial conversion nudge. Shows at most once per day for accounts that are
 * not paying, once the trial is in its back half (≈ day 4+) or has expired.
 */
export function TrialModal() {
  const { user, initializing } = useAuth()
  const navigate = useNavigate()
  const { locale } = useI18n()
  const [open, setOpen] = useState(false)

  const isPaid = user?.plan === 'premium'
  const trialEndsAt = user?.trialEndsAt ?? null
  const left = trialEndsAt ? daysLeft(trialEndsAt) : null
  const expired = left !== null && left <= 0
  const nudging = left !== null && left > 0 && left <= NUDGE_WHEN_DAYS_LEFT_AT_MOST
  const eligible = !!user && !isPaid && trialEndsAt !== null && (expired || nudging)

  useEffect(() => {
    if (initializing || !eligible) return
    let dismissedToday = false
    try {
      dismissedToday = localStorage.getItem(DISMISS_KEY) === today()
    } catch {
      dismissedToday = false
    }
    if (!dismissedToday) setOpen(true)
  }, [initializing, eligible])

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, today())
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  if (!eligible) return null
  const c = COPY[locale as keyof typeof COPY] ?? COPY.en

  return (
    <Modal open={open} onClose={dismiss}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-card-hover">
        {/* gradient header */}
        <div className="relative overflow-hidden bg-brand-gradient px-7 pb-7 pt-8 text-white">
          <div className="absolute inset-0 grid-pattern opacity-15" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur">
              {expired ? '✦' : c.badge(left as number)}
            </span>
            <h2 className="mt-3 text-2xl font-bold leading-tight">
              {expired ? c.titleExpired : c.titleActive}
            </h2>
          </div>
        </div>

        <div className="px-7 py-6">
          <p className="text-sm leading-relaxed text-navy-600">
            {expired ? c.bodyExpired : c.bodyActive(left as number)}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              className="flex-1 rounded-full shadow-glow"
              onClick={() => {
                dismiss()
                navigate('/settings/billing')
              }}
            >
              {c.upgrade}
            </Button>
            <Button variant="ghost" className="flex-1 rounded-full" onClick={dismiss}>
              {c.later}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
