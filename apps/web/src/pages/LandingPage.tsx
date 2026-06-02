import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Reveal, RevealGroup } from '@/components/motion/Reveal'
import { MagneticButton } from '@/components/motion/MagneticButton'
import { Marquee } from '@/components/motion/Marquee'
import { ScrollProgress } from '@/components/motion/ScrollProgress'
import { Typewriter } from '@/components/motion/Typewriter'
import { useCountUp } from '@/hooks/useCountUp'
import { useT } from '@/i18n/I18nProvider'
import { Testimonials } from './landing/Testimonials'
import { Faq } from './landing/Faq'
import { Footer } from './landing/Footer'

/* ------------------------------------------------------------------ data --- */

const portals = [
  'LinkedIn', 'Workday', 'Indeed', 'Get on Board', 'Computrabajo', 'Glassdoor',
  'Zonajobs', 'Bumeran', 'Trabajando.com', 'Laborum', 'RemoteOK',
  'We Work Remotely', 'WeRemoto', 'Konzerta',
]

// 3D rendered feature icons (generated, brand-gradient). Order matches t.features.items.
const featureIcons = [
  '/features/autofill.png',
  '/features/tailoring.png',
  '/features/ats-score.png',
  '/features/cover-letter.png',
  '/features/tracking.png',
  '/features/job-agent.png',
]

const stepNumbers = ['01', '02', '03']
const statValues = [14, 300, 21, 95]
const statSuffix = ['', '+', 'h', '%']

/* --------------------------------------------------------------- sections --- */

function Nav() {
  const t = useT()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: t.nav.features, href: '#features' },
    { label: t.nav.how, href: '#how' },
    { label: t.nav.pricing, href: '#pricing' },
    { label: t.nav.faq, href: '#faq' },
  ]

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-3"
    >
      <div
        className={`mx-auto flex h-[72px] max-w-6xl items-center justify-between rounded-2xl px-5 transition-all duration-300 sm:px-6 ${
          scrolled ? 'border border-navy-100 bg-white/80 shadow-card backdrop-blur-xl' : 'border border-transparent'
        }`}
      >
        <Logo size="md" />
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-[15px] font-medium text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-900"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link to="/login" className="hidden sm:block">
            <Button variant="ghost">{t.nav.signIn}</Button>
          </Link>
          <MagneticButton>
            <Link to="/register">
              <Button className="rounded-full">{t.nav.getStarted}</Button>
            </Link>
          </MagneticButton>
        </div>
      </div>
    </motion.header>
  )
}

function Hero() {
  const t = useT()
  return (
    <section className="relative overflow-hidden pt-36 pb-24 sm:pt-44">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-electric-100/50 blur-[120px]" />
        <div className="absolute right-[12%] top-24 h-72 w-72 rounded-full bg-violet-100/50 blur-[100px]" />
        <div className="absolute inset-0 grid-pattern opacity-[0.4] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <motion.a
            href="#features"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-navy-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-600 shadow-sm"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-electric-500" />
            {t.hero.badge}
            <span className="text-navy-300">→</span>
          </motion.a>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-6 text-[2.6rem] font-extrabold leading-[1.08] tracking-tight text-navy-900 sm:text-6xl"
          >
            <span className="block">{t.hero.titleLead}</span>
            <span className="mt-1 block text-gradient">
              <Typewriter key={t.hero.rotating.join('|')} words={[...t.hero.rotating]} />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-navy-500 lg:mx-0"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
          >
            <MagneticButton strength={0.4}>
              <Link to="/register">
                <Button size="lg" className="rounded-full shadow-glow">{t.hero.ctaPrimary}</Button>
              </Link>
            </MagneticButton>
            <a href="#how">
              <Button size="lg" variant="ghost" className="rounded-full">
                {t.hero.ctaSecondary}
              </Button>
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-5 text-sm text-navy-400"
          >
            {t.hero.note}
          </motion.p>
        </div>

        <motion.div
          className="relative lg:pl-6"
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Soft brand glow behind the product shot */}
          <div className="pointer-events-none absolute inset-0 -z-10 mx-auto h-3/4 w-3/4 translate-y-6 rounded-full bg-brand-gradient opacity-20 blur-[90px]" />
          <motion.img
            src="/hero/hero-app.png"
            alt="AplicoCV rellenando una solicitud de empleo automáticamente"
            className="w-full drop-shadow-2xl"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </section>
  )
}

