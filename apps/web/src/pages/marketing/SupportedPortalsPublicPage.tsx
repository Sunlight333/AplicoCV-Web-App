import { Link } from 'react-router-dom'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const FULL = [
  'LinkedIn', 'Workday', 'Indeed', 'Glassdoor', 'Greenhouse', 'Lever',
  'Get on Board', 'Computrabajo', 'Bumeran', 'Zonajobs', 'Laborum', 'Elempleo',
  'Trabajando.com', 'InfoJobs', 'RemoteOK', 'We Work Remotely',
]

export default function SupportedPortalsPublicPage() {
  return (
    <MarketingShell
      eyebrow="Supported portals"
      title="Autofill works where you apply"
      subtitle="Built-in support for the major job portals — plus a smart fallback that fills standard fields everywhere else."
      max="max-w-5xl"
    >
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Badge tone="success">Full support</Badge>
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
        <Badge tone="info">Smart fallback</Badge>
        <p className="text-sm text-navy-600">
          On any site not listed above, AplicoCV detects standard form fields — name, email, phone, experience,
          work authorization and more — and fills them automatically, so you’re covered on company career pages
          and niche boards too.
        </p>
      </Card>

      <div className="mt-10 text-center">
        <Link to="/register">
          <Button size="lg" className="rounded-full">Try it on your next application</Button>
        </Link>
      </div>
    </MarketingShell>
  )
}
