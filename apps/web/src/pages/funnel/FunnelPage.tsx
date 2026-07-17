import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { currentLocale } from '@/lib/locale'
import { formatMoney } from '@/lib/money'
import { getPublicPricing } from '@/services/billing'
import { useQuery } from '@tanstack/react-query'
import { captureLead, previewMatches, type FunnelPreview } from '@/services/funnel'
import { useCountUp } from '@/hooks/useCountUp'
import {
  CHAPTER_LABEL,
  TERMINAL_KINDS,
  tr,
  type Choice,
  type Localized,
  type Step,
} from './funnelConfig'
import { COUNTRIES } from './countries'
import { useFunnel } from './useFunnel'

// Shared UI copy (buttons, labels) — kept beside the funnel like the rest of the
// app's feature-local copy.
const UI = {
  continue: L('Continue', 'Continuar', 'Continuar'),
  back: L('Back', 'Atrás', 'Voltar'),
  yes: L('Yes', 'Sí', 'Sim'),
  no: L('No', 'No', 'Não'),
  selectAll: L('Select all that apply', 'Elegí las que apliquen', 'Selecione as que se aplicam'),
  search: L('Search…', 'Buscar…', 'Buscar…'),
  min: L('Minimum', 'Mínimo', 'Mínimo'),
}
function L(en: string, es: string, pt: string): Localized {
  return { en, es, 'pt-BR': pt }
}

