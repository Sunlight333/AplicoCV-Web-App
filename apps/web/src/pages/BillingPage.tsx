import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/auth/AuthContext'
import { startCheckout, openCustomerPortal, getPlans, reconcilePayments, type Plan } from '@/services/billing'
import { bootstrapSession } from '@/services/auth'
import { useT } from '@/i18n/I18nProvider'
import { currentLocale } from '@/lib/locale'
import type { Locale } from '@/i18n/dictionaries'
import { formatMoney } from '@/lib/money'

// Localized banners for the params the payment provider redirects back with
// (back_urls in apps/api/app/routers/billing.py → /settings/billing?upgraded=1 …).
const NOTICES: Record<Locale, { upgraded: string; credits: string; pending: string; canceled: string }> = {
  en: {
    upgraded: 'You’re now on Pro — welcome aboard! 🎉',
    credits: 'Payment received — your subscription is active.',
    pending: 'Your payment is pending. We’ll update your account as soon as it’s confirmed.',
    canceled: 'Checkout canceled — no charge was made.',
  },
  es: {
    upgraded: 'Ya tienes Pro, ¡bienvenido! 🎉',
    credits: 'Pago recibido: tu suscripción está activa.',
    pending: 'Tu pago está pendiente. Actualizaremos tu cuenta apenas se confirme.',
    canceled: 'Pago cancelado: no se realizó ningún cargo.',
  },
  'pt-BR': {
    upgraded: 'Agora você tem o Pro — bem-vindo! 🎉',
    credits: 'Pagamento recebido — sua assinatura está ativa.',
    pending: 'Seu pagamento está pendente. Atualizaremos sua conta assim que for confirmado.',
    canceled: 'Pagamento cancelado — nenhuma cobrança foi feita.',
  },
}

export default function BillingPage() {
  const { user, setUser } = useAuth()
  const qc = useQueryClient()
  const t = useT()
  const tb = t.app.billing
  const tp = t.app.more.plans
  const [loading, setLoading] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'info' | 'error'; text: string } | null>(null)
  const isPremium = user?.plan === 'premium'
  const plans = useQuery({ queryKey: ['plans'], queryFn: getPlans })
  const [params, setParams] = useSearchParams()
  const loc = currentLocale()

  // On mount (and on return from checkout) reconcile and reflect the result.
  useEffect(() => {
    const copy = NOTICES[loc as Locale] ?? NOTICES.en
    type Notice = { tone: 'success' | 'info' | 'error'; text: string }
    let banner: Notice | null = null
    if (params.get('upgraded')) banner = { tone: 'success', text: copy.upgraded }
    else if (params.get('credits')) banner = { tone: 'success', text: copy.credits }
    else if (params.get('pending')) banner = { tone: 'info', text: copy.pending }
    else if (params.get('canceled')) banner = { tone: 'error', text: copy.canceled }
    const canceled = !!params.get('canceled')
    if (banner) {
      setNotice(banner)
      const stripped = new URLSearchParams(params)
      for (const k of ['upgraded', 'credits', 'pending', 'canceled']) stripped.delete(k)
      setParams(stripped, { replace: true })
    }
    // Don't just trust the async webhook (it can be delayed or never arrive if the
    // notification_url is unreachable) — actively reconcile the buyer's order against
    // MercadoPago so a charged customer is fulfilled. Runs on every visit, so it also
    // rescues someone who paid, wasn't credited, and simply returns to this page later.
    void (async () => {
      const { fulfilled } = canceled
        ? { fulfilled: 0 }
        : await reconcilePayments().catch(() => ({ fulfilled: 0 }))
      if (fulfilled > 0 || banner?.tone === 'success') {
        const u = await bootstrapSession().catch(() => null)
        if (u) setUser(u)
        qc.invalidateQueries({ queryKey: ['credits'] })
        qc.invalidateQueries({ queryKey: ['plans'] })
        if (fulfilled > 0) setNotice((cur) => cur ?? { tone: 'success', text: copy.credits })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subscriptions = (plans.data ?? []).filter((p) => p.kind === 'subscription')

  const choose = async (plan: Plan) => {
    setLoading(plan.id)
    try {
      await startCheckout(plan.id)
    } finally {
      setLoading(null)
    }
  }

  const intervalSuffix = (interval: Plan['interval']) =>
    interval === 'week' ? '/wk' : interval === 'year' ? '/yr' : '/mo'
  const priceLabel = (p: Plan) => `${formatMoney(p.price, p.currency, loc)}${intervalSuffix(p.interval)}`

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{tp.title}</h1>
      <p className="mt-1 text-navy-500">{tp.subtitle}</p>

      {notice && (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-sm font-medium ${
            notice.tone === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : notice.tone === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Current plan + manage */}
      <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-navy-400">{tb.currentPlan}</p>
          <p className="mt-0.5 text-xl font-bold text-navy-900">
            {isPremium ? t.app.nav.premium : t.app.nav.free}
          </p>
        </div>
        {isPremium ? (
          <Button variant="secondary" loading={loading === 'portal'} onClick={async () => { setLoading('portal'); try { await openCustomerPortal() } finally { setLoading(null) } }}>
            {tp.manage}
          </Button>
        ) : (
          <Badge tone="neutral">{tb.noSubscription}</Badge>
        )}
      </Card>

      {/* Subscriptions */}
      <h2 className="mt-8 text-lg font-semibold text-navy-900">{tp.subscriptions}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {subscriptions.map((p) => (
          <Card key={p.id} className={`relative p-6 ${p.highlighted ? 'ring-2 ring-electric-400' : ''}`}>
            {p.highlighted && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-0.5 text-xs font-semibold text-white">
                {t.pricing.mostPopular}
              </span>
            )}
            <p className="text-lg font-bold text-navy-900">{p.name}</p>
            <p className="mt-1 text-2xl font-extrabold text-navy-900">{priceLabel(p)}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-navy-600">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><span className="text-green-500">✓</span>{f}</li>
              ))}
            </ul>
            <Button
              className="mt-5 w-full rounded-full"
              variant={p.highlighted ? 'primary' : 'secondary'}
              disabled={p.current}
              loading={loading === p.id}
              onClick={() => choose(p)}
            >
              {p.current ? tp.current : tp.choose}
            </Button>
          </Card>
        ))}
      </div>
    </PageTransition>
  )
}
