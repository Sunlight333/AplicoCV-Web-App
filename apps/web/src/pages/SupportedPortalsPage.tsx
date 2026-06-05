import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useT } from '@/i18n/I18nProvider'

const FULL = [
  'LinkedIn', 'Workday', 'Indeed', 'Glassdoor', 'Greenhouse', 'Lever',
  'Get on Board', 'Computrabajo', 'Bumeran', 'Zonajobs', 'Laborum', 'Elempleo',
  'Trabajando.com', 'InfoJobs',
]

export default function SupportedPortalsPage() {
  const t = useT()
  const tp = t.app.more.portals
  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{tp.title}</h1>
      <p className="mt-1 max-w-2xl text-navy-500">{tp.subtitle}</p>

      <Card className="mt-6 p-6">
        <div className="flex items-center gap-2">
          <Badge tone="success">{tp.full}</Badge>
          <span className="text-sm text-navy-400">{FULL.length} portals</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {FULL.map((p) => (
            <div key={p} className="flex items-center gap-2.5 rounded-xl border border-navy-100 bg-white px-4 py-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white">
                {p[0]}
              </span>
              <span className="truncate text-sm font-medium text-navy-800">{p}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 flex items-start gap-3 p-6">
        <Badge tone="info">{tp.fallback}</Badge>
        <p className="text-sm text-navy-600">
          On any site not listed above, AplicoCV detects standard form fields (name, email, phone,
          experience, work authorization and more) and fills them automatically — so you’re covered
          on company career pages and niche boards too.
        </p>
      </Card>
    </PageTransition>
  )
}
