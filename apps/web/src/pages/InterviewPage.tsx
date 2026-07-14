import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input, TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SpokenInterview } from '@/components/SpokenInterview'
import { useToast } from '@/components/Toast'
import { useT } from '@/i18n/I18nProvider'
import { ApiError } from '@/lib/apiClient'
import { currentLocale } from '@/lib/locale'
import { startInterview, getInterviewHistory, type InterviewKind } from '@/services/ai'
import { useCopy } from '@/i18n/useCopy'
import type { Locale } from '@/i18n/dictionaries'

const IC: Record<Locale, { newInterview: string; incomplete: string; questions: (n: number) => string; language: string; realistic: string }> = {
  en: { newInterview: 'New interview', incomplete: 'Incomplete', questions: (n) => `${n} questions`, language: 'Interview language', realistic: 'A realistic, spoken practice — the interviewer asks out loud, you answer to the screen. Nothing is recorded.' },
  es: { newInterview: 'Nueva entrevista', incomplete: 'Incompleta', questions: (n) => `${n} preguntas`, language: 'Idioma de la entrevista', realistic: 'Una práctica hablada y realista — el entrevistador pregunta en voz alta y tú respondes a la pantalla. No se graba nada.' },
  'pt-BR': { newInterview: 'Nova entrevista', incomplete: 'Incompleta', questions: (n) => `${n} perguntas`, language: 'Idioma da entrevista', realistic: 'Uma prática falada e realista — o entrevistador pergunta em voz alta e você responde para a tela. Nada é gravado.' },
}

const LANGS: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt-BR', label: 'Português' },
]

type Phase = 'setup' | 'drill'

export default function InterviewPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const t = useT()
  const ti = t.app.more.interview
  const ic = useCopy(IC)

  const [phase, setPhase] = useState<Phase>('setup')
  const [role, setRole] = useState('')
  const [kind, setKind] = useState<InterviewKind>('mixed')
  const [jd, setJd] = useState('')
  const [language, setLanguage] = useState<string>(currentLocale())
  const [questions, setQuestions] = useState<string[]>([])

  const history = useQuery({ queryKey: ['interview-history'], queryFn: getInterviewHistory })

  const startM = useMutation({
    mutationFn: () => startInterview({ role: role.trim(), jobDescription: jd.trim() || undefined, kind, language }),
    onSuccess: (r) => {
      setQuestions(r.questions)
      setPhase('drill')
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Could not start interview', 'error'),
  })

  const reset = () => {
    setPhase('setup')
    setQuestions([])
    qc.invalidateQueries({ queryKey: ['interview-history'] })
  }

  return (
    <PageTransition>
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{ti.title}</h1>
        <p className="mt-1 max-w-2xl text-navy-500">{ic.realistic}</p>
      </div>

      {phase === 'setup' && (
        <Card className="mt-6 max-w-2xl p-6">
          <div className="space-y-4">
            <Input label={ti.role} placeholder="e.g. Senior Frontend Engineer" value={role} onChange={(e) => setRole(e.target.value)} />
            <div>
              <p className="mb-2 text-sm font-medium text-navy-700">{ti.kind}</p>
              <div className="flex flex-wrap gap-2">
                {(['mixed', 'behavioral', 'technical'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      kind === k ? 'border-electric-500 bg-electric-50 text-electric-700' : 'border-navy-200 text-navy-500 hover:border-electric-300'
                    }`}
                  >
                    {ti.kinds[k]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-navy-700">{ic.language}</p>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      language === l.code ? 'border-electric-500 bg-electric-50 text-electric-700' : 'border-navy-200 text-navy-500 hover:border-electric-300'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <TextArea label={ti.jd} rows={4} value={jd} onChange={(e) => setJd(e.target.value)} />
            <Button className="rounded-full" loading={startM.isPending} disabled={!role.trim()} onClick={() => startM.mutate()}>
              {ti.start}
            </Button>
          </div>
        </Card>
      )}

      {phase === 'drill' && questions.length > 0 && (
        <SpokenInterview questions={questions} locale={language} onDone={reset} />
      )}

      {phase === 'setup' && (history.data?.length ?? 0) > 0 && (
        <Card className="mt-6 max-w-2xl p-6">
          <h2 className="text-lg font-semibold text-navy-900">{ti.historyTitle}</h2>
          <div className="mt-3 divide-y divide-navy-100">
            {history.data!.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-navy-800">{s.role}</p>
                  <p className="text-xs text-navy-400">
                    {new Date(s.createdAt).toLocaleDateString()} · {ic.questions(s.questionCount)}
                  </p>
                </div>
                {s.overallScore != null ? (
                  <Badge tone={s.overallScore >= 80 ? 'success' : s.overallScore >= 55 ? 'info' : 'warning'}>
                    {s.overallScore}
                  </Badge>
                ) : (
                  <Badge tone="neutral">{ic.incomplete}</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageTransition>
  )
}
