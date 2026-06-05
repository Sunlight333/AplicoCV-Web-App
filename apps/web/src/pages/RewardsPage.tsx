import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/Toast'
import { getCredits, checkin, claimEarn } from '@/services/credits'
import { cn } from '@/lib/cn'

const EARN_LINK: Record<string, string> = {
  cv: '/profile', preferences: '/profile', experience: '/profile',
  skills: '/profile', faq: '/faq', extension: '/extension',
}

interface RewardsCopy {
  title: string; credits: string; dailyBoost: string
  streakAlive: (n: number) => string; checkInDaily: string
  claimedToday: string; checkIn: (n: number) => string
  doubleDayTitle: string; resetsNote: (days: string) => string
  profileCompletion: string; moreAvailable: (n: number) => string; allClaimed: string
  earnTitle: string; earnSubtitle: string; creditsPlus: (n: number) => string
  claimed: string; claim: string; complete: string; recentActivity: string
  earnLabels: Record<string, string>
  reasons: Record<string, string>
  checkinToast: (a: number, s: number) => string; claimToast: (a: number) => string
}

const REASONS_EN: Record<string, string> = {
  welcome_bonus: 'Welcome bonus', checkin: 'Daily check-in', earn: 'Profile reward',
  purchase: 'Credit purchase', referral_reward: 'Referral reward', referral_redeemed: 'Referral redeemed',
  ai: 'AI action',
}
const REASONS_ES: Record<string, string> = {
  welcome_bonus: 'Bono de bienvenida', checkin: 'Registro diario', earn: 'Recompensa de perfil',
  purchase: 'Compra de créditos', referral_reward: 'Recompensa por referido', referral_redeemed: 'Código de referido',
  ai: 'Acción de IA',
}
const REASONS_PT: Record<string, string> = {
  welcome_bonus: 'Bônus de boas-vindas', checkin: 'Check-in diário', earn: 'Recompensa de perfil',
  purchase: 'Compra de créditos', referral_reward: 'Recompensa por indicação', referral_redeemed: 'Código de indicação',
  ai: 'Ação de IA',
}

const COPY: Record<Locale, RewardsCopy> = {
  en: {
    title: 'Rewards & credits', credits: 'credits', dailyBoost: 'Daily boost',
    streakAlive: (n) => `${n}-day streak — keep it alive!`, checkInDaily: 'Check in daily to earn credits.',
    claimedToday: '✓ Claimed today', checkIn: (n) => `Check in +${n}`,
    doubleDayTitle: 'Double reward day', resetsNote: (d) => `Resets at midnight · Days ${d} pay double ✦`,
    profileCompletion: 'Profile completion', moreAvailable: (n) => `Up to ${n} more credits available below.`,
    allClaimed: 'Nice — you’ve claimed everything available!',
    earnTitle: 'Earn credits', earnSubtitle: 'Complete your profile to unlock free credits.',
    creditsPlus: (n) => `+${n} credits`, claimed: 'Claimed', claim: 'Claim', complete: 'Complete',
    recentActivity: 'Recent activity',
    earnLabels: { cv: 'Add your CV', preferences: 'Set your job preferences', experience: 'Add work experience', skills: 'Add your skills', faq: 'Answer 3 common questions', extension: 'Install the browser extension' },
    reasons: REASONS_EN,
    checkinToast: (a, s) => `+${a} credits · ${s}-day streak 🔥`, claimToast: (a) => `+${a} credits claimed 🎉`,
  },
  es: {
    title: 'Recompensas y créditos', credits: 'créditos', dailyBoost: 'Impulso diario',
    streakAlive: (n) => `Racha de ${n} días — ¡no la pierdas!`, checkInDaily: 'Regístrate cada día para ganar créditos.',
    claimedToday: '✓ Reclamado hoy', checkIn: (n) => `Registrarme +${n}`,
    doubleDayTitle: 'Día de recompensa doble', resetsNote: (d) => `Se reinicia a medianoche · Los días ${d} pagan doble ✦`,
    profileCompletion: 'Perfil completado', moreAvailable: (n) => `Hasta ${n} créditos más disponibles abajo.`,
    allClaimed: '¡Bien! Ya reclamaste todo lo disponible.',
    earnTitle: 'Gana créditos', earnSubtitle: 'Completa tu perfil para desbloquear créditos gratis.',
    creditsPlus: (n) => `+${n} créditos`, claimed: 'Reclamado', claim: 'Reclamar', complete: 'Completar',
    recentActivity: 'Actividad reciente',
    earnLabels: { cv: 'Agrega tu CV', preferences: 'Define tus preferencias', experience: 'Agrega experiencia laboral', skills: 'Agrega tus habilidades', faq: 'Responde 3 preguntas comunes', extension: 'Instala la extensión del navegador' },
    reasons: REASONS_ES,
    checkinToast: (a, s) => `+${a} créditos · racha de ${s} días 🔥`, claimToast: (a) => `+${a} créditos reclamados 🎉`,
  },
  'pt-BR': {
    title: 'Recompensas e créditos', credits: 'créditos', dailyBoost: 'Impulso diário',
    streakAlive: (n) => `Sequência de ${n} dias — mantenha-a viva!`, checkInDaily: 'Faça check-in todo dia para ganhar créditos.',
    claimedToday: '✓ Resgatado hoje', checkIn: (n) => `Fazer check-in +${n}`,
    doubleDayTitle: 'Dia de recompensa dobrada', resetsNote: (d) => `Reinicia à meia-noite · Os dias ${d} pagam em dobro ✦`,
    profileCompletion: 'Perfil concluído', moreAvailable: (n) => `Até ${n} créditos a mais disponíveis abaixo.`,
    allClaimed: 'Boa — você já resgatou tudo o que está disponível!',
    earnTitle: 'Ganhe créditos', earnSubtitle: 'Complete seu perfil para desbloquear créditos grátis.',
    creditsPlus: (n) => `+${n} créditos`, claimed: 'Resgatado', claim: 'Resgatar', complete: 'Completar',
    recentActivity: 'Atividade recente',
    earnLabels: { cv: 'Adicione seu currículo', preferences: 'Defina suas preferências', experience: 'Adicione experiência', skills: 'Adicione suas habilidades', faq: 'Responda 3 perguntas comuns', extension: 'Instale a extensão do navegador' },
    reasons: REASONS_PT,
    checkinToast: (a, s) => `+${a} créditos · sequência de ${s} dias 🔥`, claimToast: (a) => `+${a} créditos resgatados 🎉`,
  },
}

