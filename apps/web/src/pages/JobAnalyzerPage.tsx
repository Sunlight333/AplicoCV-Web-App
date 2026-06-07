import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input, TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/Toast'
import { useI18n } from '@/i18n/I18nProvider'
import { AI_COSTS } from '@/lib/aiCosts'
import { ApiError } from '@/lib/apiClient'
import {
  getPredictiveScore,
  getGhostRecruiter,
  type PredictiveScore,
  type GhostRecruiter,
} from '@/services/ai'
import { checkScam, type ScamCheck } from '@/services/insights'

interface AnalyzerCopy {
  title: string; subtitle: string
  jd: string; jdPh: string; url: string; urlPh: string; analyze: string; error: string; need: string
  predictive: string; chance: string; skills: string; seniority: string; location: string
  missing: string; overqualified: string; atsPass: string; atsFail: string
  ghost: string; verdictApply: string; verdictCaution: string; verdictSkip: string; betterFit: string
  scam: string; riskLow: string; riskMed: string; riskHigh: string
}

const COPY: Record<Locale, AnalyzerCopy> = {
  en: {
    title: 'Job analyzer', subtitle: 'Paste a posting (or its link) to see your real odds, whether it’s worth applying, and if it looks like a scam.',
    jd: 'Job description', jdPh: 'Paste the full posting here…', url: 'Or job URL (optional)', urlPh: 'https://…', analyze: '✦ Analyze this job', error: 'Could not analyze', need: 'Paste a description or a URL first.',
    predictive: 'Predicted apply score', chance: 'Chance of success', skills: 'Skills', seniority: 'Seniority', location: 'Location',
    missing: 'Add these keywords', overqualified: 'You may be overqualified', atsPass: 'Likely passes ATS', atsFail: 'May not pass ATS',
    ghost: 'Ghost recruiter', verdictApply: 'Apply', verdictCaution: 'Apply with caution', verdictSkip: 'Skip this one', betterFit: 'Better fit',
    scam: 'Scam check', riskLow: 'Low risk', riskMed: 'Medium risk', riskHigh: 'High risk',
  },
  es: {
    title: 'Analizador de empleo', subtitle: 'Pega una oferta (o su enlace) para ver tus probabilidades reales, si vale la pena postular y si parece una estafa.',
    jd: 'Descripción del empleo', jdPh: 'Pega aquí la oferta completa…', url: 'O URL del empleo (opcional)', urlPh: 'https://…', analyze: '✦ Analizar este empleo', error: 'No se pudo analizar', need: 'Pega una descripción o una URL primero.',
    predictive: 'Puntuación de postulación', chance: 'Probabilidad de éxito', skills: 'Habilidades', seniority: 'Seniority', location: 'Ubicación',
    missing: 'Agrega estas palabras clave', overqualified: 'Podrías estar sobrecalificado', atsPass: 'Probablemente pasa el ATS', atsFail: 'Puede no pasar el ATS',
    ghost: 'Reclutador fantasma', verdictApply: 'Postular', verdictCaution: 'Postular con cautela', verdictSkip: 'Mejor omitir', betterFit: 'Mejor opción',
    scam: 'Verificación de estafa', riskLow: 'Riesgo bajo', riskMed: 'Riesgo medio', riskHigh: 'Riesgo alto',
  },
  'pt-BR': {
    title: 'Analisador de vagas', subtitle: 'Cole uma vaga (ou o link) para ver suas chances reais, se vale a pena se candidatar e se parece golpe.',
    jd: 'Descrição da vaga', jdPh: 'Cole a vaga completa aqui…', url: 'Ou URL da vaga (opcional)', urlPh: 'https://…', analyze: '✦ Analisar esta vaga', error: 'Não foi possível analisar', need: 'Cole uma descrição ou uma URL primeiro.',
    predictive: 'Pontuação de candidatura', chance: 'Chance de sucesso', skills: 'Habilidades', seniority: 'Senioridade', location: 'Localização',
    missing: 'Adicione estas palavras-chave', overqualified: 'Você pode estar superqualificado', atsPass: 'Provavelmente passa no ATS', atsFail: 'Pode não passar no ATS',
    ghost: 'Recrutador fantasma', verdictApply: 'Candidatar-se', verdictCaution: 'Candidatar-se com cautela', verdictSkip: 'Melhor pular', betterFit: 'Melhor opção',
    scam: 'Verificação de golpe', riskLow: 'Risco baixo', riskMed: 'Risco médio', riskHigh: 'Risco alto',
  },
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-navy-500">
        <span>{label}</span>
        <span className="tabular-nums font-medium text-navy-700">{value}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-navy-100">
        <div className="h-full rounded-full bg-gradient-to-r from-electric-400 to-violet-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function JobAnalyzerPage() {
  const { toast } = useToast()
  const { locale } = useI18n()
  const c = useCopy(COPY)
  const creditsWord = locale.startsWith('pt') || locale.startsWith('es') ? 'créditos' : 'credits'
  const analyzeCost = AI_COSTS.predictive_score + AI_COSTS.ghost_recruiter
  const [jd, setJd] = useState('')
  const [url, setUrl] = useState('')
  const [predictive, setPredictive] = useState<PredictiveScore | null>(null)
  const [ghost, setGhost] = useState<GhostRecruiter | null>(null)
  const [scam, setScam] = useState<ScamCheck | null>(null)

  const analyze = useMutation({
    mutationFn: async () => {
      const ref = { jobDescription: jd.trim() || undefined, jobUrl: url.trim() || undefined }
      const [p, g, s] = await Promise.all([
        getPredictiveScore(ref),
        getGhostRecruiter(ref),
        checkScam({ jobDescription: ref.jobDescription, jobUrl: ref.jobUrl }),
      ])
      return { p, g, s }
    },
    onSuccess: ({ p, g, s }) => {
      setPredictive(p)
      setGhost(g)
      setScam(s)
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : c.error, 'error'),
  })

  const verdictLabel = ghost
    ? ghost.verdict === 'apply' ? c.verdictApply : ghost.verdict === 'caution' ? c.verdictCaution : c.verdictSkip
    : ''
  const riskLabel = scam ? (scam.riskLevel === 'low' ? c.riskLow : scam.riskLevel === 'medium' ? c.riskMed : c.riskHigh) : ''

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{c.title}</h1>
      <p className="mt-1 text-navy-500">{c.subtitle}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <TextArea label={c.jd} rows={12} value={jd} onChange={(e) => setJd(e.target.value)} placeholder={c.jdPh} />
          <div className="mt-4">
            <Input label={c.url} value={url} onChange={(e) => setUrl(e.target.value)} placeholder={c.urlPh} />
          </div>
          <Button
            className="mt-4 rounded-full"
            loading={analyze.isPending}
            disabled={!jd.trim() && !url.trim()}
            onClick={() => (jd.trim() || url.trim() ? analyze.mutate() : toast(c.need, 'error'))}
          >
            {c.analyze} · {analyzeCost} {creditsWord}
          </Button>
        </Card>

        <div className="space-y-6">
          {predictive && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-navy-900">{c.predictive}</h2>
                <Badge tone={predictive.successProbability >= 70 ? 'success' : predictive.successProbability >= 45 ? 'info' : 'warning'}>
                  {predictive.successProbability}%
                </Badge>
              </div>
              <p className="mt-1 text-xs text-navy-400">{c.chance}</p>
              <div className="mt-4 space-y-3">
                <Meter label={c.skills} value={predictive.fitBreakdown.skills} />
                <Meter label={c.seniority} value={predictive.fitBreakdown.seniority} />
                <Meter label={c.location} value={predictive.fitBreakdown.location} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone={predictive.atsPass ? 'success' : 'warning'}>{predictive.atsPass ? c.atsPass : c.atsFail}</Badge>
                {predictive.overqualified && <Badge tone="info">{c.overqualified}</Badge>}
              </div>
              {predictive.missingSkills.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-navy-700">{c.missing}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {predictive.missingSkills.map((k) => <Badge key={k} tone="warning">{k}</Badge>)}
                  </div>
                </div>
              )}
              {predictive.advice && <p className="mt-4 rounded-lg bg-navy-50 p-3 text-sm text-navy-600">{predictive.advice}</p>}
            </Card>
          )}

          {ghost && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-navy-900">{c.ghost}</h2>
                <Badge tone={ghost.verdict === 'apply' ? 'success' : ghost.verdict === 'caution' ? 'warning' : 'neutral'}>{verdictLabel}</Badge>
              </div>
              <ul className="mt-3 space-y-1.5">
                {ghost.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-navy-600"><span className="text-electric-500">→</span>{r}</li>
                ))}
              </ul>
              {ghost.betterFitNote && (
                <p className="mt-3 rounded-lg bg-navy-50 p-3 text-sm text-navy-600"><span className="font-semibold">{c.betterFit}: </span>{ghost.betterFitNote}</p>
              )}
            </Card>
          )}

          {scam && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-navy-900">{c.scam}</h2>
                <Badge tone={scam.riskLevel === 'low' ? 'success' : scam.riskLevel === 'medium' ? 'warning' : 'neutral'}>{riskLabel} · {scam.riskScore}</Badge>
              </div>
              <ul className="mt-3 space-y-1.5">
                {scam.signals.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-navy-600"><span className="text-electric-500">•</span>{s}</li>
                ))}
              </ul>
              <p className="mt-3 rounded-lg bg-navy-50 p-3 text-sm text-navy-600">{scam.advice}</p>
            </Card>
          )}

          {!predictive && !ghost && !scam && (
            <Card className="flex min-h-[18rem] items-center justify-center p-6 text-center text-sm text-navy-400">
              {c.subtitle}
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
