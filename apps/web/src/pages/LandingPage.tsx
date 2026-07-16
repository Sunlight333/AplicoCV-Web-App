import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { getPublicPricing } from '@/services/billing'
import { formatMoney } from '@/lib/money'
import { currentLocale } from '@/lib/locale'
import { Logo } from '@/components/Logo'
import { IntakeWidget } from '@/components/IntakeWidget'
import { Button } from '@/components/ui/Button'
import { IconTile } from '@/components/ui/IconTile'
import { type IconName } from '@/components/ui/Icon'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Reveal, RevealGroup } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
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

// Clean line icons in embossed metal tiles. Order matches t.features.items —
// CV tailoring leads and the autofill extension ('bolt') is last, as a bonus.
const featureIconNames: IconName[] = ['sparkles', 'ats', 'document', 'applications', 'rocket', 'bolt']
// One hue per feature so the grid reads as six distinct tools at a glance —
// a full spectrum, deliberately without purple. The bonus (autofill) sits in
// neutral steel-navy so it reads as the extra it now is.
const featureTones = ['brand', 'teal', 'emerald', 'amber', 'rose', 'navy'] as const

const stepNumbers = ['01', '02', '03']
const statValues = [14, 300, 21, 95]
const statSuffix = ['', '+', 'h', '%']

/* --------------------------------------------------------- decorative bits --- */

/** Slowly rotating concentric rings — an ambient depth accent, scribed into the
 *  sheet as hairlines rather than painted as a gradient. */
