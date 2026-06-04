import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useT } from '@/i18n/I18nProvider'

const columnHrefs = {
  product: ['#features', '#how', '#pricing', '#'],
  company: ['#', '#', '#', '#'],
  resources: ['#', '#', '#faq', '#'],
  legal: ['/privacy', '#', '#', '#'],
} as const

const socials = [
  { label: 'X', d: 'M4 4l16 16M20 4L4 20' },
  { label: 'LinkedIn', d: 'M5 9v10M5 5v.01M10 19v-6a3 3 0 016 0v6' },
  { label: 'GitHub', d: 'M12 2a10 10 0 00-3 19.5c.5 0 .7-.2.7-.5v-2c-2.8.6-3.4-1.3-3.4-1.3-.5-1.1-1.1-1.4-1.1-1.4-.9-.6 0-.6 0-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1 2.9.8.1-.6.3-1 .6-1.3-2.2-.2-4.6-1.1-4.6-5a4 4 0 011-2.7c-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9 9 0 014.8 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6a4 4 0 011 2.7c0 3.9-2.3 4.8-4.6 5 .4.3.7.9.7 1.8v2.6c0 .3.2.6.7.5A10 10 0 0012 2z' },
]

export function Footer() {
  const t = useT()
  const columns = [
    { ...t.footer.columns.product, hrefs: columnHrefs.product },
    { ...t.footer.columns.company, hrefs: columnHrefs.company },
    { ...t.footer.columns.resources, hrefs: columnHrefs.resources },
    { ...t.footer.columns.legal, hrefs: columnHrefs.legal },
  ]

  return (
    <footer className="border-t border-navy-100 bg-navy-50/40">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          {/* Brand + newsletter */}
          <div>
            <Logo size="md" />
            <p className="mt-4 max-w-xs text-sm text-navy-500">{t.footer.tagline}</p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-5 flex max-w-xs items-center gap-2 rounded-full border border-navy-200 bg-white p-1 pl-4"
            >
              <input
                type="email"
                placeholder={t.footer.emailPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-navy-300"
              />
              <button className="rounded-full bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy-800">
                {t.footer.subscribe}
              </button>
            </form>
            <div className="mt-5">
              <LanguageSwitcher align="left" />
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-navy-900">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((label, i) => (
                  <li key={label}>
                    <a href={col.hrefs[i]} className="text-sm text-navy-500 transition-colors hover:text-electric-600">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-navy-100 pt-8 sm:flex-row">
          <p className="text-sm text-navy-400">{t.footer.rights}</p>
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-200 text-navy-500 transition-colors hover:border-electric-300 hover:text-electric-600"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.d} />
                </svg>
              </a>
            ))}
          </div>
          <Link to="/register" className="text-sm font-semibold text-electric-600 hover:underline">
            {t.footer.getStarted}
          </Link>
        </div>
      </div>
    </footer>
  )
}
