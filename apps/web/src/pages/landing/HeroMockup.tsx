import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useT } from '@/i18n/I18nProvider'

/**
 * The hero's product visual: a browser window showing a job-application form
 * that auto-fills field by field, with the AplicoCV widget driving it. This is
 * the product itself — far more on-brand than a decorative photo.
 */
export function HeroMockup() {
  const t = useT()
  const reduced = useReducedMotion()
  const fields = [
    { label: t.mockup.fields.name, value: 'Alex Morgan' },
    { label: t.mockup.fields.email, value: 'alex.morgan@email.com' },
    { label: t.mockup.fields.role, value: t.mockup.values.role },
    { label: t.mockup.fields.experience, value: t.mockup.values.experience },
    { label: t.mockup.fields.auth, value: t.mockup.values.auth },
  ]
  const [filled, setFilled] = useState(reduced ? fields.length : 0)
  const [pulse, setPulse] = useState(false)

  const fieldCount = fields.length
  useEffect(() => {
    if (reduced) return
    let active = true
    const run = async () => {
      while (active) {
        setFilled(0)
        setPulse(true)
        await wait(700)
        setPulse(false)
        for (let i = 1; i <= fieldCount; i++) {
          if (!active) return
          await wait(520)
          setFilled(i)
        }
        await wait(2600)
      }
    }
    void run()
    return () => {
      active = false
    }
  }, [reduced, fieldCount])

  return (
    <div className="relative">
      {/* Soft glow behind the window */}
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-gradient opacity-20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card-hover"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-navy-100 bg-navy-50/80 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <div className="ml-3 flex h-7 flex-1 items-center gap-2 rounded-md bg-white px-3 text-xs text-navy-400 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
            </svg>
            careers.acme.com/apply
          </div>
        </div>

        {/* Form body */}
        <div className="relative p-6">
          <p className="text-sm font-semibold text-navy-900">{t.mockup.title}</p>
          <p className="mt-0.5 text-xs text-navy-400">{t.mockup.subtitle}</p>

          <div className="mt-5 space-y-3.5">
            {fields.map((f, i) => {
              const done = i < filled
              return (
                <div key={f.label}>
                  <p className="mb-1 text-[11px] font-medium text-navy-400">{f.label}</p>
                  <div
                    className={`flex h-9 items-center rounded-lg border px-3 text-sm transition-colors duration-300 ${
                      done ? 'border-electric-200 bg-electric-50/60 text-navy-800' : 'border-navy-100 bg-navy-50 text-transparent'
                    }`}
                  >
                    <span className="truncate">{done ? f.value : '·'}</span>
                    {done && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                        viewBox="0 0 24 24"
                        className="ml-auto h-4 w-4 flex-none text-green-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Floating AplicoCV widget */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="absolute -bottom-5 -right-4 flex items-center gap-3 rounded-2xl border border-navy-100 bg-white p-3 pr-4 shadow-card-hover sm:-right-8"
      >
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white ${pulse ? 'animate-pulse' : ''}`}
        >
          <svg viewBox="0 0 32 32" className="h-6 w-6">
            <path d="M9 22 L16 9 L23 22" fill="none" stroke="white" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="22" r="1.8" fill="white" />
          </svg>
        </span>
        <div className="text-left">
          <p className="text-xs font-semibold text-navy-900">AplicoCV</p>
          <p className="text-[11px] text-navy-400">
            {filled >= fields.length ? t.mockup.done : t.mockup.filling(filled, fields.length)}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
