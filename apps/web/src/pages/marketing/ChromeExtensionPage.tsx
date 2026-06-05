import { Link } from 'react-router-dom'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const CHROME_STORE_URL = (import.meta.env.VITE_CHROME_STORE_URL as string | undefined) || ''
const STORE_READY = Boolean(CHROME_STORE_URL)

const STEPS = [
  { t: 'Open a job posting', d: 'Go to any application on a supported portal — LinkedIn, Workday, Indeed and more.' },
  { t: 'Click the AplicoCV icon', d: 'The popup detects the form and connects to your profile automatically.' },
  { t: 'Autofill & apply', d: 'Every field fills in seconds — optionally with a CV tailored to the role and a cover letter.' },
]

const PERKS = [
  { icon: '⚡', t: 'One-click autofill', d: 'Fill long forms instantly across 14+ portals.' },
  { icon: '🎯', t: 'Tailored on the fly', d: 'Toggle a CV tailored to the exact posting.' },
  { icon: '✍️', t: 'Cover letters inline', d: 'Generate and insert a focused letter without leaving the page.' },
  { icon: '🗂️', t: 'Auto-tracking', d: 'Every application is logged to your board automatically.' },
]

export default function ChromeExtensionPage() {
  return (
    <MarketingShell
      eyebrow="Chrome extension"
      title="The extension that applies for you"
      subtitle="AplicoCV for Chrome autofills job applications across every major portal — tailored to each role, in one click."
      max="max-w-5xl"
    >
      <div className="flex flex-col items-center gap-3">
        {STORE_READY ? (
          <a href={CHROME_STORE_URL} target="_blank" rel="noreferrer">
            <Button size="lg" className="rounded-full">Add to Chrome</Button>
          </a>
        ) : (
          <>
            <Button size="lg" className="rounded-full" disabled>Add to Chrome</Button>
            <Badge tone="neutral">Coming soon to the Chrome Web Store</Badge>
            <a href="/aplicocv-extension.zip" download className="text-sm font-semibold text-electric-600 hover:underline">
              Download the package for manual install →
            </a>
          </>
        )}
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PERKS.map((p) => (
          <Card key={p.t} className="p-5">
            <div className="text-2xl">{p.icon}</div>
            <h3 className="mt-2 font-semibold text-navy-900">{p.t}</h3>
            <p className="mt-1 text-sm text-navy-500">{p.d}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-14 text-center text-2xl font-bold text-navy-900">How it works</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Card key={s.t} className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient font-bold text-white">
              {i + 1}
            </div>
            <h3 className="mt-4 font-semibold text-navy-900">{s.t}</h3>
            <p className="mt-1.5 text-sm text-navy-500">{s.d}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-12 flex flex-col items-center gap-3 p-8 text-center">
        <p className="font-semibold text-navy-900">Ready to apply in one click?</p>
        <Link to="/register">
          <Button className="rounded-full">Create your free account</Button>
        </Link>
        <p className="text-xs text-navy-400">Works on Google Chrome · Free to start</p>
      </Card>
    </MarketingShell>
  )
}
