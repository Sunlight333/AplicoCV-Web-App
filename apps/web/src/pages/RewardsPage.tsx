import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/Toast'
import { getCredits, checkin, claimEarn } from '@/services/credits'
import { cn } from '@/lib/cn'

const EARN_LINK: Record<string, string> = {
  cv: '/profile',
  preferences: '/profile',
  experience: '/profile',
  skills: '/profile',
  faq: '/faq',
  extension: '/extension',
}

export default function RewardsPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const { data, isLoading } = useQuery({ queryKey: ['credits'], queryFn: getCredits })

  const checkinM = useMutation({
    mutationFn: checkin,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['credits'] })
      if (r.claimed) toast(`+${r.amount} credits · ${r.streak}-day streak 🔥`)
    },
  })
  const claimM = useMutation({
    mutationFn: claimEarn,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['credits'] })
      if (r.ok) toast(`+${r.amount} credits claimed 🎉`)
    },
  })

  if (isLoading || !data) {
    return (
      <PageTransition>
        <Skeleton className="h-8 w-48" />
        <Card className="mt-6 p-6"><Skeleton className="h-24 w-full" /></Card>
      </PageTransition>
    )
  }

  const { balance, streak, dayInCycle, todayClaimed, completion, earn, transactions, doubleDays, cycleDays } = data
  const earnTotal = earn.reduce((s, e) => s + (e.claimed ? 0 : e.ready ? e.amount : 0), 0)

  return (
    <PageTransition>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy-900">Rewards &amp; credits</h1>
        <div className="flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 text-white shadow-glow">
          <span className="text-lg">✦</span>
          <span className="text-lg font-extrabold tabular-nums">{balance}</span>
          <span className="text-sm font-medium opacity-90">credits</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Daily boost + streak calendar */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-navy-900">Daily boost</h2>
              <p className="text-sm text-navy-500">
                {streak > 0 ? `${streak}-day streak — keep it alive!` : 'Check in daily to earn credits.'}
              </p>
            </div>
            <Button
              className="rounded-full"
              loading={checkinM.isPending}
              disabled={todayClaimed}
              onClick={() => checkinM.mutate()}
            >
              {todayClaimed ? '✓ Claimed today' : `Check in +${data.checkinAmount}`}
            </Button>
          </div>

          {/* 30-day calendar */}
          <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-10">
            {Array.from({ length: cycleDays }, (_, i) => i + 1).map((d) => {
              const isToday = streak > 0 && d === dayInCycle
              const isDone = streak > 0 && d < dayInCycle
              const special = doubleDays.includes(d)
              return (
                <div
                  key={d}
                  className={cn(
                    'relative flex h-10 items-center justify-center rounded-lg border text-xs font-semibold transition-colors',
                    isToday
                      ? 'border-electric-500 bg-electric-500 text-white'
                      : isDone
                        ? 'border-green-200 bg-green-50 text-green-600'
                        : special
                          ? 'border-amber-200 bg-amber-50 text-amber-600'
                          : 'border-navy-100 bg-white text-navy-400',
                  )}
                  title={special ? 'Double reward day' : undefined}
                >
                  {isDone ? '✓' : d}
                  {special && <span className="absolute -right-0.5 -top-0.5 text-[10px]">✦</span>}
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-navy-400">
            Resets at midnight · Days {doubleDays.join(', ')} pay double ✦
          </p>
        </Card>

        {/* Profile completion */}
        <Card className="flex flex-col p-6">
          <h2 className="font-semibold text-navy-900">Profile completion</h2>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-extrabold text-navy-900 tabular-nums">{completion.percent}</span>
            <span className="mb-1 text-navy-400">%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-100">
            <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${completion.percent}%` }} />
          </div>
          <p className="mt-4 text-sm text-navy-500">
            {earnTotal > 0
              ? `Up to ${earnTotal} more credits available below.`
              : 'Nice — you’ve claimed everything available!'}
          </p>
        </Card>
      </div>

      {/* Earn credits checklist */}
      <Card className="mt-6 p-6">
        <h2 className="font-semibold text-navy-900">Earn credits</h2>
        <p className="text-sm text-navy-500">Complete your profile to unlock free credits.</p>
        <div className="mt-4 divide-y divide-navy-100">
          {earn.map((e) => (
            <div key={e.key} className="flex items-center gap-3 py-3">
              <span
                className={cn(
                  'flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm',
                  e.claimed ? 'bg-green-500 text-white' : 'bg-navy-100 text-navy-500',
                )}
              >
                {e.claimed ? '✓' : '✦'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy-900">{e.label}</p>
                <p className="text-xs text-electric-600">+{e.amount} credits</p>
              </div>
              {e.claimed ? (
                <span className="text-sm font-medium text-green-600">Claimed</span>
              ) : e.ready ? (
                <Button
                  variant="secondary"
                  className="rounded-full"
                  loading={claimM.isPending && claimM.variables === e.key}
                  onClick={() => claimM.mutate(e.key)}
                >
                  Claim
                </Button>
              ) : (
                <Link to={EARN_LINK[e.key] ?? '/profile'}>
                  <Button variant="ghost" className="rounded-full">
                    Complete
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Recent activity */}
      {transactions.length > 0 && (
        <Card className="mt-6 p-6">
          <h2 className="font-semibold text-navy-900">Recent activity</h2>
          <div className="mt-3 divide-y divide-navy-100">
            {transactions.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="capitalize text-navy-500">{t.reason.replace(/_/g, ' ')}</span>
                <span className={cn('font-semibold tabular-nums', t.amount >= 0 ? 'text-green-600' : 'text-red-500')}>
                  {t.amount >= 0 ? '+' : ''}
                  {t.amount}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageTransition>
  )
}
