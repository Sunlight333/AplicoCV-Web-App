import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input, TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/Toast'
import { useT } from '@/i18n/I18nProvider'
import {
  generateSuperCv,
  generatePersonalizedLetter,
  type SuperCvResult,
  type CoverLetterTone,
} from '@/services/ai'
import { downloadTextPdf } from '@/lib/pdf'
import { ApiError } from '@/lib/apiClient'

const SUPER_CV_COST = 50
const LETTER_COST = 40
const TONES: CoverLetterTone[] = ['professional', 'warm', 'direct']

interface OptCopy {
  title: string; subtitle: string; viewDocs: string
  superTitle: string; superDesc: string; credits: (n: number) => string
  whichCv: string; useSaved: string; useSavedSub: string; pasteOther: string; pasteOtherSub: string; pasteLabel: string
  targetRole: string; targetRolePh: string; jd: string; jdPh: string; warning: string; generate: (n: number) => string
  resultTitle: string; missing: string; copy: string; downloadPdf: string
  superToast: string; genError: string; copied: string
  letterTitle: string; letterDesc: string; company: string; companyPh: string; role: string; rolePh: string
  tone: string; emphasize: string; jdRequired: string; write: (n: number) => string; letterToast: string
}

const COPY: Record<Locale, OptCopy> = {
  en: {
    title: 'Optimize CV & cover letter', subtitle: 'Advanced recruiter-grade tools to multiply your interviews.', viewDocs: 'View generated documents →',
    superTitle: 'Super CV (ATS)', superDesc: 'A senior recruiter rewrites your experience with the X-Y-Z formula, with gap analysis and ATS optimization.',
    credits: (n) => `${n} credits`,
    whichCv: 'Which CV?', useSaved: 'Use my saved profile', useSavedSub: 'Your profile from “Profile”', pasteOther: 'Paste another CV', pasteOtherSub: 'For this application only', pasteLabel: 'Paste CV text',
    targetRole: 'Target role *', targetRolePh: 'e.g. Senior Frontend Engineer', jd: 'Job description (optional, recommended)', jdPh: 'Paste the posting’s requirements and responsibilities…',
    warning: '⚠️ The AI uses only the facts in your CV — it will not invent roles or companies.', generate: (n) => `✦ Generate Super CV (${n} credits)`,
    resultTitle: 'Your optimized CV', missing: 'Missing keywords:', copy: 'Copy', downloadPdf: 'Download PDF',
    superToast: 'Super CV generated 🎉', genError: 'Could not generate', copied: 'Copied to clipboard',
    letterTitle: '100% personalized cover letter', letterDesc: 'Written from scratch for one specific posting — references the company, the role and what you want to emphasize.',
    company: 'Company', companyPh: 'e.g. Acme Inc.', role: 'Role', rolePh: 'e.g. Product Manager',
    tone: 'Tone', emphasize: 'What should it emphasize? (optional)', jdRequired: 'Job description *', write: (n) => `✦ Write my letter (${n} credits)`, letterToast: 'Cover letter ready 🎉',
  },
  es: {
    title: 'Optimizar CV y carta', subtitle: 'Herramientas avanzadas de nivel reclutador para multiplicar tus entrevistas.', viewDocs: 'Ver documentos generados →',
    superTitle: 'Super CV (ATS)', superDesc: 'Un reclutador senior reescribe tu experiencia con la fórmula X-Y-Z, con análisis de brechas y optimización ATS.',
    credits: (n) => `${n} créditos`,
    whichCv: '¿Qué CV?', useSaved: 'Usar mi perfil guardado', useSavedSub: 'Tu perfil de “Perfil”', pasteOther: 'Pegar otro CV', pasteOtherSub: 'Solo para esta postulación', pasteLabel: 'Pega el texto del CV',
    targetRole: 'Puesto objetivo *', targetRolePh: 'ej. Ingeniero Frontend Senior', jd: 'Descripción del empleo (opcional, recomendado)', jdPh: 'Pega los requisitos y responsabilidades de la oferta…',
    warning: '⚠️ La IA usa solo los hechos de tu CV — no inventará puestos ni empresas.', generate: (n) => `✦ Generar Super CV (${n} créditos)`,
    resultTitle: 'Tu CV optimizado', missing: 'Palabras clave faltantes:', copy: 'Copiar', downloadPdf: 'Descargar PDF',
    superToast: 'Super CV generado 🎉', genError: 'No se pudo generar', copied: 'Copiado al portapapeles',
    letterTitle: 'Carta de presentación 100% personalizada', letterDesc: 'Escrita desde cero para una oferta específica — menciona la empresa, el puesto y lo que quieres destacar.',
    company: 'Empresa', companyPh: 'ej. Acme Inc.', role: 'Puesto', rolePh: 'ej. Gerente de Producto',
    tone: 'Tono', emphasize: '¿Qué debería destacar? (opcional)', jdRequired: 'Descripción del empleo *', write: (n) => `✦ Escribir mi carta (${n} créditos)`, letterToast: 'Carta lista 🎉',
  },
  'pt-BR': {
    title: 'Otimizar currículo e carta', subtitle: 'Ferramentas avançadas de nível recrutador para multiplicar suas entrevistas.', viewDocs: 'Ver documentos gerados →',
    superTitle: 'Super CV (ATS)', superDesc: 'Um recrutador sênior reescreve sua experiência com a fórmula X-Y-Z, com análise de lacunas e otimização ATS.',
    credits: (n) => `${n} créditos`,
    whichCv: 'Qual currículo?', useSaved: 'Usar meu perfil salvo', useSavedSub: 'Seu perfil de “Perfil”', pasteOther: 'Colar outro currículo', pasteOtherSub: 'Apenas para esta candidatura', pasteLabel: 'Cole o texto do currículo',
    targetRole: 'Cargo desejado *', targetRolePh: 'ex. Engenheiro Frontend Sênior', jd: 'Descrição da vaga (opcional, recomendado)', jdPh: 'Cole os requisitos e responsabilidades da vaga…',
    warning: '⚠️ A IA usa apenas os fatos do seu currículo — não vai inventar cargos ou empresas.', generate: (n) => `✦ Gerar Super CV (${n} créditos)`,
    resultTitle: 'Seu currículo otimizado', missing: 'Palavras-chave ausentes:', copy: 'Copiar', downloadPdf: 'Baixar PDF',
    superToast: 'Super CV gerado 🎉', genError: 'Não foi possível gerar', copied: 'Copiado para a área de transferência',
    letterTitle: 'Carta de apresentação 100% personalizada', letterDesc: 'Escrita do zero para uma vaga específica — cita a empresa, o cargo e o que você quer destacar.',
    company: 'Empresa', companyPh: 'ex. Acme Inc.', role: 'Cargo', rolePh: 'ex. Gerente de Produto',
    tone: 'Tom', emphasize: 'O que deve destacar? (opcional)', jdRequired: 'Descrição da vaga *', write: (n) => `✦ Escrever minha carta (${n} créditos)`, letterToast: 'Carta pronta 🎉',
  },
}

