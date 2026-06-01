import type { Locale } from '@/i18n/dictionaries'

/**
 * Inline SVG flags. Emoji flags (🇺🇸 etc.) don't render on Windows — it shows
 * the two-letter code instead — so we draw them as SVG for cross-platform parity.
 * Simplified but recognizable; sized via the `className` (defaults to a small chip).
 */
export function FlagIcon({ locale, className = 'h-4 w-5' }: { locale: Locale; className?: string }) {
  const common = 'inline-block overflow-hidden rounded-sm'
  switch (locale) {
    case 'en': // United States
      return (
        <svg viewBox="0 0 36 24" className={`${common} ${className}`} aria-hidden>
          <rect width="36" height="24" fill="#b22234" />
          {[1, 3, 5, 7, 9, 11].map((i) => (
            <rect key={i} y={(i * 24) / 13} width="36" height={24 / 13} fill="#fff" />
          ))}
          <rect width="16" height={(24 / 13) * 7} fill="#3c3b6e" />
        </svg>
      )
    case 'es': // Spain
      return (
        <svg viewBox="0 0 36 24" className={`${common} ${className}`} aria-hidden>
          <rect width="36" height="24" fill="#c60b1e" />
          <rect y="6" width="36" height="12" fill="#ffc400" />
        </svg>
      )
    case 'pt-BR': // Brazil
      return (
        <svg viewBox="0 0 36 24" className={`${common} ${className}`} aria-hidden>
          <rect width="36" height="24" fill="#009b3a" />
          <path d="M18 3 33 12 18 21 3 12Z" fill="#fedf00" />
          <circle cx="18" cy="12" r="5" fill="#002776" />
        </svg>
      )
  }
}