export default function FunnelPage() {
  const locale = currentLocale()
  const f = useFunnel()
  const { step } = f
  const isTerminal = TERMINAL_KINDS.has(step.kind)

  // The live-search preview is computed once (on the matching screen) and shared
  // with the success + paywall screens so the count is consistent across them.
  const [preview, setPreview] = useState<FunnelPreview | null>(null)

  return (
    <div className="paper-texture relative min-h-screen overflow-x-hidden">
      <div className="paper-sheen pointer-events-none fixed inset-0 -z-10" aria-hidden />

      {/* Top bar: back + progress. Hidden on the payoff screens so they feel like a
          destination, not another question. */}
      <header className="sticky top-0 z-20">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-5 py-4">
          {!isTerminal && !f.isFirst ? (
            <button
              onClick={f.back}
              aria-label={tr(UI.back, locale)}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-navy-500 transition-colors hover:bg-navy-900/[0.06]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <Link to="/" className="flex-none">
              <Logo size="sm" />
            </Link>
          )}
          {!isTerminal && <Progress chapter={step.chapter} value={f.progress} locale={locale} />}
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col px-5 pb-16 pt-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <StepView
              step={step}
              locale={locale}
              answers={f.answers}
              setAnswer={f.setAnswer}
              onNext={f.next}
              preview={preview}
              setPreview={setPreview}
            />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------ progress bar --- */

function Progress({ chapter, value, locale }: { chapter: Step['chapter']; value: number; locale: string }) {
  return (
    <div className="flex-1">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-steel-500">
          {tr(CHAPTER_LABEL[chapter], locale)}
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-steel-400">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-navy-900/[0.08] shadow-deboss">
        <motion.div
          className="h-full rounded-full bg-electric-500"
          animate={{ width: `${Math.max(4, value * 100)}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- step view --- */

interface ViewProps {
  step: Step
  locale: string
  answers: Record<string, unknown>
  setAnswer: (k: string, v: unknown) => void
  onNext: () => void
  preview: FunnelPreview | null
  setPreview: (p: FunnelPreview) => void
}

function StepView(props: ViewProps) {
  const { step } = props
  switch (step.kind) {
    case 'single':
      return <SingleSelect {...props} step={step} />
    case 'multi':
      return <MultiSelect {...props} step={step} />
    case 'affirm':
      return <AffirmCard {...props} step={step} />
    case 'slider':
      return <SalarySlider {...props} step={step} />
    case 'country':
      return <CountrySelect {...props} step={step} />
    case 'interstitial':
      return <Interstitial {...props} step={step} />
    case 'testimonial':
      return <Testimonial {...props} step={step} />
    case 'upload':
      return <CvUpload {...props} />
    case 'matching':
      return <Matching {...props} />
    case 'success':
      return <Success {...props} />
    case 'email':
      return <EmailCapture {...props} />
    case 'paywall':
      return <Paywall {...props} />
  }
}

/* --------------------------------------------------------------- questions --- */

function Question({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6 mt-2">
      <h1 className="font-display text-[1.7rem] font-medium leading-tight tracking-tight text-navy-900">
        {title}
      </h1>
      {sub && <p className="mt-2 text-[15px] text-steel-600">{sub}</p>}
    </div>
  )
}

function OptionRow({
  label,
  emoji,
  selected,
  onClick,
  multi,
}: {
  label: string
  emoji?: string
  selected: boolean
  onClick: () => void
  multi?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left ring-1 transition-all duration-150',
        'hover:-translate-y-px',
        selected
          ? 'shadow-emboss-card-hover ring-2 ring-electric-500'
          : 'shadow-emboss-card ring-navy-900/[0.05] hover:shadow-emboss-card-hover',
      )}
    >
      {emoji && <span className="text-xl leading-none">{emoji}</span>}
      <span className={cn('flex-1 text-[15px] font-medium', selected ? 'text-navy-900' : 'text-navy-700')}>
        {label}
      </span>
      <span
        className={cn(
          'flex h-6 w-6 flex-none items-center justify-center border transition-colors',
          multi ? 'rounded-md' : 'rounded-full',
          selected ? 'border-electric-500 bg-electric-500 text-white' : 'border-navy-200 bg-white',
        )}
      >
        {selected && (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  )
}

function SingleSelect({ step, locale, answers, setAnswer, onNext }: ViewProps & { step: Extract<Step, { kind: 'single' }> }) {
  const current = answers[step.saveTo] as string | undefined
  const choose = (opt: Choice) => {
    setAnswer(step.saveTo, opt.id)
    // Small beat so the selection is visible before sliding on.
    window.setTimeout(onNext, 240)
  }
  return (
    <div>
      <Question title={tr(step.question, locale)} sub={step.sub && tr(step.sub, locale)} />
      <div className="space-y-3">
        {step.options.map((opt) => (
          <OptionRow
            key={opt.id}
            label={tr(opt.label, locale)}
            emoji={opt.emoji}
            selected={current === opt.id}
            onClick={() => choose(opt)}
          />
        ))}
      </div>
    </div>
  )
}

function MultiSelect({ step, locale, answers, setAnswer, onNext }: ViewProps & { step: Extract<Step, { kind: 'multi' }> }) {
  const current = (answers[step.saveTo] as string[]) ?? []
  const toggle = (opt: Choice) => {
    const set = new Set(current)
    set.has(opt.id) ? set.delete(opt.id) : set.add(opt.id)
    setAnswer(step.saveTo, [...set])
  }
  const canContinue = current.length >= (step.min ?? 1)
  return (
    <div>
      <Question title={tr(step.question, locale)} sub={tr(step.sub ?? UI.selectAll, locale)} />
      <div className="space-y-3">
        {step.options.map((opt) => (
          <OptionRow
            key={opt.id}
            label={tr(opt.label, locale)}
            emoji={opt.emoji}
            selected={current.includes(opt.id)}
            onClick={() => toggle(opt)}
            multi
          />
        ))}
      </div>
      <ContinueBar disabled={!canContinue} onClick={onNext} locale={locale} />
    </div>
  )
}

function AffirmCard({ step, locale, setAnswer, onNext }: ViewProps & { step: Extract<Step, { kind: 'affirm' }> }) {
  const answer = (v: boolean) => {
    setAnswer(step.saveTo, v)
    window.setTimeout(onNext, 220)
  }
  return (
    <div className="flex min-h-[60vh] flex-col justify-center">
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-steel-500">
        {tr(L('Do you relate to this?', '¿Te identificás con esto?', 'Você se identifica com isto?'), locale)}
      </p>
      {/* The statement, set as a large quoted card struck onto the sheet. */}
      <div className="relative rounded-3xl bg-navy-900 px-7 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_24px_48px_-20px_rgba(11,20,38,0.5)]">
        <span className="absolute left-5 top-3 font-display text-5xl leading-none text-electric-400/60">“</span>
        <p className="font-display text-[1.45rem] font-medium leading-snug text-white">{tr(step.statement, locale)}</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => answer(false)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white py-4 font-semibold text-navy-700 shadow-emboss-card ring-1 ring-navy-900/[0.05] transition-all hover:-translate-y-px hover:shadow-emboss-card-hover"
        >
          <span className="text-lg">✕</span> {tr(UI.no, locale)}
        </button>
        <button
          onClick={() => answer(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-electric-500 py-4 font-semibold text-white shadow-emboss transition-all hover:-translate-y-px hover:shadow-emboss-hover"
        >
          <span className="text-lg">✓</span> {tr(UI.yes, locale)}
        </button>
      </div>
    </div>
  )
}

function SalarySlider({ step, locale, answers, setAnswer, onNext }: ViewProps & { step: Extract<Step, { kind: 'slider' }> }) {
  const stored = answers[step.saveTo] as number | undefined
  const [val, setVal] = useState<number>(stored ?? Math.round((step.min + step.max) / 4))
  useEffect(() => {
    setAnswer(step.saveTo, val)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [val])
  const pct = (val - step.min) / (step.max - step.min)
  // Decorative bell-ish distribution behind the slider.
  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => {
    const x = i / 27
    return 0.25 + Math.exp(-Math.pow((x - 0.42) * 3.1, 2)) * 0.75
  }), [])
  return (
    <div>
      <Question title={tr(step.question, locale)} />
      <div className="rounded-3xl bg-white p-6 shadow-emboss-card ring-1 ring-navy-900/[0.05]">
        {/* value */}
        <div className="mb-5 text-center">
          <span className="font-display text-4xl font-semibold text-navy-900 tabular-nums">
            {val.toLocaleString()}
          </span>
          <span className="ml-1 text-sm font-medium text-steel-500">{tr(step.unit, locale)}</span>
        </div>
        {/* histogram */}
        <div className="flex h-20 items-end gap-[3px]">
          {bars.map((h, i) => {
            const active = i / 27 <= pct
            return (
              <div
                key={i}
                className={cn('flex-1 rounded-t-sm transition-colors', active ? 'bg-electric-500' : 'bg-navy-900/[0.10]')}
                style={{ height: `${h * 100}%` }}
              />
            )
          })}
        </div>
        <input
          type="range"
          min={step.min}
          max={step.max}
          step={step.step}
          value={val}
          onChange={(e) => setVal(Number(e.target.value))}
          className="mt-4 w-full accent-electric-500"
          aria-label={tr(step.question, locale)}
        />
        <div className="mt-1 flex justify-between text-xs text-steel-400 tabular-nums">
          <span>{step.min.toLocaleString()}</span>
          <span>{step.max.toLocaleString()}+</span>
        </div>
      </div>
      <ContinueBar onClick={onNext} locale={locale} />
    </div>
  )
}

function CountrySelect({ step, locale, answers, setAnswer, onNext }: ViewProps & { step: Extract<Step, { kind: 'country' }> }) {
  const [q, setQ] = useState('')
  const current = answers[step.saveTo] as string | undefined
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(s)) : COUNTRIES
  }, [q])
  const choose = (code: string) => {
    setAnswer(step.saveTo, code)
    window.setTimeout(onNext, 220)
  }
  return (
    <div>
      <Question title={tr(step.question, locale)} sub={step.sub && tr(step.sub, locale)} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={tr(UI.search, locale)}
        className="mb-3 w-full rounded-2xl bg-steel-50 px-4 py-3 text-[15px] shadow-deboss outline-none ring-1 ring-inset ring-navy-900/[0.08] placeholder:text-navy-300 focus:ring-2 focus:ring-electric-400/40"
      />
      <div className="max-h-[52vh] space-y-2 overflow-y-auto pb-2">
        {filtered.map((c) => (
          <OptionRow key={c.code} label={c.name} emoji={c.flag} selected={current === c.code} onClick={() => choose(c.code)} />
        ))}
      </div>
    </div>
  )
}

function Interstitial({ step, locale, onNext }: ViewProps & { step: Extract<Step, { kind: 'interstitial' }> }) {
  return (
    <div className="flex min-h-[62vh] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-5xl shadow-emboss-card ring-1 ring-navy-900/[0.05]"
      >
        {step.emoji}
      </motion.div>
      {step.stat && (
        <p className="deboss-text mt-8 font-display text-6xl font-semibold leading-none">{tr(step.stat, locale)}</p>
      )}
      <h1 className={cn('font-display font-medium tracking-tight text-navy-900', step.stat ? 'mt-3 text-xl' : 'mt-8 text-[1.9rem] leading-tight')}>
        {tr(step.title, locale)}
      </h1>
      <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-steel-600">{tr(step.body, locale)}</p>
      <div className="mt-10 w-full">
        <Button size="lg" className="w-full rounded-full" onClick={onNext}>
          {tr(UI.continue, locale)}
        </Button>
      </div>
    </div>
  )
}

function Testimonial({ step, locale, onNext }: ViewProps & { step: Extract<Step, { kind: 'testimonial' }> }) {
  return (
    <div className="flex min-h-[62vh] flex-col items-center justify-center text-center">
      <div className="rounded-3xl bg-white p-8 shadow-emboss-card ring-1 ring-navy-900/[0.05]">
        <div className="mb-4 flex justify-center gap-1 text-amber-400">
          {['★', '★', '★', '★', '★'].map((s, i) => (
            <span key={i} className="text-xl">{s}</span>
          ))}
        </div>
        <p className="font-display text-[1.35rem] font-medium leading-snug text-navy-900">“{tr(step.quote, locale)}”</p>
        <p className="mt-5 text-sm font-semibold text-navy-900">{step.author}</p>
        <p className="text-xs text-steel-500">{tr(step.role, locale)}</p>
      </div>
      <div className="mt-10 w-full">
        <Button size="lg" className="w-full rounded-full" onClick={onNext}>
          {tr(UI.continue, locale)}
        </Button>
      </div>
    </div>
  )
}

function CvUpload({ locale, setAnswer, onNext }: ViewProps) {
  const [name, setName] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const onFile = (file?: File) => {
    if (!file) return
    setName(file.name)
    setAnswer('cvFileName', file.name)
    // We record that a CV was provided; the actual upload happens after the
    // account exists. Advance shortly after so the user sees the confirmation.
    window.setTimeout(onNext, 900)
  }
  return (
    <div className="flex min-h-[62vh] flex-col justify-center">
      <Question
        title={tr(L('Add your CV to sharpen your matches', 'Sumá tu CV para afinar tus coincidencias', 'Adicione seu CV para refinar suas combinações'), locale)}
        sub={tr(L('Even a rough or outdated CV noticeably improves your recommendations.', 'Incluso un CV en borrador o desactualizado mejora bastante tus recomendaciones.', 'Mesmo um CV rascunho ou desatualizado melhora bastante suas recomendações.'), locale)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-navy-200 bg-white/70 px-6 py-12 text-center transition-colors hover:border-electric-400 hover:bg-white"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-electric-50 text-2xl text-electric-600 shadow-emboss-card">
          {name ? '✓' : '📄'}
        </span>
        <span className="text-[15px] font-semibold text-navy-900">
          {name || tr(L('Upload your CV', 'Subí tu CV', 'Envie seu CV'), locale)}
        </span>
        <span className="text-xs text-steel-500">PDF · DOC · DOCX</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button onClick={onNext} className="mt-5 text-center text-sm font-medium text-steel-500 underline-offset-4 hover:text-navy-700 hover:underline">
        {tr(L('Continue without a CV', 'Continuar sin CV', 'Continuar sem CV'), locale)}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------ payoff screens --- */

const MATCH_CHECKS: Localized[] = [
  L('Categories & salary', 'Categorías y salario', 'Categorias e salário'),
  L('Experience level', 'Nivel de experiencia', 'Nível de experiência'),
  L('Work preferences', 'Preferencias de trabajo', 'Preferências de trabalho'),
  L('Location & remote', 'Ubicación y remoto', 'Localização e remoto'),
  L('Personal goals', 'Objetivos personales', 'Objetivos pessoais'),
]

function Matching({ locale, answers, onNext, setPreview }: ViewProps) {
  const [pct, setPct] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    // Kick off the real preview and animate a progress bar to ~95% while it runs,
    // then snap to 100% and move on. The count is stashed for the success screen.
    let raf = 0
    let cur = 0
    const tick = () => {
      cur = Math.min(95, cur + Math.random() * 3.2)
      setPct(cur)
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)

    previewMatches(answers).then((p) => {
      setPreview(p)
      window.cancelAnimationFrame(raf)
      setPct(100)
      window.setTimeout(onNext, 900)
    })
    return () => window.cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = Math.round(pct)
  const revealed = Math.floor((pct / 100) * MATCH_CHECKS.length)

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <ProgressRing value={pct} />
      <h1 className="mt-8 font-display text-2xl font-medium tracking-tight text-navy-900">
        {tr(L('Matching you to live jobs…', 'Buscando trabajos para vos…', 'Buscando vagas para você…'), locale)}
      </h1>
      <p className="mt-2 text-sm text-steel-500 tabular-nums">{shown}%</p>
      <ul className="mt-8 w-full max-w-xs space-y-2.5 text-left">
        {MATCH_CHECKS.map((c, i) => {
          const on = i < revealed
          return (
            <li key={i} className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-6 w-6 flex-none items-center justify-center rounded-full transition-colors',
                  on ? 'bg-green-500 text-white' : 'bg-navy-900/[0.08] text-transparent',
                )}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className={cn('text-[15px]', on ? 'font-medium text-navy-900' : 'text-steel-400')}>{tr(c, locale)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ProgressRing({ value }: { value: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f4" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#0a74f0"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.2s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-3xl font-semibold text-navy-900 tabular-nums">{Math.round(value)}</span>
      </div>
    </div>
  )
}

function Success({ locale, preview, onNext }: ViewProps) {
  const count = preview?.count ?? 0
  const n = useCountUp(count)
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="text-7xl"
      >
        🎉
      </motion.div>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-electric-600">
        {tr(L('Success', 'Éxito', 'Sucesso'), locale)}
      </p>
      <h1 className="mt-2 font-display text-[2rem] font-medium leading-tight tracking-tight text-navy-900">
        {tr(L('We found', 'Encontramos', 'Encontramos'), locale)}{' '}
        <span className="deboss-text">{Math.round(n).toLocaleString()}</span>{' '}
        {tr(L('jobs that match your profile', 'trabajos que coinciden con tu perfil', 'vagas que combinam com seu perfil'), locale)}
      </h1>
      <p className="mx-auto mt-4 max-w-sm text-[15px] text-steel-600">
        {tr(
          L(
            'Create your account to see them and start applying — with a CV tailored to each one.',
            'Creá tu cuenta para verlos y empezar a postular — con un CV adaptado a cada uno.',
            'Crie sua conta para vê-las e começar a se candidatar — com um currículo adaptado a cada uma.',
          ),
          locale,
        )}
      </p>
      <div className="mt-10 w-full">
        <Button size="lg" className="w-full rounded-full" onClick={onNext}>
          {tr(L('Continue', 'Continuar', 'Continuar'), locale)}
        </Button>
      </div>
    </div>
  )
}

function EmailCapture({ locale, answers, onNext }: ViewProps) {
  const [email, setEmail] = useState('')
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  const submit = () => {
    if (!valid) return
    captureLead(email, answers)
    try {
      localStorage.setItem('aplicocv.funnel.email', email)
    } catch {
      /* ignore */
    }
    onNext()
  }
  return (
    <div className="flex min-h-[66vh] flex-col justify-center">
      <div className="mb-6 flex justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-emboss-card ring-1 ring-navy-900/[0.05]">✉️</span>
      </div>
      <h1 className="text-center font-display text-[1.7rem] font-medium leading-tight tracking-tight text-navy-900">
        {tr(L('Where should we send your job matches?', '¿A qué email te enviamos tus coincidencias?', 'Para qual email enviamos suas vagas?'), locale)}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-center text-[15px] text-steel-600">
        {tr(
          L(
            'Enter your email to receive roles from our private recruiter network. We respect your privacy.',
            'Ingresá tu email para recibir ofertas de nuestra red privada de reclutadores. Respetamos tu privacidad.',
            'Informe seu email para receber vagas da nossa rede privada de recrutadores. Respeitamos sua privacidade.',
          ),
          locale,
        )}
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="you@email.com"
        className="mt-6 w-full rounded-2xl bg-steel-50 px-4 py-3.5 text-center text-[15px] shadow-deboss outline-none ring-1 ring-inset ring-navy-900/[0.08] placeholder:text-navy-300 focus:ring-2 focus:ring-electric-400/40"
      />
      <Button size="lg" className="mt-4 w-full rounded-full" disabled={!valid} onClick={submit}>
        {tr(L('Continue', 'Continuar', 'Continuar'), locale)}
      </Button>
    </div>
  )
}

/* ----------------------------------------------------------------- paywall --- */

interface PlanRow {
  id: string
  name: Localized
  price: number
  interval: 'week' | 'month'
  perDayDivisor: number
  popular?: boolean
}

function Paywall({ locale, preview }: ViewProps) {
  const navigate = useNavigate()
  const pricing = useQuery({ queryKey: ['public-pricing'], queryFn: getPublicPricing })
  const cur = pricing.data?.currency ?? 'USD'
  const weekly = pricing.data?.plans.find((p) => p.id === 'weekly')?.price ?? 9
  const monthly = pricing.data?.plans.find((p) => p.id === 'monthly')?.price ?? 17

  const plans: PlanRow[] = [
    { id: 'weekly', name: L('1 Week', '1 Semana', '1 Semana'), price: weekly, interval: 'week', perDayDivisor: 7 },
    { id: 'monthly', name: L('1 Month', '1 Mes', '1 Mês'), price: monthly, interval: 'month', perDayDivisor: 30, popular: true },
  ]
  const [chosen, setChosen] = useState('monthly')
  const [secs, setSecs] = useState(10 * 60)
  useEffect(() => {
    const t = window.setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => window.clearInterval(t)
  }, [])
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  const proceed = () => {
    try {
      localStorage.setItem('aplicocv.funnel.plan', chosen)
    } catch {
      /* ignore */
    }
    // Account first, then checkout — the funnel's answers + chosen plan are in
    // localStorage for the app to adopt after registration.
    navigate('/register')
  }

  const unlocks: Localized[] = [
    L('Hidden jobs across 20+ portals', 'Trabajos ocultos en 20+ portales', 'Vagas ocultas em 20+ portais'),
    L('A CV tailored to every job (ATS)', 'CV adaptado a cada empleo (ATS)', 'CV adaptado a cada vaga (ATS)'),
    L('One-click apply with auto-fill', 'Postulá en un clic con autocompletado', 'Candidate-se em um clique com preenchimento'),
    L('AI mock interviews & cover letters', 'Entrevistas con IA y cartas', 'Entrevistas com IA e cartas'),
  ]

  return (
    <div className="py-4">
      {/* countdown */}
      <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full bg-electric-50 px-4 py-1.5 text-sm font-semibold text-electric-700 ring-1 ring-electric-200">
        <span className="h-2 w-2 animate-pulse rounded-full bg-electric-500" />
        {tr(L('Your discount ends in', 'Tu descuento termina en', 'Seu desconto termina em'), locale)}{' '}
        <span className="tabular-nums">{mm}:{ss}</span>
      </div>

      <h1 className="text-center font-display text-[1.9rem] font-medium leading-tight tracking-tight text-navy-900">
        {tr(L('Choose your plan', 'Elegí tu plan', 'Escolha seu plano'), locale)}
      </h1>
      {preview && (
        <p className="mt-2 text-center text-[15px] text-steel-600">
          {tr(L('Unlock your', 'Desbloqueá tus', 'Desbloqueie suas'), locale)}{' '}
          <span className="font-semibold text-navy-900">{preview.count.toLocaleString()}</span>{' '}
          {tr(L('job matches', 'coincidencias', 'combinações'), locale)}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {plans.map((p) => {
          const perDay = p.price / p.perDayDivisor
          const on = chosen === p.id
          return (
            <button
              key={p.id}
              onClick={() => setChosen(p.id)}
              className={cn(
                'relative flex w-full items-center gap-4 rounded-2xl bg-white px-5 py-4 text-left ring-1 transition-all',
                on ? 'shadow-emboss-card-hover ring-2 ring-electric-500' : 'shadow-emboss-card ring-navy-900/[0.05]',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 flex-none items-center justify-center rounded-full border',
                  on ? 'border-electric-500 bg-electric-500 text-white' : 'border-navy-200',
                )}
              >
                {on && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-navy-900">{tr(p.name, locale)}</span>
                  {p.popular && (
                    <span className="rounded-full bg-electric-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      {tr(L('Most popular', 'Más popular', 'Mais popular'), locale)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-steel-500">
                  {formatMoney(p.price, cur, locale)} / {tr(p.interval === 'week' ? L('week', 'semana', 'semana') : L('month', 'mes', 'mês'), locale)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-semibold text-navy-900">{formatMoney(perDay, cur, locale)}</p>
                <p className="text-[11px] text-steel-400">{tr(L('per day', 'por día', 'por dia'), locale)}</p>
              </div>
            </button>
          )
        })}
      </div>

      <Button size="lg" className="mt-6 w-full rounded-full" onClick={proceed}>
        {tr(L('See my job matches', 'Ver mis coincidencias', 'Ver minhas vagas'), locale)}
      </Button>
      <p className="mt-3 text-center text-xs text-steel-500">
        {tr(L('Secure payment · Cancel anytime · 24/7 support', 'Pago seguro · Cancelá cuando quieras · Soporte 24/7', 'Pagamento seguro · Cancele quando quiser · Suporte 24/7'), locale)}
      </p>

      <div className="mt-8 rounded-2xl bg-white/70 p-5 shadow-emboss-card ring-1 ring-navy-900/[0.05]">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-steel-500">
          {tr(L('What you’ll unlock', 'Lo que desbloqueás', 'O que você desbloqueia'), locale)}
        </p>
        <ul className="space-y-2.5">
          {unlocks.map((u, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[15px] text-navy-700">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-electric-100 text-[11px] text-electric-600">✓</span>
              {tr(u, locale)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- shared bits --- */

function ContinueBar({ disabled, onClick, locale }: { disabled?: boolean; onClick: () => void; locale: string }) {
  return (
    <div className="sticky bottom-0 mt-6 -mx-5 bg-gradient-to-t from-[#f2f2f0] via-[#f2f2f0]/95 to-transparent px-5 pb-5 pt-4">
      <Button size="lg" className="w-full rounded-full" disabled={disabled} onClick={onClick}>
        {tr(UI.continue, locale)}
      </Button>
    </div>
  )
}
