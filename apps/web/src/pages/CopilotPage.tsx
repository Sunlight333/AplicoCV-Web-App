import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/Toast'
import { getRecommendations } from '@/services/dashboard'
import { runAgentScan } from '@/services/ai'
import { requestApply } from '@/services/apply'
import { currentLocale } from '@/lib/locale'
import type { Recommendation } from '@/types'

// The hero: the AI's daily shortlist, split into A (ready to apply, one click) and
// B (a copilot table you apply to yourself). Server-side scan → no open session needed.
const READY_THRESHOLD = 80

const COPY = {
  en: {
    title: 'Your job copilot',
    subtitle: 'The AI searches the portals for you and lines up your best matches every day. Don’t pay LinkedIn Premium.',
    scan: 'Find new jobs',
    scanning: 'Searching the portals…',
    ready: 'Ready to apply',
    readySub: 'Strong matches — apply in one click.',
    more: 'More matches',
    moreSub: 'Worth a look — review and apply yourself.',
    apply: 'Apply',
    view: 'View',
    match: 'match',
    preparing: 'Preparing your application…',
    prepared: 'Prepared — check Applications',
    failed: 'Could not prepare it. Try again.',
    searches: 'Portal searches',
    searchesSub: 'Open searches on the boards for your role and region — not scored matches.',
    empty: 'No matches yet — run a search to get your first shortlist.',
    done: (n: number) => `Found ${n} matches for you.`,
  },
  es: {
    title: 'Tu copiloto de empleo',
    subtitle: 'La IA busca en los portales por ti y arma tus mejores coincidencias cada día. No pagues LinkedIn Premium.',
    scan: 'Buscar empleos',
    scanning: 'Buscando en los portales…',
    ready: 'Listos para postular',
    readySub: 'Coincidencias fuertes — postula en un clic.',
    more: 'Más coincidencias',
    moreSub: 'Vale la pena revisarlas y postular tú mismo.',
    apply: 'Postular',
    view: 'Ver',
    match: 'match',
    preparing: 'Preparando tu postulación…',
    prepared: 'Lista — revisa Postulaciones',
    failed: 'No se pudo preparar. Inténtalo de nuevo.',
    searches: 'Búsquedas en portales',
    searchesSub: 'Búsquedas abiertas en los portales para tu puesto y región — no son coincidencias puntuadas.',
    empty: 'Aún no hay coincidencias — inicia una búsqueda para tu primera lista.',
    done: (n: number) => `Encontramos ${n} coincidencias para ti.`,
  },
  'pt-BR': {
    title: 'Seu copiloto de vagas',
    subtitle: 'A IA busca nos portais por você e monta suas melhores combinações todo dia. Não pague LinkedIn Premium.',
    scan: 'Buscar vagas',
    scanning: 'Buscando nos portais…',
    ready: 'Prontas para se candidatar',
    readySub: 'Combinações fortes — candidate-se em um clique.',
    more: 'Mais combinações',
    moreSub: 'Vale revisar e se candidatar você mesmo.',
    apply: 'Candidatar',
    view: 'Ver',
    match: 'match',
    preparing: 'Preparando sua candidatura…',
    prepared: 'Pronta — veja Candidaturas',
    failed: 'Não foi possível preparar. Tente de novo.',
    searches: 'Buscas nos portais',
    searchesSub: 'Buscas abertas nos portais para sua vaga e região — não são combinações pontuadas.',
    empty: 'Ainda não há combinações — inicie uma busca para sua primeira lista.',
    done: (n: number) => `Encontramos ${n} combinações para você.`,
  },
} as const

