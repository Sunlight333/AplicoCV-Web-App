import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/auth/AuthContext'
import { startCheckout, openCustomerPortal, getPlans, buyCreditPack, type Plan } from '@/services/billing'
import { useT } from '@/i18n/I18nProvider'

export default function BillingPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const t = useT()
  const tb = t.app.billing
  const tp = t.app.more.plans
  const [loading, setLoading] = useState<string | null>(null)
  const isPremium = user?.plan === 'premium'
  const plans = useQuery({ queryKey: ['plans'], queryFn: getPlans })

  const subscriptions = (plans.data ?? []).filter((p) => p.kind === 'subscription')
  const packs = (plans.data ?? []).filter((p) => p.kind === 'credits')

  const choose = async (plan: Plan) => {
    setLoading(plan.id)
    try {
      if (plan.kind === 'credits') {
        await buyCreditPack(plan.id)
        qc.invalidateQueries({ queryKey: ['credits'] })
      } else if (plan.id !== 'free') {
        await startCheckout()
      }
    } finally {
      setLoading(null)
    }
  }

  const priceLabel = (p: Plan) =>
    p.price === 0
      ? t.app.nav.free
      : `$${p.price}${p.interval === 'once' ? ` ${tp.oneTime}` : p.interval === 'year' ? '/yr' : '/mo'}`

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{tp.title}</h1>
      <p className="mt-1 text-navy-500">{tp.subtitle}</p>

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
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {subscriptions.map((p) => (
          <Card key={p.id} className={`relative p-6 ${p.highlighted ? 'ring-2 ring-electric-400' : ''}`}>
            {p.highlighted && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-0.5 text-xs font-semibold text-white">
                {t.pricing.mostPopular}
              </span>
            )}
            <p className="text-lg font-bold text-navy-900">{p.name}</p>
            <p className="mt-1 text-2xl font-extrabold text-navy-900">{priceLabel(p)}</p>
            {p.credits != null && <p className="mt-0.5 text-xs text-navy-400">✦ {p.credits.toLocaleString()} credits</p>}
            <ul className="mt-4 space-y-1.5 text-sm text-navy-600">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><span className="text-green-500">✓</span>{f}</li>
              ))}
            </ul>
            <Button
              className="mt-5 w-full rounded-full"
              variant={p.highlighted ? 'primary' : 'secondary'}
              disabled={p.current || p.id === 'free'}
              loading={loading === p.id}
              onClick={() => choose(p)}
            >
              {p.current ? tp.current : tp.choose}
            </Button>
          </Card>
        ))}
      </div>

      {/* Credit packs */}
      <h2 className="mt-8 text-lg font-semibold text-navy-900">{tp.packs}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {packs.map((p) => (
          <Card key={p.id} className={`p-5 text-center ${p.highlighted ? 'ring-2 ring-violet-300' : ''}`}>
            <p className="text-2xl font-extrabold text-navy-900">✦ {p.credits?.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-navy-500">{p.name}</p>
            <p className="mt-2 text-lg font-bold text-navy-900">${p.price}</p>
            <Button className="mt-3 w-full rounded-full" variant="secondary" loading={loading === p.id} onClick={() => choose(p)}>
              {tp.buy}
            </Button>
          </Card>
        ))}
      </div>
    </PageTransition>
  )
}
