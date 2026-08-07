import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { currentLocale } from '@/lib/locale'
import { Link } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input, TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CvReviewPanel } from '@/components/CvReviewPanel'

/** Copy for the interactive "add the missing keywords?" step. */
const GAPS_COPY = (l: string) =>
  l === 'es'
    ? {
        title: '¿Querés que agreguemos estas palabras clave?',
        sub: 'Elegí solo las que sean ciertas para vos — las integramos en tu CV sin inventar nada.',
        cta: (n: number) => (n ? `Agregar ${n} y regenerar` : 'Elegí al menos una'),
      }
    : l === 'pt-BR'
      ? {
          title: 'Quer que a gente adicione estas palavras-chave?',
          sub: 'Escolha só as que forem verdadeiras para você — integramos ao seu currículo sem inventar nada.',
          cta: (n: number) => (n ? `Adicionar ${n} e gerar de novo` : 'Escolha ao menos uma'),
        }
      : {
          title: 'Want us to add these keywords?',
          sub: 'Pick only the ones that are true for you — we weave them in without inventing anything.',
          cta: (n: number) => (n ? `Add ${n} & regenerate` : 'Pick at least one'),
        }
import { useToast } from '@/components/Toast'
import { useT } from '@/i18n/I18nProvider'
import {
  generateSuperCv,
  generatePersonalizedLetter,
  getSalaryInsights,
  type SuperCvResult,
  type CoverLetterTone,
  type SalaryInsights,
} from '@/services/ai'
import { downloadTextPdf } from '@/lib/pdf'
import { ApiError } from '@/lib/apiClient'

const TONES: CoverLetterTone[] = ['professional', 'warm', 'direct']

interface SalaryCopy {
  title: string; desc: string; role: string; rolePh: string; region: string; regionPh: string
  run: string; range: string; negotiation: string
}
const SAL: Record<Locale, SalaryCopy> = {
  en: {
    title: 'Salary & negotiation copilot', desc: 'A market-aware estimate for your target role plus negotiation talking points.',
    role: 'Target role *', rolePh: 'e.g. Senior Product Manager', region: 'Region (optional)', regionPh: 'e.g. Remote US, Berlin…',
    run: 'Get salary insights', range: 'Estimated range', negotiation: 'Negotiation points',
  },
  es: {
    title: 'Copiloto de salario y negociación', desc: 'Una estimación de mercado para tu puesto objetivo y puntos clave de negociación.',
    role: 'Puesto objetivo *', rolePh: 'ej. Gerente de Producto Senior', region: 'Región (opcional)', regionPh: 'ej. Remoto US, Berlín…',
    run: 'Ver salario', range: 'Rango estimado', negotiation: 'Puntos de negociación',
  },
  'pt-BR': {
    title: 'Copiloto de salário e negociação', desc: 'Uma estimativa de mercado para o cargo desejado e pontos de negociação.',
    role: 'Cargo desejado *', rolePh: 'ex. Gerente de Produto Sênior', region: 'Região (opcional)', regionPh: 'ex. Remoto US, Berlim…',
    run: 'Ver salário', range: 'Faixa estimada', negotiation: 'Pontos de negociação',
  },
}

// The industry angles a CV can be built around, mirroring CvFocus on the API. The
// client's examples were commercial / marketing / consulting / engineering.
const FOCUS_OPTIONS = [
  { id: 'commercial' }, { id: 'marketing' }, { id: 'product' }, { id: 'consulting' },
  { id: 'engineering' }, { id: 'operations' }, { id: 'finance' },
  { id: 'customer_success' }, { id: 'data' }, { id: 'hr' },
] as const

interface OptCopy {
  title: string; subtitle: string; viewDocs: string
  superTitle: string; superDesc: string
  whichCv: string; useSaved: string; useSavedSub: string; pasteOther: string; pasteOtherSub: string; pasteLabel: string
  targetRole: string; targetRolePh: string; jd: string; jdPh: string; warning: string; generate: string
  jobUrl: string; jobUrlPh: string; focus: string; focusNames: Record<string, string>
  resultTitle: string; missing: string; copy: string; downloadPdf: string
  superToast: string; genError: string; copied: string
  letterTitle: string; letterDesc: string; company: string; companyPh: string; role: string; rolePh: string
  tone: string; emphasize: string; jdRequired: string; write: string; letterToast: string
}

