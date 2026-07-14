import { useState } from 'react'
import { AtsRing } from '@/components/AtsRing'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/Toast'
import { currentLocale } from '@/lib/locale'
import {
  reviewCv,
  suggestAchievements,
  applyAchievements,
  type CvReview,
  type AchievementRole,
} from '@/services/ai'

const COPY = {
  en: {
    title: 'Analyze my CV',
    sub: 'A recruiter-grade review — what works, what a recruiter spots in seconds, and how to reach a 10.',
    analyze: 'Analyze my CV',
    analyzing: 'Reviewing…',
    strengths: 'Strengths',
    weaknesses: 'Spotted in 10 seconds',
    keywords: 'Add these ATS keywords',
    improve: 'How to reach a 10',
    offer: 'Want help identifying achievements for your roles?',
    getAchievements: 'Suggest achievements',
    loadingAch: 'Thinking…',
    pick: 'Pick the achievements that fit — you can edit them later in your profile.',
    apply: 'Add selected & re-score',
    applying: 'Applying…',
    done: (b: number, a: number) => `Added to your CV — ATS score ${b} → ${a}.`,
    none: 'Select at least one achievement.',
  },
  es: {
    title: 'Analizar mi CV',
    sub: 'Una revisión como la de un reclutador — qué funciona, qué se nota en segundos y cómo llegar a 10.',
    analyze: 'Analizar mi CV',
    analyzing: 'Revisando…',
    strengths: 'Fortalezas',
    weaknesses: 'Se nota en 10 segundos',
    keywords: 'Agrega estas palabras clave ATS',
    improve: 'Cómo llegar a un 10',
    offer: '¿Quieres ayuda para identificar logros en tus puestos?',
    getAchievements: 'Sugerir logros',
    loadingAch: 'Pensando…',
    pick: 'Elige los logros que apliquen — luego puedes editarlos en tu perfil.',
    apply: 'Agregar seleccionados y recalcular',
    applying: 'Aplicando…',
    done: (b: number, a: number) => `Agregados a tu CV — puntaje ATS ${b} → ${a}.`,
    none: 'Selecciona al menos un logro.',
  },
  'pt-BR': {
    title: 'Analisar meu currículo',
    sub: 'Uma análise de recrutador — o que funciona, o que se nota em segundos e como chegar a 10.',
    analyze: 'Analisar meu currículo',
    analyzing: 'Analisando…',
    strengths: 'Pontos fortes',
    weaknesses: 'Notado em 10 segundos',
    keywords: 'Adicione estas palavras-chave ATS',
    improve: 'Como chegar a um 10',
    offer: 'Quer ajuda para identificar conquistas nos seus cargos?',
    getAchievements: 'Sugerir conquistas',
    loadingAch: 'Pensando…',
    pick: 'Escolha as conquistas que se aplicam — depois você edita no seu perfil.',
    apply: 'Adicionar selecionadas e recalcular',
    applying: 'Aplicando…',
    done: (b: number, a: number) => `Adicionadas ao seu currículo — score ATS ${b} → ${a}.`,
    none: 'Selecione ao menos uma conquista.',
  },
} as const

export function CvReviewPanel() {
  const c = COPY[(currentLocale() as keyof typeof COPY)] ?? COPY.en
  const { toast } = useToast()
  const [review, setReview] = useState<CvReview | null>(null)
  const [roles, setRoles] = useState<AchievementRole[] | null>(null)
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<'' | 'review' | 'ach' | 'apply'>('')

  const runReview = async () => {
    setLoading('review')
    try {
      setReview(await reviewCv())
      setRoles(null)
    } finally {
      setLoading('')
    }
  }

  const getAch = async () => {
    setLoading('ach')
    try {
      setRoles(await suggestAchievements())
    } finally {
      setLoading('')
    }
  }

  const key = (roleId: string, i: number) => `${roleId}::${i}`

  const apply = async () => {
    const selections =
      roles?.flatMap((r) =>
        r.options.map((text, i) => ({ roleId: r.roleId, text, k: key(r.roleId, i) })),
      ).filter((s) => picked[s.k]).map(({ roleId, text }) => ({ roleId, text })) ?? []
    if (!selections.length) {
      toast(c.none)
      return
    }
    setLoading('apply')
    try {
      const res = await applyAchievements(selections)
      toast(c.done(res.atsBefore, res.atsAfter))
      setRoles(null)
      setPicked({})
      setReview((r) => (r ? { ...r, score: res.atsAfter } : r))
    } finally {
      setLoading('')
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-navy-900">{c.title}</h2>
      <p className="mt-1 text-sm text-navy-500">{c.sub}</p>

      {!review ? (
        <Button className="mt-4 rounded-full" loading={loading === 'review'} onClick={runReview}>
          {loading === 'review' ? c.analyzing : c.analyze}
        </Button>
      ) : (
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-5">
            <AtsRing score={review.score} size={104} stroke={10} />
            <p className="max-w-md text-navy-700">{review.verdict}</p>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Section title={c.strengths} items={review.strengths} tone="green" />
            <Section title={c.weaknesses} items={review.weaknesses} tone="amber" />
            {review.missingKeywords.length > 0 && (
              <Section title={c.keywords} items={review.missingKeywords} tone="violet" />
            )}
            <Section title={c.improve} items={review.toImprove} tone="blue" />
          </div>

          {/* Achievement builder */}
          {!roles ? (
            <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
              <p className="text-sm font-medium text-navy-800">{c.offer}</p>
              <Button className="mt-3 rounded-full" variant="secondary" loading={loading === 'ach'} onClick={getAch}>
                {loading === 'ach' ? c.loadingAch : c.getAchievements}
              </Button>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-sm text-navy-500">{c.pick}</p>
              <div className="mt-3 space-y-4">
                {roles.map((r) => (
                  <div key={r.roleId} className="rounded-xl border border-navy-100 p-4">
                    <p className="text-sm font-semibold text-navy-900">{r.title} · <span className="font-normal text-navy-500">{r.employer}</span></p>
                    <div className="mt-2 space-y-2">
                      {r.options.map((opt, i) => {
                        const k = key(r.roleId, i)
                        return (
                          <label key={k} className="flex cursor-pointer items-start gap-2.5 text-sm text-navy-700">
                            <input
                              type="checkbox"
                              checked={!!picked[k]}
                              onChange={(e) => setPicked((p) => ({ ...p, [k]: e.target.checked }))}
                              className="mt-0.5 h-4 w-4 flex-none rounded border-navy-300 text-electric-600 focus:ring-electric-400"
                            />
                            {opt}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-4 rounded-full" loading={loading === 'apply'} onClick={apply}>
                {loading === 'apply' ? c.applying : c.apply}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function Section({ title, items, tone }: { title: string; items: string[]; tone: 'green' | 'amber' | 'violet' | 'blue' }) {
  if (!items.length) return null
  const dot = { green: 'text-green-500', amber: 'text-amber-500', violet: 'text-violet-500', blue: 'text-electric-500' }[tone]
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-navy-600">
        {items.map((it) => (
          <li key={it} className="flex gap-2"><span className={dot}>›</span>{it}</li>
        ))}
      </ul>
    </div>
  )
}
