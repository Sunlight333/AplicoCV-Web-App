import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '@/i18n/I18nProvider'
import { localeMeta, type Locale } from '@/i18n/dictionaries'
import { FlagIcon } from '@/components/FlagIcon'
import { cn } from '@/lib/cn'

/**
 * Compact language picker. `variant="dark"` is for placement on dark surfaces
 * (e.g. the footer / auth panel); the default suits light backgrounds.
 */
export function LanguageSwitcher({
  variant = 'light',
  align = 'right',
}: {
  variant?: 'light' | 'dark'
  align?: 'left' | 'right'
}) {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const current = localeMeta[locale]
  const locales = Object.keys(localeMeta) as Locale[]

  const trigger =
    variant === 'dark'
      ? 'border-white/20 text-white/80 hover:bg-white/10'
      : 'border-navy-200 text-navy-600 hover:bg-navy-100'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-medium transition-colors',
          trigger,
        )}
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <FlagIcon locale={locale} />
        <span>{current.short}</span>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className={cn(
              'absolute z-50 mt-2 w-44 overflow-hidden rounded-xl border border-navy-100 bg-white p-1 shadow-card-hover',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {locales.map((l) => {
              const meta = localeMeta[l]
              const active = l === locale
              return (
                <li key={l}>
                  <button
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setLocale(l)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                      active ? 'bg-electric-50 font-semibold text-electric-700' : 'text-navy-600 hover:bg-navy-50',
                    )}
                  >
                    <FlagIcon locale={l} />
                    <span className="flex-1 text-left">{meta.label}</span>
                    {active && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
