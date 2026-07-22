import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { currentLocale } from '@/lib/locale'

// A fast language picker: type to filter, arrow-key + click to select, and still
// accepts free text (so an uncommon language a user types is never blocked). Names
// are resolved in the active UI locale via Intl.DisplayNames — no translation table
// to maintain — over a curated list of the languages job seekers actually list.

// ISO 639-1 codes, LATAM/global job-market first. Intl.DisplayNames turns each into
// a localized name ("en" -> English / Inglés / Inglês).
const LANG_CODES = [
  'es', 'en', 'pt', 'fr', 'de', 'it', 'nl', 'ca', 'gl', 'eu',
  'zh', 'ja', 'ko', 'ru', 'ar', 'hi', 'he', 'tr', 'el', 'pl',
  'sv', 'no', 'da', 'fi', 'cs', 'sk', 'hu', 'ro', 'uk', 'bg',
  'id', 'ms', 'vi', 'th', 'fa', 'ur', 'bn', 'ta', 'sw', 'af',
  'qu', 'gn', 'ht', 'tl',
]

const baseField =
  'w-full rounded-xl border bg-navy-50/50 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 shadow-[inset_0_1px_2px_rgba(11,20,38,0.05)] transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-400/60'

/** Fold case + accents so "ingl" matches "Inglés". */
const norm = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

interface Lang {
  code: string
  name: string
}

export function LanguageCombobox({
  label,
  value,
  onChange,
  placeholder,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const locale = currentLocale()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)

  // Localized, de-duplicated, alphabetically sorted language list for this locale.
  const langs = useMemo<Lang[]>(() => {
    let dn: Intl.DisplayNames | null = null
    try {
      dn = new Intl.DisplayNames([locale], { type: 'language' })
    } catch {
      dn = null
    }
    const seen = new Set<string>()
    const list: Lang[] = []
    for (const code of LANG_CODES) {
      const name = (dn?.of(code) || code).replace(/^\w/, (c) => c.toUpperCase())
      const key = norm(name)
      if (!seen.has(key)) {
        seen.add(key)
        list.push({ code, name })
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, locale))
  }, [locale])

  const matches = useMemo(() => {
    const q = norm(value)
    if (!q) return langs
    // Prefix matches first, then any substring — feels like real autocomplete.
    const starts = langs.filter((l) => norm(l.name).startsWith(q))
    const contains = langs.filter((l) => !norm(l.name).startsWith(q) && norm(l.name).includes(q))
    return [...starts, ...contains]
  }, [langs, value])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const pick = (name: string) => {
    onChange(name)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(matches.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter' && matches[active]) {
      e.preventDefault()
      pick(matches[active].name)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-1" ref={boxRef}>
      {label && <label className="text-sm font-medium text-navy-700">{label}</label>}
      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          autoComplete="off"
          className={cn(baseField, 'border-navy-200 pr-9')}
        />
        {/* chevron */}
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {open && matches.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-navy-200 bg-white py-1 shadow-elev-3">
            {matches.map((l, i) => (
              <li key={l.code}>
                <button
                  type="button"
                  // onMouseDown (not onClick) so the pick fires before the input blurs.
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pick(l.name)
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    'block w-full px-3.5 py-2 text-left text-sm',
                    i === active ? 'bg-electric-50 text-electric-700' : 'text-navy-800 hover:bg-navy-50',
                  )}
                >
                  {l.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
