import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useT } from '@/i18n/I18nProvider'
import { Footer } from '@/pages/landing/Footer'

/** Shared shell for public marketing/legal pages: header + hero band + footer. */
export function MarketingShell({
  eyebrow,
  title,
  subtitle,
  children,
  max = 'max-w-4xl',
  heroImage,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  max?: string
  /** Optional full-width hero background photo (rendered with a legibility scrim). */
  heroImage?: string
}) {
  const t = useT()
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost">{t.nav.signIn}</Button>
            </Link>
            <Link to="/register">
              <Button className="rounded-full">{t.nav.getStarted}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {heroImage ? (
          // Image hero: a contained, correctly-proportioned rounded photo so the
          // whole image shows (no thin full-bleed crop), with a bottom gradient
          // (inline style for reliable rendering) and the heading anchored low-left
          // so it never covers the subject's face wherever they sit in the frame.
          <section className="border-b border-navy-100 bg-white">
            <div className="mx-auto max-w-6xl px-6 pt-6 sm:pt-8">
              <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-navy-900/5">
                <div className="aspect-[16/10] w-full sm:aspect-[16/9]">
                  <img
                    src={heroImage}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover object-[center_35%]"
                  />
                </div>
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(2,6,23,0.88) 0%, rgba(2,6,23,0.45) 38%, rgba(2,6,23,0.06) 70%, rgba(2,6,23,0) 100%)',
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10 lg:p-12">
                  <div className="max-w-2xl">
                    {eyebrow && (
                      <p className="text-xs font-semibold uppercase tracking-widest text-electric-300 sm:text-sm">
                        {eyebrow}
                      </p>
                    )}
                    <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">{subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="relative overflow-hidden border-b border-navy-100 bg-navy-50/40">
            <div className="pointer-events-none absolute left-1/2 top-[-6rem] -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-electric-100/50 blur-[120px]" />
            <div className="mx-auto max-w-4xl px-6 py-16 text-center">
              {eyebrow && (
                <p className="text-sm font-semibold uppercase tracking-widest text-electric-600">{eyebrow}</p>
              )}
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">{title}</h1>
              {subtitle && <p className="mx-auto mt-4 max-w-2xl text-lg text-navy-500">{subtitle}</p>}
            </div>
          </section>
        )}

        <div className={`mx-auto ${max} px-6 py-14`}>{children}</div>
      </main>

      <Footer />
    </div>
  )
}

/** Simple titled content block used across the legal/marketing pages. */
export function MarketingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-bold text-navy-900">{title}</h2>
      <div className="mt-3 space-y-3 text-navy-600">{children}</div>
    </section>
  )
}

/** Turn any email addresses inside a localized string into mailto links. */
export function linkifyEmails(text: string): ReactNode[] {
  return text.split(/([\w.+-]+@[\w-]+\.[\w.-]+)/g).map((part, i) =>
    /@/.test(part) ? (
      <a key={i} href={`mailto:${part}`} className="text-electric-600 hover:underline">
        {part}
      </a>
    ) : (
      part
    ),
  )
}

interface LegalSection {
  title: string
  paras?: string[]
  bullets?: string[]
}

/** Renders a localized list of legal sections (paragraphs + bullet lists). */
export function LegalSections({ sections }: { sections: LegalSection[] }) {
  return (
    <>
      {sections.map((s) => (
        <MarketingSection key={s.title} title={s.title}>
          {s.paras?.map((p, i) => <p key={i}>{linkifyEmails(p)}</p>)}
          {s.bullets && (
            <ul className="list-disc space-y-2 pl-6">
              {s.bullets.map((b, i) => (
                <li key={i}>{linkifyEmails(b)}</li>
              ))}
            </ul>
          )}
        </MarketingSection>
      ))}
    </>
  )
}
