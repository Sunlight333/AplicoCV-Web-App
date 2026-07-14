import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/auth/AuthContext'
import { startCheckout, getPlans, reconcilePayments, type Plan } from '@/services/billing'
import { bootstrapSession } from '@/services/auth'
import { currentLocale } from '@/lib/locale'
import { formatMoney } from '@/lib/money'

// The paywall a non-subscriber lands on. Nothing in the portal is reachable until
// there's an active plan, so this is the single gate between sign-in and the app.
const COPY = {
  en: {
    title: 'Choose your plan to continue',
    subtitle: 'Your AI career copilot — find matching jobs, tailor your CV to each one, and practice the interview. Cancel anytime.',
    choose: 'Subscribe',
    week: '/wk', month: '/mo', year: '/yr',
    processing: 'Confirming your payment…',
    signOut: 'Sign out',
    note: 'No hidden fees. Less than a hamburger.',
  },
  es: {
    title: 'Elige tu plan para continuar',
    subtitle: 'Tu copiloto de carrera con IA — encuentra ofertas, adapta tu CV a cada una y practica la entrevista. Cancela cuando quieras.',
    choose: 'Suscribirme',
    week: '/sem', month: '/mes', year: '/año',
    processing: 'Confirmando tu pago…',
    signOut: 'Cerrar sesión',
    note: 'Sin costos ocultos. Menos que una hamburguesa.',
  },
  'pt-BR': {
    title: 'Escolha seu plano para continuar',
    subtitle: 'Seu copiloto de carreira com IA — encontre vagas, adapte seu currículo a cada uma e pratique a entrevista. Cancele quando quiser.',
    choose: 'Assinar',
    week: '/sem', month: '/mês', year: '/ano',
    processing: 'Confirmando seu pagamento…',
    signOut: 'Sair',
    note: 'Sem taxas ocultas. Menos que um hambúrguer.',
  },
} as const

export default function SubscribePage() {
  const { user, logout, setUser } = useAuth()
  const loc = currentLocale()
  const c = COPY[(loc as keyof typeof COPY)] ?? COPY.en
  const [loading, setLoading] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [params, setParams] = useSearchParams()
  const plans = useQuery({ queryKey: ['plans'], queryFn: getPlans })
  const subscriptions = (plans.data ?? []).filter((p) => p.kind === 'subscription')

  // Returning from checkout: reconcile the payment, then the ProtectedRoute lets
  // the now-premium user into the portal.
  useEffect(() => {
    if (!params.get('upgraded') && !params.get('credits')) return
    setConfirming(true)
    void (async () => {
      await reconcilePayments().catch(() => ({ fulfilled: 0 }))
      const u = await bootstrapSession().catch(() => null)
      if (u) setUser(u)
      const stripped = new URLSearchParams(params)
      for (const k of ['upgraded', 'credits', 'pending']) stripped.delete(k)
      setParams(stripped, { replace: true })
      setConfirming(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const suffix = (interval: Plan['interval']) =>
    interval === 'week' ? c.week : interval === 'year' ? c.year : c.month

  const choose = async (plan: Plan) => {
    setLoading(plan.id)
    try {
      await startCheckout(plan.id)
    } finally {
      setLoading(null)
    }
  }

  // Already subscribed → into the app (onboarding first if the profile isn't set up).
  if (user?.plan === 'premium') {
    return <Navigate to={user.onboarded ? '/dashboard' : '/onboarding'} replace />
  }

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={logout} className="text-sm font-medium text-navy-500 hover:text-navy-800">
            {c.signOut}
          </button>
        </div>

        <div className="mt-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-[2.4rem]">{c.title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-navy-500">{c.subtitle}</p>
          {confirming && <p className="mt-4 text-sm font-medium text-electric-600">{c.processing}</p>}
        </div>

        <div className="mx-auto mt-10 grid w-full max-w-2xl gap-5 sm:grid-cols-2">
          {subscriptions.map((p) => (
            <Card key={p.id} className={`relative p-7 ${p.highlighted ? 'ring-2 ring-electric-400' : ''}`}>
              {p.highlighted && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-0.5 text-xs font-semibold text-white">
                  ★
                </span>
              )}
              <p className="text-lg font-bold text-navy-900">{p.name}</p>
              <p className="mt-1 text-3xl font-extrabold text-navy-900">
                {formatMoney(p.price, p.currency, loc)}
                <span className="text-base font-medium text-navy-400">{suffix(p.interval)}</span>
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-navy-600">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><span className="text-green-500">✓</span>{f}</li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full rounded-full"
                variant={p.highlighted ? 'primary' : 'secondary'}
                loading={loading === p.id}
                onClick={() => choose(p)}
              >
                {c.choose}
              </Button>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-navy-400">{c.note}</p>
        {user?.email && <p className="mt-1 text-center text-xs text-navy-300">{user.email}</p>}
      </div>
    </PageTransition>
  )
}
