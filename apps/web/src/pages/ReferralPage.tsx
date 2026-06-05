import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/Toast'
import { useT } from '@/i18n/I18nProvider'
import { getReferral, redeemReferral } from '@/services/referrals'
import { useCopy } from '@/i18n/useCopy'
import type { Locale } from '@/i18n/dictionaries'

const RC: Record<Locale, { bonus: (n: number) => string }> = {
  en: { bonus: (n) => `You and your friend each get ${n} credits when they join.` },
  es: { bonus: (n) => `Tú y tu amigo reciben ${n} créditos cada uno cuando se une.` },
  'pt-BR': { bonus: (n) => `Você e seu amigo ganham ${n} créditos cada um quando ele entra.` },
}

export default function ReferralPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const t = useT()
  const tr = t.app.more.referrals
  const rc = useCopy(RC)
  const [code, setCode] = useState('')

  const ref = useQuery({ queryKey: ['referral'], queryFn: getReferral })

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast(tr.copied)
  }

  const redeem = useMutation({
    mutationFn: () => redeemReferral(code.trim()),
    onSuccess: (r) => {
      toast(r.message, r.ok ? 'success' : 'error')
      if (r.ok) {
        setCode('')
        qc.invalidateQueries({ queryKey: ['credits'] })
        qc.invalidateQueries({ queryKey: ['referral'] })
      }
    },
    onError: () => toast('Could not redeem code', 'error'),
  })

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{tr.title}</h1>
      <p className="mt-1 text-navy-500">{tr.subtitle}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 text-center lg:col-span-1">
          <p className="text-sm text-navy-400">{tr.invited}</p>
          <p className="mt-1 text-4xl font-bold text-navy-900">{ref.data?.referredCount ?? '–'}</p>
          <p className="mt-4 text-sm text-navy-400">{tr.earned}</p>
          <p className="mt-1 text-2xl font-bold text-electric-600">✦ {ref.data?.earned ?? 0}</p>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div>
            <p className="text-sm font-medium text-navy-700">{tr.yourCode}</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-navy-200 bg-navy-50 px-4 py-2.5 text-lg font-bold tracking-widest text-navy-900">
                {ref.data?.code ?? '········'}
              </code>
              <Button variant="secondary" className="rounded-full" onClick={() => ref.data && copy(ref.data.code)}>
                {tr.copy}
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-navy-700">{tr.yourLink}</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                readOnly
                value={ref.data?.link ?? ''}
                className="flex-1 truncate rounded-lg border border-navy-200 bg-navy-50 px-4 py-2.5 text-sm text-navy-600"
              />
              <Button variant="secondary" className="rounded-full" onClick={() => ref.data && copy(ref.data.link)}>
                {tr.copy}
              </Button>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-electric-50 p-3 text-sm text-electric-700">
            🎁 {rc.bonus(ref.data?.reward ?? 100)}
          </div>
        </Card>
      </div>

      <Card className="mt-6 max-w-xl p-6">
        <h2 className="text-lg font-semibold text-navy-900">{tr.redeemTitle}</h2>
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <Input
              placeholder={tr.redeemPlaceholder}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <Button className="rounded-full" loading={redeem.isPending} disabled={!code.trim()} onClick={() => redeem.mutate()}>
            {tr.redeem}
          </Button>
        </div>
      </Card>
    </PageTransition>
  )
}