export default function CopilotPage() {
  const c = COPY[(currentLocale() as keyof typeof COPY)] ?? COPY.en
  const { toast } = useToast()
  const qc = useQueryClient()
  const recs = useQuery({ queryKey: ['recommendations'], queryFn: getRecommendations })

  const scan = useMutation({
    mutationFn: runAgentScan,
    onSuccess: (list) => {
      qc.setQueryData(['recommendations'], list)
      toast(c.done(list.length))
    },
  })

  const list = recs.data ?? []
  // matchScore === 0 is the server's sentinel for "portal search link", not a scored
  // job. Those are shown in their own group WITHOUT a match badge — showing a % for a
  // search URL would be inventing a number we never computed.
  const scored = list.filter((r) => r.matchScore > 0)
  const links = list.filter((r) => r.matchScore === 0)
  const ready = scored.filter((r) => r.matchScore >= READY_THRESHOLD)
  const more = scored.filter((r) => r.matchScore < READY_THRESHOLD)

  return (
    <PageTransition>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{c.title}</h1>
          <p className="mt-1 max-w-2xl text-navy-500">{c.subtitle}</p>
        </div>
        <Button className="rounded-full" loading={scan.isPending} onClick={() => scan.mutate()}>
          {scan.isPending ? c.scanning : c.scan}
        </Button>
      </div>

      {recs.isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : list.length === 0 ? (
        <Card className="mt-6 flex min-h-[14rem] items-center justify-center p-6 text-center text-sm text-navy-400">
          {c.empty}
        </Card>
      ) : (
        <>
          {/* A — ready to apply */}
          {ready.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-navy-900">{c.ready}</h2>
              <p className="text-sm text-navy-400">{c.readySub}</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {ready.map((r) => (
                  <ReadyCard key={r.id} r={r} applyLabel={c.apply} matchLabel={c.match} preparingLabel={c.preparing} preparedLabel={c.prepared} failedLabel={c.failed} />
                ))}
              </div>
            </section>
          )}

          {/* B — copilot table */}
          {more.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-navy-900">{c.more}</h2>
              <p className="text-sm text-navy-400">{c.moreSub}</p>
              <Card className="mt-3 divide-y divide-navy-100 p-0">
                {more.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900">{r.jobTitle}</p>
                      <p className="truncate text-xs text-navy-400">{r.company} · {r.portal}</p>
                    </div>
                    <Badge tone={r.matchScore >= 65 ? 'info' : 'neutral'}>{r.matchScore}% {c.match}</Badge>
                    <a href={r.jobUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-electric-600 hover:underline">
                      {c.view} →
                    </a>
                  </div>
                ))}
              </Card>
            </section>
          )}

          {/* C — portal searches. Not scored jobs: these are query links, so they get
              no match badge and never sit in "ready to apply". */}
          {links.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-navy-900">{c.searches}</h2>
              <p className="text-sm text-navy-400">{c.searchesSub}</p>
              <Card className="mt-3 divide-y divide-navy-100 p-0">
                {links.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900">{r.jobTitle}</p>
                      <p className="truncate text-xs text-navy-400">{r.portal}</p>
                    </div>
                    <a href={r.jobUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-electric-600 hover:underline">
                      {c.view} →
                    </a>
                  </div>
                ))}
              </Card>
            </section>
          )}
        </>
      )}
    </PageTransition>
  )
}

/** A strong match. "Apply" here is the real one-click action: it calls /apply/request,
 *  which tailors a CV to the posting and drafts the cover letter, then opens the job so
 *  the extension can fill it. It used to be a bare <a href> — identical to "View" in the
 *  table below — so the headline promise did nothing but open a tab. */
function ReadyCard({
  r, applyLabel, matchLabel, preparingLabel, preparedLabel, failedLabel,
}: {
  r: Recommendation
  applyLabel: string
  matchLabel: string
  preparingLabel: string
  preparedLabel: string
  failedLabel: string
}) {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle')

  const apply = async () => {
    setState('working')
    try {
      await requestApply({
        recommendationId: r.id,
        jobUrl: r.jobUrl,
        portal: r.portal,
        jobTitle: r.jobTitle,
        company: r.company,
        autoTailor: true,
      })
      setState('done')
      // Open the posting only after the tailored CV + letter are prepared, so the
      // extension has something to fill with.
      window.open(r.jobUrl, '_blank', 'noopener')
    } catch {
      setState('error')
    }
  }

  return (
    <Card className="flex flex-col p-5 ring-1 ring-electric-100">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-900">{r.jobTitle}</p>
          <p className="truncate text-sm text-navy-400">{r.company} · {r.portal}</p>
        </div>
        <Badge tone="success">{r.matchScore}% {matchLabel}</Badge>
      </div>
      {r.strategicNote && <p className="mt-3 flex-1 text-sm text-navy-600">{r.strategicNote}</p>}
      <Button
        className="mt-4 w-full rounded-full"
        loading={state === 'working'}
        disabled={state === 'working'}
        onClick={apply}
      >
        {state === 'working' ? preparingLabel : state === 'done' ? preparedLabel : applyLabel}
      </Button>
      {state === 'error' && <p className="mt-2 text-center text-xs text-red-600">{failedLabel}</p>}
    </Card>
  )
}
