import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { AtsRing } from '@/components/AtsRing'
import { useCountUp } from '@/hooks/useCountUp'
import { useAuth } from '@/auth/AuthContext'
import { getStats, getRecommendations } from '@/services/dashboard'
import { getProfile } from '@/services/profile'
import { listApplyTasks, dismissApplyTask } from '@/services/apply'
import { getBurnout } from '@/services/insights'
import { listApplications } from '@/services/applications'
import { statusMeta } from './tracking/statusMeta'
import { useT } from '@/i18n/I18nProvider'
import { currentLocale } from '@/lib/locale'

// Panel-specific copy (client 24.07): the dashboard must NOT list more jobs than
// Copilot — it points to Copilot and shows what's left to complete in the profile.
const PANEL = {
  en: {
    copilotTitle: 'Your job matches', betaAgent: 'AI Agent',
    waiting: (n: number) => `${n} recommendation${n === 1 ? '' : 's'} are waiting for you in Copilot.`,
    empty: 'Open Copilot to get your first matches.', cta: 'Go to Copilot',
    completeTitle: 'Complete your profile', completeSub: 'A complete profile means better matches. Still to add:',
    completeDone: 'Your profile looks complete — nice work.', completeCta: 'Complete profile',
    mContact: 'Contact details', mExperience: 'Experience', mEducation: 'Education', mLanguages: 'Languages', mSkills: 'Skills',
  },
  es: {
    copilotTitle: 'Tus coincidencias de empleo', betaAgent: 'Agente IA',
    waiting: (n: number) => `Te ${n === 1 ? 'espera' : 'esperan'} ${n} recomendación${n === 1 ? '' : 'es'} en Copiloto.`,
    empty: 'Abrí Copiloto para obtener tus primeras coincidencias.', cta: 'Ir a Copiloto',
    completeTitle: 'Completá tu perfil', completeSub: 'Un perfil completo mejora tus coincidencias. Te falta agregar:',
    completeDone: 'Tu perfil se ve completo — ¡bien hecho!', completeCta: 'Completar perfil',
    mContact: 'Datos de contacto', mExperience: 'Experiencia', mEducation: 'Educación', mLanguages: 'Idiomas', mSkills: 'Habilidades',
  },
  'pt-BR': {
    copilotTitle: 'Suas vagas compatíveis', betaAgent: 'Agente IA',
    waiting: (n: number) => `${n} recomendaç${n === 1 ? 'ão espera' : 'ões esperam'} por você no Copilot.`,
    empty: 'Abra o Copilot para obter suas primeiras combinações.', cta: 'Ir para o Copilot',
    completeTitle: 'Complete seu perfil', completeSub: 'Um perfil completo melhora suas combinações. Ainda falta:',
    completeDone: 'Seu perfil parece completo — bom trabalho!', completeCta: 'Completar perfil',
    mContact: 'Dados de contato', mExperience: 'Experiência', mEducation: 'Educação', mLanguages: 'Idiomas', mSkills: 'Habilidades',
  },
} as const

function StatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const animated = useCountUp(value)
  const display = Number.isInteger(value) ? Math.round(animated) : animated.toFixed(1)
  return (
    <Card className="p-5">
      <p className="text-sm text-navy-400">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-navy-900 tabular-nums">
        {display}
        {suffix}
      </p>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const t = useT()
  const td = t.app.dashboard
  const p = PANEL[(currentLocale() as keyof typeof PANEL)] ?? PANEL.en
  const qc = useQueryClient()

  const stats = useQuery({ queryKey: ['stats'], queryFn: getStats })
  const recent = useQuery({
    queryKey: ['applications', 'recent'],
    queryFn: () => listApplications(),
  })
  const recs = useQuery({ queryKey: ['recommendations'], queryFn: getRecommendations })
  const profile = useQuery({ queryKey: ['profile'], queryFn: getProfile })
  const burnout = useQuery({ queryKey: ['burnout'], queryFn: getBurnout })
  const applyTasks = useQuery({ queryKey: ['apply-tasks'], queryFn: listApplyTasks })

  const dismiss = useMutation({
    mutationFn: dismissApplyTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apply-tasks'] }),
  })

  // The snapshot reflects the best ATS-scored match the agent has surfaced for
  // this user, rather than a hardcoded value. Null until any data exists.
  const latestAtsScore =
    recs.data && recs.data.length ? Math.max(...recs.data.map((r) => r.matchScore)) : null

  // Which core profile sections the user still needs to fill (client 24.07: the panel
  // should tell you what's left to complete, e.g. Languages).
  const pd = profile.data
  const missing: string[] = []
  if (pd) {
    if (!pd.personal.email && !pd.personal.phone) missing.push(p.mContact)
    if (!(pd.experience?.length)) missing.push(p.mExperience)
    if (!(pd.education?.length)) missing.push(p.mEducation)
    if (!(pd.languages?.length)) missing.push(p.mLanguages)
    if (!(pd.skills?.length)) missing.push(p.mSkills)
  }

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">
        {td.welcome(user?.fullName.split(' ')[0] ?? '')}
      </h1>
      <p className="mt-1 text-navy-500">{td.subtitle}</p>

      {/* Imported CV / profile summary — the first thing a user sees post-login */}
      {profile.isLoading ? (
        <Card className="mt-6 p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-3 h-4 w-full" />
        </Card>
      ) : profile.data && profile.data.personal.fullName ? (
        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-bold text-navy-900">{profile.data.personal.fullName}</p>
              {profile.data.personal.headline && (
                <p className="text-sm font-medium text-electric-600">{profile.data.personal.headline}</p>
              )}
            </div>
            <Link to="/profile" className="text-sm font-medium text-electric-600 hover:underline">
              {td.viewProfile}
            </Link>
          </div>
          {profile.data.personal.summary && (
            <p className="mt-3 line-clamp-2 text-sm text-navy-500">{profile.data.personal.summary}</p>
          )}
          {profile.data.experience[0]?.title && (
            <p className="mt-3 text-sm text-navy-600">
              <span className="text-navy-400">{td.latestRole} </span>
              {profile.data.experience[0].title}
              {profile.data.experience[0].employer ? ` · ${profile.data.experience[0].employer}` : ''}
            </p>
          )}
          {profile.data.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.data.skills.slice(0, 10).map((s) => (
                <Badge key={s} tone="neutral">
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-semibold text-navy-900">{td.importTitle}</p>
            <p className="text-sm text-navy-500">{td.importSubtitle}</p>
          </div>
          <Link
            to="/profile"
            className="inline-flex h-10 items-center rounded-full bg-electric-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-electric-600"
          >
            {td.importCta}
          </Link>
        </Card>
      )}

      {/* Stats row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.isLoading || !stats.data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
            </Card>
          ))
        ) : (
          <>
            <StatCard label={td.totalApplications} value={stats.data.totalApplications} />
            <StatCard label={td.responseRate} value={Math.round(stats.data.responseRate * 100)} suffix="%" />
            <StatCard label={td.interviews} value={stats.data.interviews} />
            <StatCard label={td.hoursSaved} value={Math.round(stats.data.minutesSaved / 60)} suffix="h" />
          </>
        )}
      </div>

      {/* Free monthly application quota (Phase 5.2) */}
      {stats.data?.monthlyLimit != null && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-navy-500">
              {stats.data.applicationsThisMonth ?? 0}/{stats.data.monthlyLimit} {td.appsThisMonth}
            </span>
            {(stats.data.applicationsThisMonth ?? 0) >= stats.data.monthlyLimit && (
              <Link to="/settings/billing" className="font-medium text-electric-600 hover:underline">
                {td.freeLimitReached}
              </Link>
            )}
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-navy-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-electric-400 to-violet-500"
              style={{ width: `${Math.min(100, ((stats.data.applicationsThisMonth ?? 0) / stats.data.monthlyLimit) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Burnout check (Phase 3.4) — only surfaced when strain is elevated */}
      {burnout.data && burnout.data.level !== 'healthy' && (
        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-navy-900">Job-search burnout check</h2>
                <Badge tone={burnout.data.level === 'high' ? 'warning' : 'neutral'}>
                  {burnout.data.level === 'high' ? 'High strain' : 'Elevated'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-navy-500">
                {burnout.data.applicationsLast7Days} applications in the last 7 days ·{' '}
                {Math.round(burnout.data.responseRate * 100)}% response rate
              </p>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5">
            {burnout.data.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-navy-600"><span className="text-electric-500">→</span>{s}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Prepared "apply on your behalf" tasks (Phase 1.3) */}
      {applyTasks.data && applyTasks.data.filter((tk) => tk.status === 'prepared').length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-navy-900">Prepared applications</h2>
          <p className="mt-1 text-sm text-navy-500">
            Tailored and ready — open the AplicoCV extension on each job page to autofill and submit.
          </p>
          <div className="mt-4 divide-y divide-navy-100">
            {applyTasks.data
              .filter((tk) => tk.status === 'prepared')
              .map((tk) => (
                <div key={tk.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy-900">{tk.jobTitle}</p>
                    <p className="truncate text-xs text-navy-400">
                      {tk.company} · {tk.portal}
                      {tk.matchScore != null ? ` · ${tk.matchScore}% match` : ''}
                    </p>
                  </div>
                  <a
                    href={tk.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center rounded-lg bg-electric-500 px-3 text-xs font-semibold text-white hover:bg-electric-600"
                  >
                    Open job
                  </a>
                  <button
                    onClick={() => dismiss.mutate(tk.id)}
                    disabled={dismiss.isPending}
                    className="text-xs font-medium text-navy-400 hover:text-red-500"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent applications */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy-900">{td.recentApplications}</h2>
            <Link to="/applications" className="text-sm font-medium text-electric-600 hover:underline">
              {td.viewAll}
            </Link>
          </div>
          <div className="mt-4 divide-y divide-navy-100">
            {recent.isLoading || !recent.data
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="mt-2 h-3 w-24" />
                    </div>
                  </div>
                ))
              : recent.data.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-navy-100 text-sm font-bold text-navy-600">
                      {app.company[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy-900">{app.jobTitle}</p>
                      <p className="truncate text-xs text-navy-400">
                        {app.company} · {app.portal}
                      </p>
                    </div>
                    <Badge tone={statusMeta(t, app.status).tone}>{statusMeta(t, app.status).label}</Badge>
                  </div>
                ))}
          </div>
        </Card>

        {/* ATS snapshot */}
        <Card className="flex flex-col items-center justify-center p-5">
          <h2 className="self-start font-semibold text-navy-900">{td.latestAts}</h2>
          <div className="my-4">
            {recs.isLoading ? (
              <Skeleton className="h-[120px] w-[120px] rounded-full" />
            ) : (
              <AtsRing score={latestAtsScore ?? 0} />
            )}
          </div>
          <p className="text-center text-sm text-navy-500">
            {latestAtsScore == null ? td.atsEmpty : latestAtsScore >= 75 ? td.atsStrong : td.atsModerate}
          </p>
          <Link
            to="/ai-tools"
            className="mt-3 text-sm font-medium text-electric-600 hover:underline"
          >
            {td.analyzeNew}
          </Link>
        </Card>
      </div>

      {/* Copilot CTA + profile completeness. The panel does NOT list jobs — all
          recommendations live in Copilot, so the dashboard never shows more options
          than Copilot (client 24.07). It sends you there and shows what's left to do. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="relative flex flex-col justify-between overflow-hidden bg-navy-900 p-6 text-white lg:col-span-2">
          <div className="absolute inset-0 grid-pattern opacity-[0.06]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{p.copilotTitle}</h2>
              <Badge tone="info">{p.betaAgent}</Badge>
            </div>
            <p className="mt-2 max-w-md text-navy-200">
              {recs.data && recs.data.length ? p.waiting(recs.data.length) : p.empty}
            </p>
          </div>
          <Link
            to="/copilot"
            className="relative mt-6 inline-flex h-11 w-fit items-center rounded-full bg-electric-500 px-6 font-semibold text-white shadow-emboss transition-colors hover:bg-electric-600"
          >
            {p.cta} →
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-navy-900">{p.completeTitle}</h2>
          {profile.isLoading ? (
            <Skeleton className="mt-3 h-4 w-40" />
          ) : missing.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">{p.completeDone}</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-navy-500">{p.completeSub}</p>
              <ul className="mt-3 space-y-1.5">
                {missing.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm text-navy-600">
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-amber-400" />
                    {m}
                  </li>
                ))}
              </ul>
              <Link to="/profile" className="mt-4 inline-block text-sm font-medium text-electric-600 hover:underline">
                {p.completeCta} →
              </Link>
            </>
          )}
        </Card>
      </div>
    </PageTransition>
  )
}
