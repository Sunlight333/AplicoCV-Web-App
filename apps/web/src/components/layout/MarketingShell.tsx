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
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  max?: string
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
