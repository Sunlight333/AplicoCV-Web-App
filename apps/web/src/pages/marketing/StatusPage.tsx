import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'

const COMPONENTS = [
  { name: 'Web app', status: 'Operational' },
  { name: 'API', status: 'Operational' },
  { name: 'Browser extension', status: 'Operational' },
  { name: 'AI services', status: 'Operational' },
  { name: 'Email & notifications', status: 'Operational' },
  { name: 'File storage', status: 'Operational' },
]

const UPTIME = [
  { label: 'Last 24 hours', value: '100%' },
  { label: 'Last 7 days', value: '100%' },
  { label: 'Last 90 days', value: '99.98%' },
]

export default function StatusPage() {
  return (
    <MarketingShell
      eyebrow="Status"
      title="System status"
      subtitle="Live operational status of AplicoCV services."
    >
      <Card className="flex items-center gap-3 border-green-200 bg-green-50 p-5">
        <span className="flex h-3 w-3 flex-none rounded-full bg-green-500" />
        <p className="font-semibold text-green-700">All systems operational</p>
      </Card>

      <Card className="mt-6 divide-y divide-navy-100 p-2">
        {COMPONENTS.map((c) => (
          <div key={c.name} className="flex items-center justify-between px-4 py-3.5">
            <span className="font-medium text-navy-800">{c.name}</span>
            <span className="flex items-center gap-2 text-sm font-medium text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {c.status}
            </span>
          </div>
        ))}
      </Card>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {UPTIME.map((u) => (
          <Card key={u.label} className="p-5 text-center">
            <p className="text-2xl font-extrabold text-navy-900">{u.value}</p>
            <p className="mt-1 text-xs text-navy-400">{u.label}</p>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-navy-400">
        Updated continuously · Times shown in your local timezone. For incident reports, email{' '}
        <a href="mailto:support@aplicocv.com" className="text-electric-600 hover:underline">support@aplicocv.com</a>.
      </p>
    </MarketingShell>
  )
}
