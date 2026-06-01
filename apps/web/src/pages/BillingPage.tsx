import { useState } from 'react'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/auth/AuthContext'
import { startCheckout, openCustomerPortal } from '@/services/billing'
import { useT } from '@/i18n/I18nProvider'

export default function BillingPage() {
  const { user } = useAuth()
  const t = useT()
  const tb = t.app.billing
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null)
  const isPremium = user?.plan === 'premium'

  const handle = async (which: 'checkout' | 'portal') => {
    setLoading(which)
    try {
      await (which === 'checkout' ? startCheckout() : openCustomerPortal())
    } finally {
      setLoading(null)
    }
  }

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{tb.title}</h1>
      <p className="mt-1 text-navy-500">{tb.subtitle}</p>

      <Card className="mt-6 max-w-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-navy-400">{tb.currentPlan}</p>
            <p className="mt-1 text-xl font-bold text-navy-900">
              {isPremium ? t.app.nav.premium : t.app.nav.free}
            </p>
          </div>
          <Badge tone={isPremium ? 'info' : 'neutral'}>{isPremium ? tb.active : tb.noSubscription}</Badge>
        </div>

        <div className="mt-6 border-t border-navy-100 pt-6">
          {isPremium ? (
            <>
              <p className="text-sm text-navy-500">{tb.managePremium}</p>
              <Button
                className="mt-4"
                variant="secondary"
                loading={loading === 'portal'}
                onClick={() => handle('portal')}
              >
                {tb.openPortal}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-navy-500">{tb.upgradeBlurb}</p>
              <Button
                className="mt-4"
                loading={loading === 'checkout'}
                onClick={() => handle('checkout')}
              >
                {tb.upgrade}
              </Button>
            </>
          )}
        </div>
      </Card>
    </PageTransition>
  )
}
