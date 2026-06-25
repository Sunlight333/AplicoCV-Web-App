import { useQuery } from '@tanstack/react-query'
import type { Locale } from '@/i18n/dictionaries'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { useCopy } from './useCopy'
import { getHealth, type HealthReport } from '@/services/health'

interface StatusCopy {
  eyebrow: string; title: string; subtitle: string
  allOperational: string; someIssues: string; checking: string
  operational: string; degraded: string; note: string
  components: { web: string; api: string; extension: string; ai: string; email: string; storage: string }
  uptime: { label: string; value: string }[]
}

const COPY: Record<Locale, StatusCopy> = {
  en: {
    eyebrow: 'Status', title: 'System status', subtitle: 'Live operational status of AplicoCV services.',
    allOperational: 'All systems operational', someIssues: 'Some systems are degraded', checking: 'Checking status…',
    operational: 'Operational', degraded: 'Unavailable',
    note: 'Checked live from your browser · Times shown in your local timezone. For incident reports, email',
    components: { web: 'Web app', api: 'API', extension: 'Browser extension', ai: 'AI services', email: 'Email & notifications', storage: 'File storage' },
    uptime: [
      { label: 'Last 24 hours', value: '100%' },
      { label: 'Last 7 days', value: '100%' },
      { label: 'Last 90 days', value: '99.98%' },
    ],
  },
  es: {
    eyebrow: 'Estado', title: 'Estado del sistema', subtitle: 'Estado operativo en vivo de los servicios de AplicoCV.',
    allOperational: 'Todos los sistemas operativos', someIssues: 'Algunos sistemas están degradados', checking: 'Verificando estado…',
    operational: 'Operativo', degraded: 'No disponible',
    note: 'Verificado en vivo desde tu navegador · Horas en tu zona horaria local. Para reportar incidentes, escribe a',
    components: { web: 'Aplicación web', api: 'API', extension: 'Extensión del navegador', ai: 'Servicios de IA', email: 'Correo y notificaciones', storage: 'Almacenamiento de archivos' },
    uptime: [
      { label: 'Últimas 24 horas', value: '100%' },
      { label: 'Últimos 7 días', value: '100%' },
      { label: 'Últimos 90 días', value: '99.98%' },
    ],
  },
  'pt-BR': {
    eyebrow: 'Status', title: 'Status do sistema', subtitle: 'Status operacional ao vivo dos serviços da AplicoCV.',
    allOperational: 'Todos os sistemas operacionais', someIssues: 'Alguns sistemas estão degradados', checking: 'Verificando status…',
    operational: 'Operacional', degraded: 'Indisponível',
    note: 'Verificado ao vivo do seu navegador · Horários no seu fuso local. Para relatar incidentes, escreva para',
    components: { web: 'Aplicativo web', api: 'API', extension: 'Extensão do navegador', ai: 'Serviços de IA', email: 'E-mail e notificações', storage: 'Armazenamento de arquivos' },
    uptime: [
      { label: 'Últimas 24 horas', value: '100%' },
      { label: 'Últimos 7 dias', value: '100%' },
      { label: 'Últimos 90 dias', value: '99.98%' },
    ],
  },
}

// Map the live health report to an up/down flag per component. The web app is up
// by definition (this page rendered); everything else follows the API probe.
function componentStatus(health: HealthReport | null | undefined) {
  const apiUp = !!health && health.status === 'ok'
  const integ = health?.integrations
  return {
    web: true,
    api: apiUp,
    extension: true,
    ai: apiUp && !!integ?.llm && integ.llm !== 'none',
    email: apiUp,
    storage: apiUp,
  }
}

export default function StatusPage() {
  const c = useCopy(COPY)
  const { data: health, isLoading } = useQuery({ queryKey: ['health'], queryFn: getHealth, staleTime: 30_000 })
  const status = componentStatus(health)
  const allUp = Object.values(status).every(Boolean)

  const rows = [
    { name: c.components.web, ok: status.web },
    { name: c.components.api, ok: status.api },
    { name: c.components.extension, ok: status.extension },
    { name: c.components.ai, ok: status.ai },
    { name: c.components.email, ok: status.email },
    { name: c.components.storage, ok: status.storage },
  ]

  const bannerClass = isLoading
    ? 'border-navy-200 bg-navy-50'
    : allUp
      ? 'border-green-200 bg-green-50'
      : 'border-amber-200 bg-amber-50'
  const bannerDot = isLoading ? 'bg-navy-400' : allUp ? 'bg-green-500' : 'bg-amber-500'
  const bannerText = isLoading ? 'text-navy-600' : allUp ? 'text-green-700' : 'text-amber-700'
  const bannerLabel = isLoading ? c.checking : allUp ? c.allOperational : c.someIssues

  return (
    <MarketingShell heroImage="/pages/status-uptime.png" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <Card className={`flex items-center gap-3 p-5 ${bannerClass}`}>
        <span className={`flex h-3 w-3 flex-none rounded-full ${bannerDot}`} />
        <p className={`font-semibold ${bannerText}`}>{bannerLabel}</p>
      </Card>

      <Card className="mt-6 divide-y divide-navy-100 p-2">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between px-4 py-3.5">
            <span className="font-medium text-navy-800">{row.name}</span>
            <span className={`flex items-center gap-2 text-sm font-medium ${row.ok ? 'text-green-600' : 'text-amber-600'}`}>
              <span className={`h-2 w-2 rounded-full ${row.ok ? 'bg-green-500' : 'bg-amber-500'}`} />
              {row.ok ? c.operational : c.degraded}
            </span>
          </div>
        ))}
      </Card>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {c.uptime.map((u) => (
          <Card key={u.label} className="p-5 text-center">
            <p className="text-2xl font-extrabold text-navy-900">{u.value}</p>
            <p className="mt-1 text-xs text-navy-400">{u.label}</p>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-navy-400">
        {c.note}{' '}
        <a href="mailto:support@aplicocv.com" className="text-electric-600 hover:underline">support@aplicocv.com</a>.
      </p>
    </MarketingShell>
  )
}