function RingAccent({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      aria-hidden
      animate={{ rotate: 360 }}
      transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
    >
      <circle cx="200" cy="200" r="70" stroke="#0b1426" strokeWidth="1" opacity="0.10" />
      <circle cx="200" cy="200" r="120" stroke="#0b1426" strokeWidth="1" opacity="0.08" strokeDasharray="2 8" />
      <circle cx="200" cy="200" r="175" stroke="#0b1426" strokeWidth="1" opacity="0.06" />
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

/**
 * Hero media: shows ONLY the vertical product video, in a portrait 9:16 frame.
 * It autoplays muted (the only way browsers allow autoplay), with an unmute button
 * so audio is available. It never loops — when it ends it holds on the final frame,
 * and a replay button appears. Clicking the video toggles play/pause.
 */
function HeroMedia() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = true
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false) // holds the last frame; no loop
    v.addEventListener('playing', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('ended', onEnded)
    v.play().catch(() => {}) // muted autoplay
    return () => {
      v.removeEventListener('playing', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('ended', onEnded)
    }
  }, [])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.ended) {
      v.currentTime = 0 // replay from the start
      v.play().catch(() => {})
    } else if (v.paused) {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    const next = !v.muted
    v.muted = next
    setMuted(next)
    if (!next && v.paused && !v.ended) v.play().catch(() => {}) // unmuting resumes
  }

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px]"
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Portrait 9:16 frame sized to the vertical video so nothing is cropped.
          Machined-metal bezel: a hairline highlight on the top edge, a dark cut
          below, and a deep cast shadow — the video sits in it like a screen in a
          milled case. */}
      <div
        className="relative w-full overflow-hidden rounded-[1.75rem] bg-black p-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_2px_rgba(11,20,38,0.10),0_28px_50px_-18px_rgba(11,20,38,0.45),0_60px_90px_-40px_rgba(11,20,38,0.35)] ring-1 ring-navy-900/10"
        style={{ aspectRatio: '720 / 1280' }}
      >
        <video
          ref={videoRef}
          src="/hero/hero-app.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          onClick={togglePlay}
          className="absolute inset-0 h-full w-full cursor-pointer object-cover"
        />

        {/* Sound toggle (audio is included; starts muted to allow autoplay) */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/65"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
            {muted ? (
              <path d="m16 9 5 5m0-5-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            ) : (
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            )}
          </svg>
        </button>

        {/* Center play / replay button — shown only while the video is paused or ended */}
        {!playing && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play video"
            className="group absolute inset-0 flex items-center justify-center"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/85 text-electric-600 shadow-elev-4 backdrop-blur transition-transform group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
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
          scrolled ? 'border border-white/60 bg-white/75 shadow-elev-2 backdrop-blur-xl' : 'border border-transparent'
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
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24">
      {/* The sheet is the background. No colour blobs, no mesh — just the paper and
          a whisper of grid that fades out, so the embossed type carries the page. */}
      <motion.div style={{ y: glowY }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-pattern opacity-[0.22] [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
      </motion.div>

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.05fr_1fr]">
        {/* Left: copy */}
        <div className="text-center lg:text-left">
          <motion.a
            href="#features"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="group inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-600 shadow-emboss-card backdrop-blur-md transition-colors hover:bg-white/80"
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
            className="mt-7 font-display text-[2.5rem] leading-[1.06] tracking-[-0.015em] sm:text-[3.5rem]"
          >
            {/* Lead line: regular weight, struck in metal. The old design shouted
                (extrabold 4rem); here the SERIF carries the voice, so the weight
                can drop and the line can breathe. */}
            <span className="emboss-text block font-medium">{t.hero.titleLead}</span>
            {/* Accent line: italic — the calligraphic note — debossed in blue and a
                touch larger, so the eye lands on the promise, not the setup. */}
            <span className="deboss-text mt-2 block font-semibold italic sm:text-[3.9rem]">
              <Typewriter key={t.hero.rotating.join('|')} words={[...t.hero.rotating]} />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mx-auto mt-6 max-w-xl text-[1.0625rem] leading-[1.7] text-steel-600 lg:mx-0"
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
                <Button size="lg" className="rounded-full">{t.hero.ctaPrimary}</Button>
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
          {/* Scribed ring accent — hairlines on the sheet, no colour wash. */}
          <RingAccent className="pointer-events-none absolute -right-12 -top-10 -z-10 h-72 w-72" />

          {/* The product video is the hero: it shows the platform doing the work
              (adapting the CV, letters, interview prep) in a few seconds. The
              interactive intake still lets visitors act — it now lives in its own
              "try it free" section right below the fold (see <TryItFree />). */}
          <HeroMedia />

          {/* floating portal chips (brand names are language-neutral) */}
          <FloatingChip className="absolute -left-3 top-8" delay={0.9}>
            <span className="h-2 w-2 rounded-full bg-green-400" /> LinkedIn
          </FloatingChip>
          <FloatingChip className="absolute -right-3 bottom-10" delay={1.3}>
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
    // No hard border band: two hairlines that fade at the edges, so the strip is
    // scribed into the sheet instead of stacked on it as another slab. The marquee
    // also fades out at both ends rather than being clipped mid-word.
    <section className="relative py-14">
      <div className="rule-fade absolute inset-x-0 top-0" />
      <p className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-steel-500">
        {t.logoStrip.heading}
      </p>
      <div className="[mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <Marquee durationSec={38}>
          {portals.map((p) => (
            <span key={p} className="whitespace-nowrap px-7 text-lg font-medium text-steel-400">
              {p}
            </span>
          ))}
        </Marquee>
      </div>
      <div className="rule-fade absolute inset-x-0 bottom-0" />
    </section>
  )
}

/**
 * "Try it free" — the interactive intake (paste CV → instant ATS score + matching
 * roles). It was the hero in Enfoque 2.0; now the product video leads and this sits
 * right below the fold, so visitors can still act on the first screen without the
 * form competing with the video for attention. The widget carries its own copy.
 */
function TryItFree() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mx-auto max-w-xl">
        <IntakeWidget />
      </Reveal>
    </section>
  )
}

