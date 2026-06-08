import type { Locale } from '@/i18n/dictionaries'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { useCopy } from './useCopy'

interface StatusCopy {
  eyebrow: string; title: string; subtitle: string
  allOperational: string; operational: string; note: string
  components: string[]
  uptime: { label: string; value: string }[]
}

const COPY: Record<Locale, StatusCopy> = {
  en: {
    eyebrow: 'Status', title: 'System status', subtitle: 'Live operational status of AplicoCV services.',
    allOperational: 'All systems operational', operational: 'Operational',
    note: 'Updated continuously · Times shown in your local timezone. For incident reports, email',
    components: ['Web app', 'API', 'Browser extension', 'AI services', 'Email & notifications', 'File storage'],
    uptime: [
      { label: 'Last 24 hours', value: '100%' },
      { label: 'Last 7 days', value: '100%' },
      { label: 'Last 90 days', value: '99.98%' },
    ],
  },
  es: {
    eyebrow: 'Estado', title: 'Estado del sistema', subtitle: 'Estado operativo en vivo de los servicios de AplicoCV.',
    allOperational: 'Todos los sistemas operativos', operational: 'Operativo',
    note: 'Actualizado continuamente · Horas en tu zona horaria local. Para reportar incidentes, escribe a',
    components: ['Aplicación web', 'API', 'Extensión del navegador', 'Servicios de IA', 'Correo y notificaciones', 'Almacenamiento de archivos'],
    uptime: [
      { label: 'Últimas 24 horas', value: '100%' },
      { label: 'Últimos 7 días', value: '100%' },
      { label: 'Últimos 90 días', value: '99.98%' },
    ],
  },
  'pt-BR': {
    eyebrow: 'Status', title: 'Status do sistema', subtitle: 'Status operacional ao vivo dos serviços da AplicoCV.',
    allOperational: 'Todos os sistemas operacionais', operational: 'Operacional',
    note: 'Atualizado continuamente · Horários no seu fuso local. Para relatar incidentes, escreva para',
    components: ['Aplicativo web', 'API', 'Extensão do navegador', 'Serviços de IA', 'E-mail e notificações', 'Armazenamento de arquivos'],
    uptime: [
      { label: 'Últimas 24 horas', value: '100%' },
      { label: 'Últimos 7 dias', value: '100%' },
      { label: 'Últimos 90 dias', value: '99.98%' },
    ],
  },
}

export default function StatusPage() {
  const c = useCopy(COPY)
  return (
    <MarketingShell heroImage="/pages/status-uptime.png" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <Card className="flex items-center gap-3 border-green-200 bg-green-50 p-5">
        <span className="flex h-3 w-3 flex-none rounded-full bg-green-500" />
        <p className="font-semibold text-green-700">{c.allOperational}</p>
      </Card>

      <Card className="mt-6 divide-y divide-navy-100 p-2">
        {c.components.map((name) => (
          <div key={name} className="flex items-center justify-between px-4 py-3.5">
            <span className="font-medium text-navy-800">{name}</span>
            <span className="flex items-center gap-2 text-sm font-medium text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {c.operational}
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
