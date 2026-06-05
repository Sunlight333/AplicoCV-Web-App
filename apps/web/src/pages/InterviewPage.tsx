import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input, TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/Toast'
import { useT } from '@/i18n/I18nProvider'
import { ApiError } from '@/lib/apiClient'
import {
  startInterview,
  submitInterview,
  getInterviewHistory,
  type InterviewKind,
  type InterviewFeedback,
} from '@/services/ai'

import { useCopy } from '@/i18n/useCopy'
import type { Locale } from '@/i18n/dictionaries'

const IC: Record<Locale, { newInterview: string; incomplete: string; questions: (n: number) => string }> = {
  en: { newInterview: 'New interview', incomplete: 'Incomplete', questions: (n) => `${n} questions` },
  es: { newInterview: 'Nueva entrevista', incomplete: 'Incompleta', questions: (n) => `${n} preguntas` },
  'pt-BR': { newInterview: 'Nova entrevista', incomplete: 'Incompleta', questions: (n) => `${n} perguntas` },
}

type Phase = 'setup' | 'answer' | 'result'

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 80 ? '#16a34a' : score >= 55 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative h-24 w-24 flex-none">
      <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e8ecf6" strokeWidth="9" />
        <circle
          cx="50" cy="50" r="42" fill="none" stroke={tone} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 42}
          strokeDashoffset={2 * Math.PI * 42 * (1 - Math.max(0, Math.min(100, score)) / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-navy-900">
        {score}
      </span>
    </div>
  )
}

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
  const [sessionId, setSessionId] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null)

  const history = useQuery({ queryKey: ['interview-history'], queryFn: getInterviewHistory })

  const startM = useMutation({
    mutationFn: () => startInterview({ role: role.trim(), jobDescription: jd.trim() || undefined, kind }),
    onSuccess: (r) => {
      setSessionId(r.sessionId)
      setQuestions(r.questions)
      setAnswers(r.questions.map(() => ''))
      setPhase('answer')
      qc.invalidateQueries({ queryKey: ['credits'] })
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Could not start interview', 'error'),
  })

  const submitM = useMutation({
    mutationFn: () => submitInterview(sessionId, answers),
    onSuccess: (r) => {
      setFeedback(r)
      setPhase('result')
      qc.invalidateQueries({ queryKey: ['interview-history'] })
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Could not score answers', 'error'),
  })

  const reset = () => {
    setPhase('setup'); setFeedback(null); setQuestions([]); setAnswers([]); setSessionId('')
  }

  return (
    <PageTransition>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{ti.title}</h1>
          <p className="mt-1 text-navy-500">{ti.subtitle}</p>
        </div>
        <Badge tone="info">{ti.cost}</Badge>
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
            <TextArea label={ti.jd} rows={4} value={jd} onChange={(e) => setJd(e.target.value)} />
            <Button className="rounded-full" loading={startM.isPending} disabled={!role.trim()} onClick={() => startM.mutate()}>
              ✦ {ti.start}
            </Button>
          </div>
        </Card>
      )}

      {phase === 'answer' && (
        <Card className="mt-6 max-w-2xl p-6">
          <h2 className="text-lg font-semibold text-navy-900">{ti.answersTitle}</h2>
          <div className="mt-4 space-y-5">
            {questions.map((q, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-navy-800">{i + 1}. {q}</p>
                <TextArea
                  className="mt-2"
                  rows={3}
                  placeholder={ti.answerPlaceholder}
                  value={answers[i] ?? ''}
                  onChange={(e) => setAnswers((a) => a.map((v, j) => (j === i ? e.target.value : v)))}
                />
              </div>
            ))}
          </div>
          <Button className="mt-5 rounded-full" loading={submitM.isPending} onClick={() => submitM.mutate()}>
            {ti.submit}
          </Button>
        </Card>
      )}

      {phase === 'result' && feedback && (
        <Card className="mt-6 max-w-2xl p-6">
          <div className="flex items-center gap-5">
            <ScoreRing score={feedback.overallScore} />
            <div>
              <h2 className="text-lg font-semibold text-navy-900">{ti.scoreTitle}</h2>
              <p className="mt-1 text-sm text-navy-500">{feedback.summary}</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {feedback.perQuestion.map((p, i) => (
              <div key={i} className="rounded-xl border border-navy-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-navy-800">{p.question}</p>
                  <Badge tone={p.rating >= 4 ? 'success' : p.rating >= 3 ? 'info' : 'warning'}>{p.rating}/5</Badge>
                </div>
                <p className="mt-2 text-sm text-navy-500">{p.feedback}</p>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-5 rounded-full" onClick={reset}>
            {ic.newInterview}
          </Button>
        </Card>
      )}

      {(history.data?.length ?? 0) > 0 && (
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
