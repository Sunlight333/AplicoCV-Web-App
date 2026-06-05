import { Link } from 'react-router-dom'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const VALUES = [
  { icon: '🎯', title: 'Honest by default', body: 'Our AI reframes your real experience — it never invents employers, titles or achievements.' },
  { icon: '⚡', title: 'Less busywork', body: 'Apply once, autofill everywhere. We remove the copy-paste so you can focus on the right roles.' },
  { icon: '🔒', title: 'Your data, your control', body: 'Profiles are encrypted, portal passwords never reach the browser, and you can delete everything anytime.' },
  { icon: '🌎', title: 'Built for LATAM and beyond', body: 'Spanish, Portuguese and English, with first-class support for the portals people actually use.' },
]

const STATS = [
  { v: '14+', l: 'Portals supported' },
  { v: '300+', l: 'Fields auto-mapped' },
  { v: '21h', l: 'Saved per search' },
  { v: '95%', l: 'Parse accuracy' },
]

export default function AboutPage() {
  return (
    <MarketingShell
      eyebrow="About us"
      title="We make applying to jobs take minutes, not hours"
      subtitle="AplicoCV turns one CV into tailored applications across every portal — with AI that stays truthful to who you are."
    >
      <div className="prose-navy space-y-4 text-navy-600">
        <p>
          Job hunting means filling the same form over and over: name, email, work history, “why do you want
          this role?” — on portal after portal. We started AplicoCV because that work is repetitive, slow, and
          completely automatable.
        </p>
        <p>
          Today AplicoCV structures your CV once, then autofills applications across LinkedIn, Workday, Indeed
          and a dozen more — tailoring your profile and generating cover letters per role, scoring your ATS fit
          before you apply, and even running mock interviews so you walk in prepared.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {VALUES.map((v) => (
          <Card key={v.title} className="p-6">
            <div className="text-2xl">{v.icon}</div>
            <h3 className="mt-3 font-semibold text-navy-900">{v.title}</h3>
            <p className="mt-1.5 text-sm text-navy-500">{v.body}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 rounded-2xl bg-navy-900 p-8 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.l} className="text-center">
            <p className="text-3xl font-extrabold text-white">{s.v}</p>
            <p className="mt-1 text-xs text-navy-300">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link to="/register">
          <Button size="lg" className="rounded-full">Start applying in one click</Button>
        </Link>
      </div>
    </MarketingShell>
  )
}