const COPY: Record<Locale, OptCopy> = {
  en: {
    title: 'Optimize CV & cover letter', subtitle: 'Advanced recruiter-grade tools to multiply your interviews.', viewDocs: 'View generated documents →',
    superTitle: 'Optimized CV (ATS)', superDesc: 'A senior recruiter rewrites your experience with the X-Y-Z formula, with gap analysis and ATS optimization.',
    whichCv: 'Which CV?', useSaved: 'Use my saved profile', useSavedSub: 'Your profile from “Profile”', pasteOther: 'Paste another CV', pasteOtherSub: 'For this application only', pasteLabel: 'Paste CV text',
    targetRole: 'Target role *', targetRolePh: 'e.g. Senior Frontend Engineer', jd: 'Job description (optional, recommended)', jdPh: 'Paste the posting’s requirements and responsibilities…',
    jobUrl: 'Job link (optional)', jobUrlPh: 'Paste the offer’s URL — we read the posting for you',
    focus: 'Build this CV for…',
    focusNames: { commercial: 'Commercial', marketing: 'Marketing', product: 'Product', consulting: 'Consulting', engineering: 'Engineering', operations: 'Operations', finance: 'Finance', customer_success: 'Customer Success', data: 'Data', hr: 'People / HR' },
    warning: '⚠️ The AI uses only the facts in your CV — it will not invent roles or companies.', generate: 'Generate optimized CV',
    resultTitle: 'Your optimized CV', missing: 'Missing keywords:', copy: 'Copy', downloadPdf: 'Download PDF',
    superToast: 'Optimized CV generated 🎉', genError: 'Could not generate', copied: 'Copied to clipboard',
    letterTitle: '100% personalized cover letter', letterDesc: 'Written from scratch for one specific posting — references the company, the role and what you want to emphasize.',
    company: 'Company', companyPh: 'e.g. Acme Inc.', role: 'Role', rolePh: 'e.g. Product Manager',
    tone: 'Tone', emphasize: 'What should it emphasize? (optional)', jdRequired: 'Job description *', write: 'Write my letter', letterToast: 'Cover letter ready 🎉',
  },
  es: {
    title: 'Optimizar CV y carta', subtitle: 'Herramientas avanzadas de nivel reclutador para multiplicar tus entrevistas.', viewDocs: 'Ver documentos generados →',
    superTitle: 'CV optimizado (ATS)', superDesc: 'Un reclutador senior reescribe tu experiencia con la fórmula X-Y-Z, con análisis de brechas y optimización ATS.',
    whichCv: '¿Qué CV?', useSaved: 'Usar mi perfil guardado', useSavedSub: 'Tu perfil de “Perfil”', pasteOther: 'Pegar otro CV', pasteOtherSub: 'Solo para esta postulación', pasteLabel: 'Pega el texto del CV',
    targetRole: 'Puesto objetivo *', targetRolePh: 'ej. Ingeniero Frontend Senior', jd: 'Descripción del empleo (opcional, recomendado)', jdPh: 'Pega los requisitos y responsabilidades de la oferta…',
    jobUrl: 'Enlace de la oferta (opcional)', jobUrlPh: 'Pega el link de la oferta — leemos la publicación por ti',
    focus: 'Arma este CV con enfoque en…',
    focusNames: { commercial: 'Comercial', marketing: 'Marketing', product: 'Producto', consulting: 'Consultoría', engineering: 'Ingeniería', operations: 'Operaciones', finance: 'Finanzas', customer_success: 'Customer Success', data: 'Datos', hr: 'RR. HH.' },
    warning: '⚠️ La IA usa solo los hechos de tu CV — no inventará puestos ni empresas.', generate: 'Generar CV optimizado',
    resultTitle: 'Tu CV optimizado', missing: 'Palabras clave faltantes:', copy: 'Copiar', downloadPdf: 'Descargar PDF',
    superToast: 'CV optimizado generado 🎉', genError: 'No se pudo generar', copied: 'Copiado al portapapeles',
    letterTitle: 'Carta de presentación 100% personalizada', letterDesc: 'Escrita desde cero para una oferta específica — menciona la empresa, el puesto y lo que quieres destacar.',
    company: 'Empresa', companyPh: 'ej. Acme Inc.', role: 'Puesto', rolePh: 'ej. Gerente de Producto',
    tone: 'Tono', emphasize: '¿Qué debería destacar? (opcional)', jdRequired: 'Descripción del empleo *', write: 'Escribir mi carta', letterToast: 'Carta lista 🎉',
  },
  'pt-BR': {
    title: 'Otimizar currículo e carta', subtitle: 'Ferramentas avançadas de nível recrutador para multiplicar suas entrevistas.', viewDocs: 'Ver documentos gerados →',
    superTitle: 'Currículo otimizado (ATS)', superDesc: 'Um recrutador sênior reescreve sua experiência com a fórmula X-Y-Z, com análise de lacunas e otimização ATS.',
    whichCv: 'Qual currículo?', useSaved: 'Usar meu perfil salvo', useSavedSub: 'Seu perfil de “Perfil”', pasteOther: 'Colar outro currículo', pasteOtherSub: 'Apenas para esta candidatura', pasteLabel: 'Cole o texto do currículo',
    targetRole: 'Cargo desejado *', targetRolePh: 'ex. Engenheiro Frontend Sênior', jd: 'Descrição da vaga (opcional, recomendado)', jdPh: 'Cole os requisitos e responsabilidades da vaga…',
    jobUrl: 'Link da vaga (opcional)', jobUrlPh: 'Cole o link da vaga — lemos o anúncio para você',
    focus: 'Monte este currículo com foco em…',
    focusNames: { commercial: 'Comercial', marketing: 'Marketing', product: 'Produto', consulting: 'Consultoria', engineering: 'Engenharia', operations: 'Operações', finance: 'Finanças', customer_success: 'Customer Success', data: 'Dados', hr: 'RH' },
    warning: '⚠️ A IA usa apenas os fatos do seu currículo — não vai inventar cargos ou empresas.', generate: 'Gerar currículo otimizado',
    resultTitle: 'Seu currículo otimizado', missing: 'Palavras-chave ausentes:', copy: 'Copiar', downloadPdf: 'Baixar PDF',
    superToast: 'Currículo otimizado gerado 🎉', genError: 'Não foi possível gerar', copied: 'Copiado para a área de transferência',
    letterTitle: 'Carta de apresentação 100% personalizada', letterDesc: 'Escrita do zero para uma vaga específica — cita a empresa, o cargo e o que você quer destacar.',
    company: 'Empresa', companyPh: 'ex. Acme Inc.', role: 'Cargo', rolePh: 'ex. Gerente de Produto',
    tone: 'Tom', emphasize: 'O que deve destacar? (opcional)', jdRequired: 'Descrição da vaga *', write: 'Escrever minha carta', letterToast: 'Carta pronta 🎉',
  },
}