export default function OptimizePage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const t = useT()
  const c = useCopy(COPY)
  const [targetRole, setTargetRole] = useState('')
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

  const mutation = useMutation({
    mutationFn: () =>
      generateSuperCv({
        targetRole: targetRole.trim(),
        jobDescription: jobDescription.trim() || undefined,
        cvText: source === 'paste' ? cvText.trim() || undefined : undefined,
      }),
    onSuccess: (r) => {
      setResult(r)
      qc.invalidateQueries({ queryKey: ['credits'] })
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

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">{c.superTitle}</h2>
            <p className="mt-1 text-sm text-navy-500">{c.superDesc}</p>
          </div>
          <Badge tone="info">{c.credits(SUPER_CV_COST)}</Badge>
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
          <TextArea label={c.jd} rows={5} placeholder={c.jdPh} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />

          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">{c.warning}</div>

          <Button className="rounded-full" loading={mutation.isPending} disabled={!targetRole.trim()} onClick={() => mutation.mutate()}>
            {c.generate(SUPER_CV_COST)}
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-navy-500">{c.missing}</span>
              {result.gaps.map((g) => (
                <Badge key={g} tone="warning">{g}</Badge>
              ))}
            </div>
          )}
          <pre className="mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg border border-navy-100 bg-navy-50/40 p-4 text-sm text-navy-700">{result.cvText}</pre>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" className="rounded-full" onClick={() => { navigator.clipboard.writeText(result.cvText); toast(c.copied) }}>{c.copy}</Button>
            <Button variant="secondary" className="rounded-full" onClick={() => downloadTextPdf(`Super CV — ${targetRole}`, result.cvText)}>{c.downloadPdf}</Button>
          </div>
        </Card>
      )}

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">{c.letterTitle}</h2>
            <p className="mt-1 text-sm text-navy-500">{c.letterDesc}</p>
          </div>
          <Badge tone="info">{c.credits(LETTER_COST)}</Badge>
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
          {c.write(LETTER_COST)}
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
    </PageTransition>
  )
}
