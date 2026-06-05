import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { useT } from '@/i18n/I18nProvider'

const STEPS: { title: string; body: string; to?: string; cta?: string }[] = [
  { title: 'Import your CV', body: 'Upload a PDF or DOCX once. Our AI structures your experience, skills and education into a profile you can reuse everywhere.', to: '/profile', cta: 'Go to profile' },
  { title: 'Complete your profile & earn credits', body: 'Add preferences, experience, skills and a few FAQ answers. Each completed section grants credits you spend on AI tools.', to: '/rewards', cta: 'See rewards' },
  { title: 'Optimize your CV for a role', body: 'Use Super-CV to rewrite your experience with the X-Y-Z formula and an ATS score, or generate a 100% personalized cover letter.', to: '/optimize', cta: 'Optimize CV' },
  { title: 'Practice with a mock interview', body: 'Get role-tailored questions and instant, specific feedback before the real thing.', to: '/interview', cta: 'Start interview' },
  { title: 'Install the browser extension', body: 'Add AplicoCV to Chrome to autofill applications across LinkedIn, Workday, Indeed and more — in one click.', to: '/install', cta: 'Install' },
  { title: 'Track every application', body: 'The extension records each application automatically; manage them on your board from applied to offer.', to: '/applications', cta: 'Open board' },
]

export default function GuidePage() {
  const t = useT()
  const tg = t.app.more.guide
  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{tg.title}</h1>
      <p className="mt-1 text-navy-500">{tg.subtitle}</p>

      <div className="mt-6 space-y-4">
        {STEPS.map((s, i) => (
          <Card key={i} className="flex items-start gap-4 p-5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
              {i + 1}
            </span>
            <div className="flex-1">
              <h2 className="font-semibold text-navy-900">{s.title}</h2>
              <p className="mt-1 text-sm text-navy-500">{s.body}</p>
              {s.to && s.cta && (
                <Link to={s.to} className="mt-2 inline-block text-sm font-medium text-electric-600 hover:underline">
                  {s.cta} →
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </PageTransition>
  )
}
