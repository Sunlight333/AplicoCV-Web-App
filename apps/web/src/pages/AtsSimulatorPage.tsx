import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/Toast'
import { useT } from '@/i18n/I18nProvider'
import { scoreAts } from '@/services/dashboard'
import { simulateAts, type AtsSimulation } from '@/services/ai'
import { ApiError } from '@/lib/apiClient'
import { useCopy } from '@/i18n/useCopy'
import type { Locale } from '@/i18n/dictionaries'
import type { AtsAnalysis } from '@/types'

interface DeepCopy {
  matched: (m: number, t: number) => string
  deepTitle: string; deepSub: string; deepRun: string; deepError: string
  parseScore: string; detected: string; dropped: string; format: string; invisible: string
}

const AC: Record<Locale, DeepCopy> = {
  en: {
    matched: (m, t) => `${m}/${t} keywords matched`,
    deepTitle: 'Deep ATS scan of your CV', deepSub: 'How an ATS actually parses your profile — parse score, sections it reads or drops, and invisible errors.',
    deepRun: '✦ Run deep scan (15 credits)', deepError: 'Could not run the scan',
    parseScore: 'Parse score', detected: 'Sections detected', dropped: 'Likely dropped', format: 'Formatting issues', invisible: 'Invisible errors',
  },
  es: {
    matched: (m, t) => `${m}/${t} palabras clave coincidentes`,
    deepTitle: 'Escaneo ATS profundo de tu CV', deepSub: 'Cómo un ATS analiza tu perfil — puntuación de lectura, secciones que lee o descarta y errores invisibles.',
    deepRun: '✦ Escaneo profundo (15 créditos)', deepError: 'No se pudo ejecutar el escaneo',
    parseScore: 'Puntuación de lectura', detected: 'Secciones detectadas', dropped: 'Posiblemente descartadas', format: 'Problemas de formato', invisible: 'Errores invisibles',
  },
  'pt-BR': {
    matched: (m, t) => `${m}/${t} palavras-chave correspondentes`,
    deepTitle: 'Varredura ATS profunda do seu currículo', deepSub: 'Como um ATS analisa seu perfil — pontuação de leitura, seções lidas ou descartadas e erros invisíveis.',
    deepRun: '✦ Varredura profunda (15 créditos)', deepError: 'Não foi possível executar a varredura',
    parseScore: 'Pontuação de leitura', detected: 'Seções detectadas', dropped: 'Possivelmente descartadas', format: 'Problemas de formatação', invisible: 'Erros invisíveis',
  },
}

export default function AtsSimulatorPage() {
  const { toast } = useToast()
  const t = useT()
  const ta = t.app.more.ats
  const ac = useCopy(AC)
  const [jd, setJd] = useState('')
  const [result, setResult] = useState<AtsAnalysis | null>(null)

  const m = useMutation({
    mutationFn: () => scoreAts(jd.trim()),
    onSuccess: setResult,
    onError: () => toast(t.app.aiTools.error, 'error'),
  })

  const [sim, setSim] = useState<AtsSimulation | null>(null)
  const deep = useMutation({
    mutationFn: simulateAts,
    onSuccess: setSim,
    onError: (e) => toast(e instanceof ApiError ? e.message : ac.deepError, 'error'),
  })

  const total = result ? result.matchedKeywords.length + result.missingKeywords.length : 0
  const coverage = total ? Math.round((result!.matchedKeywords.length / total) * 100) : 0

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{ta.title}</h1>
      <p className="mt-1 text-navy-500">{ta.subtitle}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <TextArea
            label={ta.jd}
            rows={14}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder={t.app.aiTools.jdPlaceholder}
          />
          <Button className="mt-4 rounded-full" loading={m.isPending} disabled={!jd.trim()} onClick={() => m.mutate()}>
            {ta.run}
          </Button>
        </Card>

        <Card className="p-6">
          {!result ? (
            <div className="flex h-full min-h-[18rem] items-center justify-center text-center text-sm text-navy-400">
              {ta.empty}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-navy-400">{ta.coverage}</p>
                  <p className="text-3xl font-bold text-navy-900">{result.matchScore}%</p>
                </div>
                <Badge tone={result.qualification === 'strong match' ? 'success' : 'warning'}>
                  {result.qualification}
                </Badge>
              </div>

              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-navy-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-electric-400 to-violet-500"
                  style={{ width: `${coverage}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-navy-400">{ac.matched(result.matchedKeywords.length, total)}</p>

              <div className="mt-5">
                <p className="text-sm font-semibold text-navy-700">{ta.matched}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.matchedKeywords.length ? (
                    result.matchedKeywords.map((k) => <Badge key={k} tone="success">{k}</Badge>)
                  ) : (
                    <span className="text-xs text-navy-400">—</span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-navy-700">{ta.missing}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.missingKeywords.length ? (
                    result.missingKeywords.map((k) => <Badge key={k} tone="warning">{k}</Badge>)
                  ) : (
                    <span className="text-xs text-navy-400">—</span>
                  )}
                </div>
              </div>

              {result.recommendations.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-navy-700">{ta.tips}</p>
                  <ul className="mt-2 space-y-1.5">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-navy-600">
                        <span className="text-electric-500">→</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Deep ATS parse scan — profile-based, no JD needed (Phase 2.3) */}
      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">{ac.deepTitle}</h2>
            <p className="mt-1 text-sm text-navy-500">{ac.deepSub}</p>
          </div>
          <Button className="rounded-full" loading={deep.isPending} onClick={() => deep.mutate()}>{ac.deepRun}</Button>
        </div>
        {sim && (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-sm text-navy-400">{ac.parseScore}</p>
              <p className="text-3xl font-bold text-navy-900">{sim.parseScore}%</p>
              <p className="mt-3 text-sm text-navy-600">{sim.summary}</p>
              <div className="mt-4">
                <p className="text-sm font-semibold text-navy-700">{ac.detected}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sim.sectionsDetected.map((s) => <Badge key={s} tone="success">{s}</Badge>)}
                </div>
              </div>
              {sim.likelyDropped.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-navy-700">{ac.dropped}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sim.likelyDropped.map((s) => <Badge key={s} tone="warning">{s}</Badge>)}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {sim.formattingIssues.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-navy-700">{ac.format}</p>
                  <ul className="mt-2 space-y-1.5">
                    {sim.formattingIssues.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-navy-600"><span className="text-electric-500">→</span>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {sim.invisibleErrors.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-navy-700">{ac.invisible}</p>
                  <ul className="mt-2 space-y-1.5">
                    {sim.invisibleErrors.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-navy-600"><span className="text-amber-500">⚠</span>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </PageTransition>
  )
}