export default function OptimizePage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const t = useT()
  const c = useCopy(COPY)
  const loc = currentLocale()
  const sc = useCopy(SAL)
  const [targetRole, setTargetRole] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [focus, setFocus] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [source, setSource] = useState<'system' | 'paste'>('system')
  const [cvText, setCvText] = useState('')
  const [result, setResult] = useState<SuperCvResult | null>(null)

  const [company, setCompany] = useState('')
  const [letterRole, setLetterRole] = useState('')
  const [highlights, setHighlights] = useState('')
  const [letterJd, setLetterJd] = useState('')
  const [tone, setTone] = useState<CoverLetterTone>('professional')
  const [letter, setLetter] = useState('')

  const [salaryRole, setSalaryRole] = useState('')
  const [salaryRegion, setSalaryRegion] = useState('')
  const [salary, setSalary] = useState<SalaryInsights | null>(null)
  const salaryM = useMutation({
    mutationFn: () => getSalaryInsights({ role: salaryRole.trim(), region: salaryRegion.trim() || undefined }),
    onSuccess: (r) => {
      setSalary(r)
      qc.invalidateQueries({ queryKey: ['credits'] })
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : c.genError, 'error'),
  })

  const mutation = useMutation({
    mutationFn: () =>
      generateSuperCv({
        targetRole: targetRole.trim(),
        jobUrl: jobUrl.trim() || undefined,
        focus: focus || undefined,
        jobDescription: jobDescription.trim() || undefined,
        cvText: source === 'paste' ? cvText.trim() || undefined : undefined,
      }),
    onSuccess: (r) => {
      setResult(r)
      setPicked([])
      qc.invalidateQueries({ queryKey: ['credits'] })
      qc.invalidateQueries({ queryKey: ['library'] })
      toast(c.superToast)
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : c.genError, 'error'),
  })

  // Keywords the user ticked from the "what's missing" list, to be woven into a
  // regenerated CV (client 24.07: the tool should ASK before adding them).
  const [picked, setPicked] = useState<string[]>([])
  const addGaps = useMutation({
    mutationFn: () =>
      generateSuperCv({
        targetRole: targetRole.trim(),
        jobUrl: jobUrl.trim() || undefined,
        focus: focus || undefined,
        jobDescription: [
          jobDescription.trim(),
          `MUST INCORPORATE these keywords/phrases into the CV, truthfully and only where they genuinely fit the candidate's real experience: ${picked.join(', ')}.`,
        ]
          .filter(Boolean)
          .join('\n\n'),
        cvText: source === 'paste' ? cvText.trim() || undefined : undefined,
      }),
    onSuccess: (r) => {
      setResult(r)
      setPicked([])
      qc.invalidateQueries({ queryKey: ['library'] })
      toast(c.superToast)
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : c.genError, 'error'),
  })

  const letterM = useMutation({
    mutationFn: () =>
      generatePersonalizedLetter({
        jobDescription: letterJd.trim(),
        company: company.trim() || undefined,
        role: letterRole.trim() || undefined,
        highlights: highlights.trim() || undefined,
        tone,
      }),
    onSuccess: (text) => {
      setLetter(text)
      qc.invalidateQueries({ queryKey: ['credits'] })
      qc.invalidateQueries({ queryKey: ['library'] })
      toast(c.letterToast)
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : c.genError, 'error'),
  })

  return (
    <PageTransition>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{c.title}</h1>
          <p className="mt-1 text-navy-500">{c.subtitle}</p>
        </div>
        <Link to="/documents" className="text-sm font-medium text-electric-600 hover:underline">{c.viewDocs}</Link>
      </div>

      {/* Recruiter-grade review + achievement builder (Enfoque 2.0) */}
      <div className="mt-6">
        <CvReviewPanel />
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">{c.superTitle}</h2>
            <p className="mt-1 text-sm text-navy-500">{c.superDesc}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-navy-700">{c.whichCv}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {(['system', 'paste'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    source === s ? 'border-electric-500 bg-electric-50' : 'border-navy-200 hover:border-electric-300'
                  }`}
                >
                  <span className="font-medium text-navy-900">{s === 'system' ? c.useSaved : c.pasteOther}</span>
                  <span className="mt-0.5 block text-xs text-navy-400">{s === 'system' ? c.useSavedSub : c.pasteOtherSub}</span>
                </button>
              ))}
            </div>
          </div>

          {source === 'paste' && (
            <TextArea label={c.pasteLabel} rows={5} value={cvText} onChange={(e) => setCvText(e.target.value)} />
          )}

          <Input label={c.targetRole} placeholder={c.targetRolePh} value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />

          {/* Paste the offer's LINK: the server fetches the posting, so the user does
              not have to copy the description by hand. */}
          <Input label={c.jobUrl} placeholder={c.jobUrlPh} value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />

          {/* Industry focus — one CV per target profile ("CV for Marketing", "CV for
              Sales"…). Presets, because the client asked the user to CHOOSE the angle
              rather than have to describe it. */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">{c.focus}</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFocus(focus === f.id ? '' : f.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    focus === f.id
                      ? 'bg-electric-500 text-white shadow-emboss'
                      : 'bg-white text-navy-600 ring-1 ring-inset ring-navy-900/10 hover:bg-navy-50'
                  }`}
                >
                  {c.focusNames[f.id] ?? f.id}
                </button>
              ))}
            </div>
          </div>

          <TextArea label={c.jd} rows={5} placeholder={c.jdPh} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />

          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">{c.warning}</div>

          <Button className="rounded-full" loading={mutation.isPending} disabled={!targetRole.trim()} onClick={() => mutation.mutate()}>
            {c.generate}
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-navy-900">{c.resultTitle}</h2>
            <Badge tone={result.atsScore >= 80 ? 'success' : 'info'}>ATS {result.atsScore}%</Badge>
          </div>
          {result.gaps.length > 0 && (
            /* Client 24.07: don't just list what's missing — ASK whether to add it.
               Pick the keywords/phrases that are true for you and regenerate with them
               woven in truthfully. */
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="text-sm font-semibold text-navy-900">{GAPS_COPY(loc).title}</p>
              <p className="mt-0.5 text-xs text-navy-500">{GAPS_COPY(loc).sub}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.gaps.map((g) => {
                  const on = picked.includes(g)
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setPicked((p) => (on ? p.filter((x) => x !== g) : [...p, g]))}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors ${
                        on
                          ? 'bg-electric-500 text-white ring-electric-500'
                          : 'bg-white text-navy-700 ring-navy-200 hover:bg-navy-50'
                      }`}
                    >
                      {on ? '✓ ' : '+ '}{g}
                    </button>
                  )
                })}
              </div>
              <Button
                className="mt-3 rounded-full"
                size="sm"
                loading={addGaps.isPending}
                disabled={!picked.length || addGaps.isPending}
                onClick={() => addGaps.mutate()}
              >
                {GAPS_COPY(loc).cta(picked.length)}
              </Button>
            </div>
          )}
          <pre className="mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg border border-navy-100 bg-navy-50/40 p-4 text-sm text-navy-700">{result.cvText}</pre>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" className="rounded-full" onClick={() => { navigator.clipboard.writeText(result.cvText); toast(c.copied) }}>{c.copy}</Button>
            <Button variant="secondary" className="rounded-full" onClick={() => downloadTextPdf(targetRole || 'CV', result.cvText)}>{c.downloadPdf}</Button>
          </div>
        </Card>
      )}

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">{c.letterTitle}</h2>
            <p className="mt-1 text-sm text-navy-500">{c.letterDesc}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label={c.company} placeholder={c.companyPh} value={company} onChange={(e) => setCompany(e.target.value)} />
          <Input label={c.role} placeholder={c.rolePh} value={letterRole} onChange={(e) => setLetterRole(e.target.value)} />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-navy-700">{c.tone}</p>
          <div className="flex flex-wrap gap-2">
            {TONES.map((tn) => (
              <button
                key={tn}
                onClick={() => setTone(tn)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  tone === tn ? 'border-electric-500 bg-electric-50 text-electric-700' : 'border-navy-200 text-navy-500 hover:border-electric-300'
                }`}
              >
                {t.app.aiTools.tones[tn]}
              </button>
            ))}
          </div>
        </div>
        <TextArea className="mt-4" label={c.emphasize} rows={2} value={highlights} onChange={(e) => setHighlights(e.target.value)} />
        <TextArea className="mt-4" label={c.jdRequired} rows={5} value={letterJd} onChange={(e) => setLetterJd(e.target.value)} />
        <Button className="mt-4 rounded-full" loading={letterM.isPending} disabled={!letterJd.trim()} onClick={() => letterM.mutate()}>
          {c.write}
        </Button>

        {letter && (
          <div className="mt-5">
            <pre className="max-h-[24rem] overflow-auto whitespace-pre-wrap rounded-lg border border-navy-100 bg-navy-50/40 p-4 text-sm text-navy-700">{letter}</pre>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" className="rounded-full" onClick={() => { navigator.clipboard.writeText(letter); toast(c.copied) }}>{c.copy}</Button>
              <Button variant="secondary" className="rounded-full" onClick={() => downloadTextPdf(`Cover letter — ${company || letterRole || 'role'}`, letter)}>{c.downloadPdf}</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Salary & negotiation copilot (Phase 3.3) */}
      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">{sc.title}</h2>
            <p className="mt-1 text-sm text-navy-500">{sc.desc}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label={sc.role} placeholder={sc.rolePh} value={salaryRole} onChange={(e) => setSalaryRole(e.target.value)} />
          <Input label={sc.region} placeholder={sc.regionPh} value={salaryRegion} onChange={(e) => setSalaryRegion(e.target.value)} />
        </div>
        <Button className="mt-4 rounded-full" loading={salaryM.isPending} disabled={!salaryRole.trim()} onClick={() => salaryM.mutate()}>
          {sc.run}
        </Button>
        {salary && (
          <div className="mt-5 rounded-xl border border-navy-100 bg-navy-50/40 p-4">
            <p className="text-sm text-navy-400">{sc.range}</p>
            <p className="text-2xl font-bold text-navy-900">{salary.estimatedRange}</p>
            <p className="mt-3 text-sm font-semibold text-navy-700">{sc.negotiation}</p>
            <ul className="mt-2 space-y-1.5">
              {salary.negotiationPoints.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-navy-600"><span className="text-electric-500">→</span>{p}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-navy-400">{salary.marketNote}</p>
          </div>
        )}
      </Card>
    </PageTransition>
  )
}