export default function RewardsPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const c = useCopy(COPY)
  const { data, isLoading } = useQuery({ queryKey: ['credits'], queryFn: getCredits })

  const checkinM = useMutation({
    mutationFn: checkin,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['credits'] })
      if (r.claimed) toast(c.checkinToast(r.amount ?? 0, r.streak))
    },
  })
  const claimM = useMutation({
    mutationFn: claimEarn,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['credits'] })
      if (r.ok) toast(c.claimToast(r.amount ?? 0))
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
  const reasonLabel = (raw: string) => {
    const key = Object.keys(c.reasons).find((k) => raw.startsWith(k))
    return key ? c.reasons[key] : raw.replace(/_/g, ' ')
  }

  return (
    <PageTransition>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy-900">{c.title}</h1>
        <div className="sheen-top relative flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 text-white shadow-tile">
          <span className="text-lg">✦</span>
          <span className="text-lg font-extrabold tabular-nums">{balance}</span>
          <span className="text-sm font-medium opacity-90">{c.credits}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-navy-900">{c.dailyBoost}</h2>
              <p className="text-sm text-navy-500">{streak > 0 ? c.streakAlive(streak) : c.checkInDaily}</p>
            </div>
            <Button className="rounded-full" loading={checkinM.isPending} disabled={todayClaimed} onClick={() => checkinM.mutate()}>
              {todayClaimed ? c.claimedToday : c.checkIn(data.checkinAmount)}
            </Button>
          </div>

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
                    isToday ? 'border-electric-500 bg-electric-500 text-white'
                      : isDone ? 'border-green-200 bg-green-50 text-green-600'
                      : special ? 'border-amber-200 bg-amber-50 text-amber-600'
                      : 'border-navy-100 bg-white text-navy-400',
                  )}
                  title={special ? c.doubleDayTitle : undefined}
                >
                  {isDone ? '✓' : d}
                  {special && <span className="absolute -right-0.5 -top-0.5 text-[10px]">✦</span>}
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-navy-400">{c.resetsNote(doubleDays.join(', '))}</p>
        </Card>

        <Card className="flex flex-col p-6">
          <h2 className="font-semibold text-navy-900">{c.profileCompletion}</h2>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-extrabold text-navy-900 tabular-nums">{completion.percent}</span>
            <span className="mb-1 text-navy-400">%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-100">
            <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${completion.percent}%` }} />
          </div>
          <p className="mt-4 text-sm text-navy-500">{earnTotal > 0 ? c.moreAvailable(earnTotal) : c.allClaimed}</p>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold text-navy-900">{c.earnTitle}</h2>
        <p className="text-sm text-navy-500">{c.earnSubtitle}</p>
        <div className="mt-4 divide-y divide-navy-100">
          {earn.map((e) => (
            <div key={e.key} className="flex items-center gap-3 py-3">
              <span className={cn('flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm', e.claimed ? 'bg-green-500 text-white' : 'bg-navy-100 text-navy-500')}>
                {e.claimed ? '✓' : '✦'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy-900">{c.earnLabels[e.key] ?? e.label}</p>
                <p className="text-xs text-electric-600">{c.creditsPlus(e.amount)}</p>
              </div>
              {e.claimed ? (
                <span className="text-sm font-medium text-green-600">{c.claimed}</span>
              ) : e.ready ? (
                <Button variant="secondary" className="rounded-full" loading={claimM.isPending && claimM.variables === e.key} onClick={() => claimM.mutate(e.key)}>
                  {c.claim}
                </Button>
              ) : (
                <Link to={EARN_LINK[e.key] ?? '/profile'}>
                  <Button variant="ghost" className="rounded-full">{c.complete}</Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </Card>

      {transactions.length > 0 && (
        <Card className="mt-6 p-6">
          <h2 className="font-semibold text-navy-900">{c.recentActivity}</h2>
          <div className="mt-3 divide-y divide-navy-100">
            {transactions.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-navy-500">{reasonLabel(t.reason)}</span>
                <span className={cn('font-semibold tabular-nums', t.amount >= 0 ? 'text-green-600' : 'text-red-500')}>
                  {t.amount >= 0 ? '+' : ''}{t.amount}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageTransition>
  )
}
