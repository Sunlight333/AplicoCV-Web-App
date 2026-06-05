import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { Card, HoverCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { AtsRing } from '@/components/AtsRing'
import { useCountUp } from '@/hooks/useCountUp'
import { useAuth } from '@/auth/AuthContext'
import { getStats, getRecommendations } from '@/services/dashboard'
import { getProfile } from '@/services/profile'
import { runAgentScan } from '@/services/ai'
import { listApplications } from '@/services/applications'
import { statusMeta } from './tracking/statusMeta'
import { useToast } from '@/components/Toast'
import { useT } from '@/i18n/I18nProvider'

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
  const qc = useQueryClient()
  const { toast } = useToast()

  const stats = useQuery({ queryKey: ['stats'], queryFn: getStats })
  const recent = useQuery({
    queryKey: ['applications', 'recent'],
    queryFn: () => listApplications(),
  })
  const recs = useQuery({ queryKey: ['recommendations'], queryFn: getRecommendations })
  const profile = useQuery({ queryKey: ['profile'], queryFn: getProfile })

  // The snapshot reflects the best ATS-scored match the agent has surfaced for
  // this user, rather than a hardcoded value. Null until any data exists.
  const latestAtsScore =
    recs.data && recs.data.length ? Math.max(...recs.data.map((r) => r.matchScore)) : null

  const scan = useMutation({
    mutationFn: runAgentScan,
    onSuccess: (results) => {
      qc.setQueryData(['recommendations'], results)
      toast(td.scanDone(results.length))
    },
    onError: () => toast(td.scanError, 'error'),
  })

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

      {/* Recommendations */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-navy-900">{td.recommended}</h2>
          <Badge tone="info">{td.betaAgent}</Badge>
          <button
            onClick={() => scan.mutate()}
            disabled={scan.isPending}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-100 disabled:opacity-60"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 ${scan.isPending ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M4 12a8 8 0 0114-5.3L20 8M20 12a8 8 0 01-14 5.3L4 16" />
              <path d="M20 4v4h-4M4 20v-4h4" />
            </svg>
            {scan.isPending ? td.scanning : td.findMatches}
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {recs.isLoading || !recs.data
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-24" />
                  <Skeleton className="mt-4 h-8 w-full" />
                </Card>
              ))
            : recs.data.map((rec) => (
                <HoverCard key={rec.id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-navy-900">{rec.jobTitle}</p>
                      <p className="text-sm text-navy-400">
                        {rec.company} · {rec.portal}
                      </p>
                    </div>
                    <Badge tone={rec.matchScore > 80 ? 'success' : 'info'}>{rec.matchScore}%</Badge>
                  </div>
                  {rec.strategicNote && (
                    <p className="mt-3 rounded-lg bg-navy-50 p-3 text-xs text-navy-500">
                      💡 {rec.strategicNote}
                    </p>
                  )}
                  <a
                    href={rec.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-electric-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-electric-600"
                  >
                    {td.goApply}
                  </a>
                </HoverCard>
              ))}
        </div>
      </div>
    </PageTransition>
  )
}
