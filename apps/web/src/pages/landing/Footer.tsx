import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useToast } from '@/components/Toast'
import { useT } from '@/i18n/I18nProvider'

const CONTACT = 'mailto:support@aplicocv.com'

// Every link resolves to a real destination (anchor, route, or contact) — no dead "#".
const columnHrefs = {
  product: ['#features', '#how', '#pricing', '#features'],
  company: ['#how', '#features', CONTACT, CONTACT],
  resources: [CONTACT, '#features', '#faq', CONTACT],
  legal: ['/privacy', '/terms', '/privacy', '/privacy'],
} as const

export function Footer() {
  const t = useT()
  const { toast } = useToast()
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
              onSubmit={(e) => {
                e.preventDefault()
                const input = e.currentTarget.elements.namedItem('email') as HTMLInputElement | null
                if (input?.value) {
                  toast('Thanks! We’ll keep you posted.')
                  input.value = ''
                }
              }}
              className="mt-5 flex max-w-xs items-center gap-2 rounded-full border border-navy-200 bg-white p-1 pl-4"
            >
              <input
                name="email"
                type="email"
                required
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
          <a
            href={CONTACT}
            className="text-sm font-medium text-navy-500 transition-colors hover:text-electric-600"
          >
            support@aplicocv.com
          </a>
          <Link to="/register" className="text-sm font-semibold text-electric-600 hover:underline">
            {t.footer.getStarted}
          </Link>
        </div>
      </div>
    </footer>
  )
}
