import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { AuroraBackground } from '@/components/motion/AuroraBackground'
import { useT } from '@/i18n/I18nProvider'

const avatars = ['avatar-01', 'avatar-03', 'avatar-02', 'avatar-05', 'avatar-04']

/** Split-card auth layout: animated aurora highlight panel + glass form card. */
export function AuthShell({
  title,
  subtitle,
  children,
  bgImage,
}: {
  title: string
  subtitle: string
  children: ReactNode
  /** Optional photographic backdrop for the brand panel. */
  bgImage?: string
}) {
  const t = useT()
  const highlights = t.auth.highlights
  return (
    <div className="relative grid min-h-screen overflow-hidden bg-white lg:grid-cols-2">
      {/* Ambient aurora bleeding behind the whole page on mobile */}
      <div className="pointer-events-none absolute inset-0 lg:hidden">
        {bgImage && (
          <img src={bgImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <AuroraBackground className="opacity-50" />
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>

      {/* Left: brand / highlight panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-12 text-white lg:flex"
      >
        {bgImage && (
          <motion.img
            src={bgImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
        {/* navy wash keeps the white copy readable over the photo */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/85 via-navy-900/70 to-navy-900/90" />
        <AuroraBackground className="opacity-40" />
        <div className="absolute inset-0 grid-pattern opacity-20" />

        <Link to="/" className="relative z-10">
          <Logo size="md" className="text-white" />
        </Link>

        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-bold leading-tight"
          >
            {t.auth.panelTitle}
          </motion.h2>
          <ul className="mt-8 space-y-4">
            {highlights.map((h, i) => (
              <motion.li
                key={h}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.12 }}
                className="flex items-center gap-3 text-navy-100"
              >
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-gradient text-xs shadow-glow">
                  ✓
                </span>
                {h}
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="flex -space-x-2">
            {avatars.map((a, i) => (
              <img
                key={a}
                src={`/avatars/${a}.png`}
                alt=""
                className="h-9 w-9 rounded-full border-2 border-navy-900 object-cover"
                style={{ zIndex: avatars.length - i }}
              />
            ))}
          </div>
          <p className="text-sm text-navy-300">{t.auth.trusted}</p>
        </motion.div>
      </motion.div>

      {/* Right: form */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex items-center justify-center p-6"
      >
        {/* Language switcher, top-right on every auth screen */}
        <div className="absolute right-5 top-5 z-20">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-sm rounded-2xl border border-white/60 bg-white/80 p-8 shadow-card-hover backdrop-blur-xl lg:border-navy-100 lg:bg-white">
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>
          <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
          <p className="mt-1 text-sm text-navy-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </motion.div>
    </div>
  )
}