function HowItWorks() {
  const t = useT()
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-6 py-32">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-electric-600">{t.how.kicker}</p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-navy-900 sm:text-[2.6rem]">{t.how.title}</h2>
        <p className="mt-4 text-navy-500">{t.how.subtitle}</p>
      </Reveal>

      <RevealGroup className="relative mt-16 grid gap-6 md:grid-cols-3">
        {/* animated connecting line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="rule-fade absolute left-0 right-0 top-10 hidden origin-left md:block"
        />
        {t.how.steps.map((s, i) => (
          <Reveal key={s.title}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative h-full rounded-2xl border border-navy-100/70 bg-white p-7 shadow-elev-2"
            >
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 font-display text-lg font-semibold text-white shadow-emboss">
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
    <section id="features" className="relative overflow-hidden py-36">
      {/* Aurora backdrop, kept — but the source asset is lavender, which the brief
          rules out. Rather than drop the artwork, we strip its colour and re-tint it
          with the brand blue: grayscale + a `color` blend keeps every wisp and fold
          of the original while guaranteeing no purple. (A plain hue-rotate was tried
          and rejected — it dragged the image's blues into green.) */}
      <img
        src="/backgrounds/section-aurora.png"
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover [filter:grayscale(1)]"
      />
      <div className="absolute inset-0 bg-electric-500 opacity-[0.55] [mix-blend-mode:color]" />
      {/* Washed back so the paper still reads through and the embossed cards keep
          their contrast — the aurora is atmosphere, not the subject. */}
      <div className="absolute inset-0 bg-[#f2f2f0]/50" />
      <div className="rule-fade absolute inset-x-0 top-0" />
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-600">{t.features.kicker}</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-navy-900 sm:text-[2.6rem]">{t.features.title}</h2>
          <p className="mt-4 text-navy-500">{t.features.subtitle}</p>
        </Reveal>

        <RevealGroup className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((f, i) => (
            <Reveal key={f.title}>
              <TiltCard className="group relative h-full overflow-hidden rounded-2xl bg-white/90 p-7 ring-1 ring-navy-900/[0.05] shadow-emboss-card backdrop-blur-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-emboss-card-hover">
                <IconTile
                  name={featureIconNames[i]}
                  size="lg"
                  tone={featureTones[i]}
                  className="transition-transform duration-300 group-hover:-rotate-3"
                />
                <h3 className="relative mt-5 text-lg font-semibold text-navy-900">{f.title}</h3>
                <p className="relative mt-1.5 text-sm leading-relaxed text-navy-500">{f.body}</p>
              </TiltCard>
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
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <Reveal direction="right">
          <div className="relative">
            {/* floating gradient ring frame around the card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="overflow-hidden rounded-2xl border border-navy-100 bg-white/90 p-6 shadow-card-hover backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-navy-900">{t.showcase.cardTitle}</p>
                <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy-400">
                  {t.showcase.example}
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
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-navy-900 sm:text-[2.6rem]">{t.showcase.title}</h2>
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

const toolkitIconNames: IconName[] = ['optimize', 'ats', 'interview', 'document', 'star', 'gift']

function Toolkit() {
  const t = useT()
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-electric-600">{t.toolkit.kicker}</p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-navy-900 sm:text-[2.6rem]">{t.toolkit.title}</h2>
        <p className="mt-4 text-navy-500">{t.toolkit.subtitle}</p>
      </Reveal>

      <RevealGroup className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {t.toolkit.items.map((item, i) => (
          <Reveal key={item.title}>
            <TiltCard className="h-full rounded-2xl border border-navy-100/70 bg-white p-7 shadow-emboss-card transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-emboss-card-hover">
              <IconTile name={toolkitIconNames[i]} size="lg" />
              <h3 className="mt-5 text-lg font-semibold text-navy-900">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{item.body}</p>
            </TiltCard>
          </Reveal>
        ))}
      </RevealGroup>
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
          cx="55" cy="55" r={r} fill="none" stroke="#0a74f0" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (score / 100) * c }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
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
    // A slab of dark metal set into the sheet, lit by the blue "digital horizon"
    // render. Kept on a navy base so the band stays solid if the image is slow, and
    // the inset hairlines read as the cut where the slab meets the paper.
    <section className="relative overflow-hidden bg-navy-900 py-24 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_-1px_0_rgba(255,255,255,0.06)]">
      <img
        src="/backgrounds/landing-hero-bg.png"
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-navy-900/55" />
      <div className="absolute inset-0 grid-pattern opacity-[0.07]" />
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
      <span className="text-electric-400">{suffix}</span>
    </p>
  )
}

function Pricing() {
  const t = useT()
  // Live prices in USD from the public catalogue (weekly / monthly subscription).
  const pricing = useQuery({ queryKey: ['public-pricing'], queryFn: getPublicPricing })
  const cur = pricing.data?.currency ?? 'USD'
  const loc = currentLocale()
  const weekly = pricing.data?.plans.find((p) => p.id === 'weekly')?.price ?? 9
  const monthly = pricing.data?.plans.find((p) => p.id === 'monthly')?.price ?? 17
  const features = t.pricing.premium.features
  return (
    <section id="pricing" className="mx-auto max-w-5xl px-6 py-36">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-600">{t.pricing.kicker}</p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-navy-900 sm:text-[2.6rem]">{t.pricing.title}</h2>
        <p className="mt-4 text-navy-500">{t.pricing.subtitle}</p>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
        <Reveal direction="right">
          <div className="flex h-full flex-col rounded-2xl border border-navy-100/70 bg-white p-8 shadow-elev-2">
            <h3 className="font-semibold text-navy-900">Weekly</h3>
            <p className="mt-3 text-5xl font-extrabold text-navy-900">
              {formatMoney(weekly, cur, loc)}
              <span className="text-base font-medium text-navy-400">{t.pricing.perWeek}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-navy-600">
              {features.map((f) => (
                <li key={f} className="flex gap-2"><Check /> {f}</li>
              ))}
            </ul>
            <Link to="/register" className="mt-8 block">
              <Button variant="secondary" className="w-full rounded-full">{t.pricing.premium.cta}</Button>
            </Link>
          </div>
        </Reveal>

        <Reveal direction="left">
          <div className="relative flex h-full flex-col rounded-2xl bg-white p-8 shadow-emboss-card-hover ring-1 ring-electric-500/25">
            <span className="inline-flex w-fit rounded-full bg-electric-500 px-3 py-1 text-xs font-semibold text-white shadow-emboss">
              {t.pricing.mostPopular}
            </span>
            <h3 className="mt-3 font-semibold text-navy-900">Monthly</h3>
            <p className="mt-3 text-5xl font-extrabold text-navy-900">
              {formatMoney(monthly, cur, loc)}
              <span className="text-base font-medium text-navy-400">{t.pricing.perMonth}</span>
            </p>
            <p className="mt-1 text-sm text-navy-400">{t.pricing.billedMonthly}</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-navy-600">
              {features.map((f) => (
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
    <section className="px-6 pb-32 pt-8">
      <Reveal>
        {/* A single machined slab of dark metal pressed onto the sheet: one solid
            fill, a hairline top highlight, and a deep cast shadow. */}
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-navy-900 px-8 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_30px_60px_-24px_rgba(11,20,38,0.55)] sm:px-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 grid-pattern opacity-[0.07]" />
          </div>
          <div className="relative">
            <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-[2.9rem]">
              {t.finalCta.title}
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-navy-200">{t.finalCta.subtitle}</p>
            <MagneticButton className="mt-10" strength={0.45}>
              <Link to="/register">
                <Button size="lg" className="rounded-full">{t.finalCta.cta}</Button>
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
    // Grayish-white paper sheet. The white cards/sections above it read as floating
    // on paper; the sheen adds a soft light wash so the sheet isn't flat.
    <div className="paper-texture relative overflow-x-hidden">
      <div className="paper-sheen pointer-events-none fixed inset-0 -z-10" aria-hidden />
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <TryItFree />
        <LogoStrip />
        <HowItWorks />
        <Features />
        <Toolkit />
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
