import { useQuery } from '@tanstack/react-query'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { getMarketHeatmap, type MarketStat } from '@/services/insights'

interface MarketCopy {
  title: string; subtitle: string
  skills: string; companies: string; portals: string; remote: string; remoteSub: string
  sample: (n: number) => string; empty: string
}

const COPY: Record<Locale, MarketCopy> = {
  en: {
    title: 'Job market heatmap', subtitle: 'Anonymous, aggregate signal from across AplicoCV members — what’s in demand right now.',
    skills: 'Most in-demand skills', companies: 'Most-applied companies', portals: 'Busiest portals', remote: 'Remote / hybrid demand', remoteSub: 'of members prefer remote or hybrid',
    sample: (n) => `Based on ${n} tracked applications`, empty: 'Not enough data yet — check back as more members apply.',
  },
  es: {
    title: 'Mapa de calor del mercado', subtitle: 'Señal agregada y anónima de los miembros de AplicoCV — lo que se demanda ahora.',
    skills: 'Habilidades más demandadas', companies: 'Empresas más postuladas', portals: 'Portales más activos', remote: 'Demanda remoto / híbrido', remoteSub: 'de los miembros prefiere remoto o híbrido',
    sample: (n) => `Basado en ${n} postulaciones registradas`, empty: 'Aún no hay suficientes datos — vuelve más tarde.',
  },
  'pt-BR': {
    title: 'Mapa de calor do mercado', subtitle: 'Sinal agregado e anônimo dos membros da AplicoCV — o que está em demanda agora.',
    skills: 'Habilidades mais procuradas', companies: 'Empresas mais aplicadas', portals: 'Portais mais ativos', remote: 'Demanda remoto / híbrido', remoteSub: 'dos membros preferem remoto ou híbrido',
    sample: (n) => `Com base em ${n} candidaturas registradas`, empty: 'Ainda não há dados suficientes — volte mais tarde.',
  },
}

function StatList({ title, stats }: { title: string; stats: MarketStat[] }) {
  const max = stats.reduce((m, s) => Math.max(m, s.value), 1)
  return (
    <Card className="p-6">
      <h2 className="font-semibold text-navy-900">{title}</h2>
      <div className="mt-4 space-y-2.5">
        {stats.length === 0 && <p className="text-sm text-navy-400">—</p>}
        {stats.map((s) => (
          <div key={s.label}>
            <div className="flex justify-between text-sm">
              <span className="text-navy-700">{s.label}</span>
              <span className="tabular-nums text-navy-400">{s.value}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-navy-100">
              <div className="h-full rounded-full bg-gradient-to-r from-electric-400 to-violet-500" style={{ width: `${(s.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function MarketPage() {
  const c = useCopy(COPY)
  const { data, isLoading } = useQuery({ queryKey: ['market-heatmap'], queryFn: getMarketHeatmap })

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{c.title}</h1>
      <p className="mt-1 text-navy-500">{c.subtitle}</p>

      {isLoading || !data ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6"><Skeleton className="h-5 w-40" /><Skeleton className="mt-4 h-24 w-full" /></Card>
          ))}
        </div>
      ) : (
        <>
          <Card className="mt-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-navy-400">{c.remote}</p>
                <p className="text-3xl font-extrabold text-navy-900 tabular-nums">{data.remoteShare}%</p>
                <p className="text-xs text-navy-400">{c.remoteSub}</p>
              </div>
              <p className="max-w-md text-sm text-navy-500">{data.insight}</p>
            </div>
          </Card>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StatList title={c.skills} stats={data.topSkills} />
            <StatList title={c.companies} stats={data.topCompanies} />
            <StatList title={c.portals} stats={data.topPortals} />
          </div>
          <p className="mt-4 text-xs text-navy-400">{c.sample(data.sampleSize)}</p>
        </>
      )}
    </PageTransition>
  )
}
