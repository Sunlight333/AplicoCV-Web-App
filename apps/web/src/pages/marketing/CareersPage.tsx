import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const APPLY = 'mailto:careers@aplicocv.com?subject=Open%20application'

const PERKS = [
  { icon: '🌍', title: 'Remote-first', body: 'Work from anywhere across the Americas and Europe.' },
  { icon: '📈', title: 'Real ownership', body: 'Small team, big surface area — your work ships to users fast.' },
  { icon: '🧠', title: 'Learning budget', body: 'Courses, books and conferences to keep growing.' },
  { icon: '🌴', title: 'Flexible time off', body: 'Take the time you need to do your best work.' },
]

const ROLES = [
  { title: 'Senior Full-stack Engineer', team: 'Engineering', type: 'Remote · Full-time' },
  { title: 'Product Designer', team: 'Design', type: 'Remote · Full-time' },
  { title: 'Growth Marketer (LATAM)', team: 'Marketing', type: 'Remote · Contract' },
]

export default function CareersPage() {
  return (
    <MarketingShell
      eyebrow="Careers"
      title="Help millions apply with one click"
      subtitle="We’re a small, product-obsessed team building the fastest way to apply to jobs. Come build it with us."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PERKS.map((p) => (
          <Card key={p.title} className="p-5">
            <div className="text-2xl">{p.icon}</div>
            <h3 className="mt-2 font-semibold text-navy-900">{p.title}</h3>
            <p className="mt-1 text-sm text-navy-500">{p.body}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-bold text-navy-900">Open roles</h2>
      <div className="mt-4 space-y-3">
        {ROLES.map((r) => (
          <Card key={r.title} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-semibold text-navy-900">{r.title}</p>
              <p className="text-sm text-navy-500">{r.team} · {r.type}</p>
            </div>
            <a href={`mailto:careers@aplicocv.com?subject=${encodeURIComponent(r.title)}`}>
              <Button variant="secondary" className="rounded-full">Apply</Button>
            </a>
          </Card>
        ))}
      </div>

      <Card className="mt-8 flex flex-col items-center gap-2 p-8 text-center">
        <p className="font-semibold text-navy-900">Don’t see your role?</p>
        <p className="max-w-md text-sm text-navy-500">
          We’re always happy to meet talented people. Send us your CV and tell us how you’d make AplicoCV better.
        </p>
        <a href={APPLY} className="mt-2">
          <Button className="rounded-full">Send an open application</Button>
        </a>
      </Card>
    </MarketingShell>
  )
}
