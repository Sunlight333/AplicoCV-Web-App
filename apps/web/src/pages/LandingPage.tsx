import { useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
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

/* --------------------------------------------------------- decorative bits --- */

/** Slowly rotating concentric gradient rings — an ambient depth accent. */
function RingAccent({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
    >
      <defs>
        <linearGradient id="ring-accent" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3392ff" /><stop offset="0.5" stopColor="#8f6cff" /><stop offset="1" stopColor="#1fbef0" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="70" stroke="url(#ring-accent)" strokeWidth="1.25" opacity="0.55" />
      <circle cx="200" cy="200" r="120" stroke="url(#ring-accent)" strokeWidth="1.25" opacity="0.4" strokeDasharray="2 8" />
      <circle cx="200" cy="200" r="175" stroke="url(#ring-accent)" strokeWidth="1.25" opacity="0.22" />
    </motion.svg>
  )
}

/** A frosted-glass pill that gently floats — used as a hero accent chip. */
function FloatingChip({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay },
      }}
      className={`flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3.5 py-2 text-sm font-semibold text-navy-800 shadow-card-hover backdrop-blur-md ${className}`}
    >
      {children}
    </motion.div>
  )
}

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
  const { scrollY } = useScroll()
  // Subtle parallax: background drifts slower than content as you scroll.
  const glowY = useTransform(scrollY, [0, 600], [0, 120])
  const artY = useTransform(scrollY, [0, 600], [0, -40])

  return (
    <section className="relative overflow-hidden pt-36 pb-28 sm:pt-44">
      {/* Ambient background: soft brand blobs + masked dotted grid */}
      <motion.div style={{ y: glowY }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-4rem] h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-electric-100/50 blur-[130px]" />
        <div className="absolute right-[8%] top-24 h-72 w-72 rounded-full bg-violet-100/60 blur-[110px]" />
        <div className="absolute left-[6%] top-40 h-64 w-64 rounded-full bg-cyan-100/50 blur-[110px]" />
        <div className="absolute inset-0 grid-pattern opacity-[0.45] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      </motion.div>

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.05fr_1fr]">
        {/* Left: copy */}
        <div className="text-center lg:text-left">
          <motion.a
            href="#features"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="group inline-flex items-center gap-2 rounded-full border border-navy-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-navy-600 shadow-sm backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-electric-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-electric-500" />
            </span>
            {t.hero.badge}
            <span className="text-navy-300 transition-transform group-hover:translate-x-0.5">→</span>
          </motion.a>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-6 text-[2.7rem] font-extrabold leading-[1.05] tracking-tight text-navy-900 sm:text-[4rem]"
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

          {/* Social proof: avatar cluster + note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-7 flex items-center justify-center gap-3 lg:justify-start"
          >
            <div className="flex -space-x-2.5">
              {['avatar-02', 'avatar-01', 'avatar-04', 'avatar-03', 'avatar-06'].map((a, i) => (
                <img
                  key={a}
                  src={`/avatars/${a}.png`}
                  alt=""
                  loading="lazy"
                  className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm"
                  style={{ zIndex: 5 - i }}
                />
              ))}
            </div>
            <p className="text-sm text-navy-400">{t.hero.note}</p>
          </motion.div>
        </div>

        {/* Right: hero art in an organic frame with floating accents */}
        <motion.div
          className="relative mx-auto w-full max-w-md lg:max-w-none lg:pl-6"
          style={{ y: artY }}
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* organic blob glow behind the subject */}
          <div className="pointer-events-none absolute inset-0 -z-10 mx-auto h-[88%] w-[88%] translate-y-6 rounded-[42%_58%_56%_44%/45%_42%_58%_55%] bg-brand-gradient opacity-25 blur-[70px]" />
          {/* rotating ring accent */}
          <RingAccent className="pointer-events-none absolute -right-12 -top-10 -z-10 h-72 w-72 opacity-70" />

          <motion.img
            src="/hero/hero-app.png"
            alt="AplicoCV rellenando una solicitud de empleo automáticamente"
            className="relative w-full drop-shadow-2xl"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            loading="eager"
          />

          {/* floating portal chips (brand names are language-neutral) */}
          <FloatingChip className="absolute left-0 top-10" delay={0.9}>
            <span className="h-2 w-2 rounded-full bg-green-400" /> LinkedIn
          </FloatingChip>
          <FloatingChip className="absolute -right-2 bottom-16" delay={1.3}>
            <span className="h-2 w-2 rounded-full bg-green-400" /> Workday
          </FloatingChip>
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
    <section id="how" className="relative mx-auto max-w-6xl px-6 py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-electric-600">{t.how.kicker}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-[2.6rem]">{t.how.title}</h2>
        <p className="mt-4 text-navy-500">{t.how.subtitle}</p>
      </Reveal>

      <RevealGroup className="relative mt-16 grid gap-6 md:grid-cols-3">
        {/* animated connecting line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute left-0 right-0 top-10 hidden h-px origin-left bg-gradient-to-r from-electric-200 via-violet-200 to-cyan-200 md:block"
        />
        {t.how.steps.map((s, i) => (
          <Reveal key={s.title}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative h-full rounded-2xl border border-navy-100 bg-white p-7 shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-lg font-bold text-white shadow-glow">
                {stepNumbers[i]}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-navy-900">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-navy-500">{s.body}</p>
            </motion.div>
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  )
}

function Features() {
  const t = useT()
  return (
    <section id="features" className="relative overflow-hidden py-28">
      {/* soft aurora backdrop (new asset) */}
      <img
        src="/backgrounds/section-aurora.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-white/30" />
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">{t.features.kicker}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-[2.6rem]">{t.features.title}</h2>
          <p className="mt-4 text-navy-500">{t.features.subtitle}</p>
        </Reveal>

        <RevealGroup className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((f, i) => (
            <Reveal key={f.title}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group relative h-full overflow-hidden rounded-2xl border border-navy-100 bg-white p-7 shadow-card transition-shadow hover:shadow-card-hover"
              >
                {/* hover glow wash */}
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-gradient opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-15" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-electric-50 to-violet-50">
                  <img
                    src={featureIcons[i]}
                    alt=""
                    className="h-14 w-14 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                    loading="lazy"
                  />
                </div>
                <h3 className="relative mt-5 text-lg font-semibold text-navy-900">{f.title}</h3>
                <p className="relative mt-1.5 text-sm leading-relaxed text-navy-500">{f.body}</p>
              </motion.div>
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
    <section className="mx-auto max-w-6xl px-6 py-28">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <Reveal direction="right">
          <div className="relative">
            {/* floating gradient ring frame around the card */}
            <div className="pointer-events-none absolute -inset-3 -z-10 rounded-[1.8rem] bg-brand-gradient opacity-15 blur-2xl" />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="overflow-hidden rounded-2xl border border-navy-100 bg-white/90 p-6 shadow-card-hover backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-navy-900">{t.showcase.cardTitle}</p>
                <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy-400">
                  Example
                </span>
              </div>
              <div className="mt-5 flex items-center gap-6">
                <Ring score={88} label={t.showcase.matchLabel} />
                <div className="flex-1 space-y-2.5">
                  {rows.map((row, idx) => (
                    <motion.div
                      key={row.k}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border border-navy-100 px-3 py-2 text-sm"
                    >
                      <span className="text-navy-700">{row.k}</span>
                      <span className={row.ok ? 'text-green-600' : 'text-amber-500'}>
                        {row.ok ? t.showcase.matched : t.showcase.addThis}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </Reveal>

        <Reveal direction="left">
          <div className="lg:pl-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-600">{t.showcase.kicker}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-[2.6rem]">{t.showcase.title}</h2>
            <p className="mt-4 text-navy-500">{t.showcase.body}</p>
            <ul className="mt-6 space-y-3">
              {t.showcase.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-navy-700">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-electric-100 text-[11px] text-electric-600">✓</span>
                  {b}
                </li>
              ))}
            </ul>
            <MagneticButton className="mt-8 inline-block" strength={0.35}>
              <Link to="/register">
                <Button className="rounded-full">{t.showcase.cta}</Button>
              </Link>
            </MagneticButton>
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
    <section className="relative overflow-hidden py-24">
      {/* immersive dark aurora background (new asset) */}
      <img
        src="/backgrounds/landing-hero-bg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-navy-900/55" />
      <div className="absolute inset-0 grid-pattern opacity-10" />
      <RevealGroup className="relative mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
        {t.stats.items.map((s, i) => (
          <Reveal key={s.label} className="text-center">
            <StatNumber value={statValues[i]} suffix={statSuffix[i]} />
            <p className="mt-1 text-sm text-navy-200">{s.label}</p>
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  )
}

function StatNumber({ value, suffix }: { value: number; suffix?: string }) {
  const n = useCountUp(value)
  return (
    <p className="text-4xl font-extrabold tracking-tight text-white tabular-nums drop-shadow sm:text-5xl">
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
    <section id="pricing" className="mx-auto max-w-5xl px-6 py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-600">{t.pricing.kicker}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-[2.6rem]">{t.pricing.title}</h2>
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
    <section className="px-6 pb-28">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-navy-900 px-8 py-16 text-center shadow-glow sm:px-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-electric-500/30 blur-[110px]"
            />
            <motion.div
              animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-violet-500/30 blur-[110px]"
            />
            <div className="absolute inset-0 grid-pattern opacity-10" />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">{t.finalCta.title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-navy-200">{t.finalCta.subtitle}</p>
            <MagneticButton className="mt-10" strength={0.45}>
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
