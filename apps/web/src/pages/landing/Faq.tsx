import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Reveal } from '@/components/motion/Reveal'
import { useT } from '@/i18n/I18nProvider'

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-navy-100">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-medium text-navy-900">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-navy-200 text-navy-500"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-10 text-navy-500">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Faq() {
  const t = useT()
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <Reveal className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-electric-600">{t.faq.kicker}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{t.faq.title}</h2>
      </Reveal>
      <Reveal className="mt-12">
        <div>
          {t.faq.items.map((f) => (
            <Item key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </Reveal>
    </section>
  )
}