function LogoStrip() {
  const t = useT()
  return (
    <section className="border-y border-navy-100 bg-white py-10">
      <p className="mb-7 text-center text-xs font-semibold uppercase tracking-widest text-navy-400">
        {t.logoStrip.heading}
      </p>
      <Marquee durationSec={38}>
        {portals.map((p) => (
          <span key={p} className="whitespace-nowrap px-6 text-lg font-semibold text-navy-300">
            {p}
          </span>
        ))}
      </Marquee>
    </section>
  )
}

function HowItWorks() {
  const t = useT()
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-electric-600">{t.how.kicker}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{t.how.title}</h2>
        <p className="mt-4 text-navy-500">{t.how.subtitle}</p>
      </Reveal>

      <RevealGroup className="relative mt-16 grid gap-6 md:grid-cols-3">
        <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-navy-200 to-transparent md:block" />
        {t.how.steps.map((s, i) => (
          <Reveal key={s.title}>
            <div className="relative h-full rounded-2xl border border-navy-100 bg-white p-7 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-lg font-bold text-white shadow-glow">
                {stepNumbers[i]}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-navy-900">{s.title}</h3>
              <p className="mt-2 text-navy-500">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  )
}

function Features() {
  const t = useT()
  return (
    <section id="features" className="bg-navy-50/50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">{t.features.kicker}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{t.features.title}</h2>
          <p className="mt-4 text-navy-500">{t.features.subtitle}</p>
        </Reveal>

        <RevealGroup className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((f, i) => (
            <Reveal key={f.title}>
              <div className="group h-full rounded-2xl border border-navy-100 bg-white p-7 shadow-card transition-shadow hover:shadow-card-hover">
                <img
                  src={featureIcons[i]}
                  alt=""
                  className="h-16 w-16 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                <h3 className="mt-5 text-lg font-semibold text-navy-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

function Showcase() {
  const t = useT()
  const rows = [
    { k: 'React', ok: true },
    { k: 'TypeScript', ok: true },
    { k: 'GraphQL', ok: true },
    { k: 'Kubernetes', ok: false },
  ]
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal direction="right">
          <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white p-6 shadow-card-hover">
            <p className="text-sm font-semibold text-navy-900">{t.showcase.cardTitle}</p>
            <div className="mt-5 flex items-center gap-6">
              <Ring score={88} label={t.showcase.matchLabel} />
              <div className="flex-1 space-y-2.5">
                {rows.map((row) => (
                  <div key={row.k} className="flex items-center justify-between rounded-lg border border-navy-100 px-3 py-2 text-sm">
                    <span className="text-navy-700">{row.k}</span>
                    <span className={row.ok ? 'text-green-600' : 'text-amber-500'}>
                      {row.ok ? t.showcase.matched : t.showcase.addThis}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal direction="left">
          <div className="lg:pl-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-600">{t.showcase.kicker}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{t.showcase.title}</h2>
            <p className="mt-4 text-navy-500">{t.showcase.body}</p>
            <ul className="mt-6 space-y-3">
              {t.showcase.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-navy-700">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-electric-100 text-[11px] text-electric-600">✓</span>
                  {b}
                </li>
              ))}
            </ul>
            <Link to="/register" className="mt-8 inline-block">
              <Button className="rounded-full">{t.showcase.cta}</Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Ring({ score, label }: { score: number; label: string }) {
  const n = useCountUp(score)
  const r = 46
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-32 w-32 flex-none">
      <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e8ecf6" strokeWidth="10" />
        <motion.circle
          cx="55" cy="55" r={r} fill="none" stroke="url(#ring-grad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (score / 100) * c }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="110" y2="110" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3392ff" /><stop offset="0.5" stopColor="#8f6cff" /><stop offset="1" stopColor="#1fbef0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-navy-900 tabular-nums">{Math.round(n)}</span>
        <span className="text-[11px] text-navy-400">{label}</span>
      </div>
    </div>
  )
}

function StatBand() {
  const t = useT()
  return (
    <section className="bg-navy-900 py-20">
      <RevealGroup className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
        {t.stats.items.map((s, i) => (
          <Reveal key={s.label} className="text-center">
            <StatNumber value={statValues[i]} suffix={statSuffix[i]} />
            <p className="mt-1 text-sm text-navy-300">{s.label}</p>
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  )
}

function StatNumber({ value, suffix }: { value: number; suffix?: string }) {
  const n = useCountUp(value)
  return (
    <p className="text-4xl font-extrabold tracking-tight text-white tabular-nums sm:text-5xl">
      {Math.round(n)}
      <span className="text-gradient">{suffix}</span>
    </p>
  )
}

function Pricing() {
  const t = useT()
  const [annual, setAnnual] = useState(true)
  const premium = annual ? 7 : 9
  return (
    <section id="pricing" className="mx-auto max-w-5xl px-6 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-600">{t.pricing.kicker}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{t.pricing.title}</h2>
        <p className="mt-4 text-navy-500">{t.pricing.subtitle}</p>
      </Reveal>

      <Reveal className="mt-8 flex items-center justify-center gap-3 text-sm font-medium">
        <span className={annual ? 'text-navy-400' : 'text-navy-900'}>{t.pricing.monthly}</span>
        <button
          onClick={() => setAnnual((a) => !a)}
          className="relative h-7 w-12 rounded-full bg-brand-gradient"
          aria-label="Toggle billing period"
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
            style={{ left: annual ? 26 : 4 }}
          />
        </button>
        <span className={annual ? 'text-navy-900' : 'text-navy-400'}>
          {t.pricing.annual} <span className="text-electric-600">{t.pricing.annualSave}</span>
        </span>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
        <Reveal direction="right">
          <div className="flex h-full flex-col rounded-2xl border border-navy-100 bg-white p-8 shadow-card">
            <h3 className="font-semibold text-navy-900">{t.pricing.free.name}</h3>
            <p className="mt-3 text-5xl font-extrabold text-navy-900">$0</p>
            <p className="mt-1 text-sm text-navy-400">{t.pricing.forever}</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-navy-600">
              {t.pricing.free.features.map((f) => (
                <li key={f} className="flex gap-2"><Check /> {f}</li>
              ))}
            </ul>
            <Link to="/register" className="mt-8 block">
              <Button variant="secondary" className="w-full rounded-full">{t.pricing.free.cta}</Button>
            </Link>
          </div>
        </Reveal>

        <Reveal direction="left">
          <div className="gradient-ring relative flex h-full flex-col rounded-2xl bg-white p-8 shadow-glow">
            <span className="inline-flex w-fit rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white">
              {t.pricing.mostPopular}
            </span>
            <h3 className="mt-3 font-semibold text-navy-900">{t.pricing.premium.name}</h3>
            <p className="mt-3 text-5xl font-extrabold text-navy-900">
              ${premium}
              <span className="text-base font-medium text-navy-400">{t.pricing.perMonth}</span>
            </p>
            <p className="mt-1 text-sm text-navy-400">{annual ? t.pricing.billedAnnually : t.pricing.billedMonthly}</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-navy-600">
              {t.pricing.premium.features.map((f) => (
                <li key={f} className="flex gap-2"><Check /> {f}</li>
              ))}
            </ul>
            <MagneticButton className="mt-8 w-full">
              <Link to="/register" className="block">
                <Button className="w-full rounded-full">{t.pricing.premium.cta}</Button>
              </Link>
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Check() {
  return (
    <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-electric-100 text-[10px] text-electric-600">
      ✓
    </span>
  )
}

function FinalCta() {
  const t = useT()
  return (
    <section className="px-6 pb-24">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-navy-900 px-8 py-16 text-center sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-electric-500/30 blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-violet-500/30 blur-[100px]" />
            <div className="absolute inset-0 grid-pattern opacity-10" />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">{t.finalCta.title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-navy-200">{t.finalCta.subtitle}</p>
            <MagneticButton className="mt-9" strength={0.45}>
              <Link to="/register">
                <Button size="lg" className="rounded-full shadow-glow">{t.finalCta.cta}</Button>
              </Link>
            </MagneticButton>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* --------------------------------------------------------------- assembly --- */

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-white">
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <LogoStrip />
        <HowItWorks />
        <Features />
        <Showcase />
        <StatBand />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
