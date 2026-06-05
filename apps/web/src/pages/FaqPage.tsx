import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input, TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/Toast'
import { listFaq, suggestedQuestions, createFaq, deleteFaq } from '@/services/faq'

interface FaqCopy {
  title: string; subtitle: string; addTitle: string
  question: string; questionPh: string; answer: string; answerPh: string; save: string
  suggested: string; empty: string; saved: string
}

const COPY: Record<Locale, FaqCopy> = {
  en: {
    title: 'Common questions',
    subtitle: 'Answer these once. The extension uses them to autofill open-text fields on application forms.',
    addTitle: 'Add an answer', question: 'Question', questionPh: 'e.g. Why do you want to work here?',
    answer: 'Your answer', answerPh: 'Write a reusable answer the AI can adapt per application…', save: 'Save answer',
    suggested: 'Suggested questions', empty: 'No answers yet — add a few to speed up your applications.', saved: 'Answer saved',
  },
  es: {
    title: 'Preguntas comunes',
    subtitle: 'Respóndelas una vez. La extensión las usa para autocompletar campos de texto abierto en los formularios.',
    addTitle: 'Agregar una respuesta', question: 'Pregunta', questionPh: 'ej. ¿Por qué quieres trabajar aquí?',
    answer: 'Tu respuesta', answerPh: 'Escribe una respuesta reutilizable que la IA pueda adaptar por postulación…', save: 'Guardar respuesta',
    suggested: 'Preguntas sugeridas', empty: 'Aún no hay respuestas — agrega algunas para agilizar tus postulaciones.', saved: 'Respuesta guardada',
  },
  'pt-BR': {
    title: 'Perguntas comuns',
    subtitle: 'Responda uma vez. A extensão as usa para preencher campos de texto aberto nos formulários.',
    addTitle: 'Adicionar uma resposta', question: 'Pergunta', questionPh: 'ex. Por que você quer trabalhar aqui?',
    answer: 'Sua resposta', answerPh: 'Escreva uma resposta reutilizável que a IA possa adaptar por candidatura…', save: 'Salvar resposta',
    suggested: 'Perguntas sugeridas', empty: 'Nenhuma resposta ainda — adicione algumas para agilizar suas candidaturas.', saved: 'Resposta salva',
  },
}

export default function FaqPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const c = useCopy(COPY)
  const { data: faqs, isLoading } = useQuery({ queryKey: ['faq'], queryFn: listFaq })
  const { data: suggested } = useQuery({ queryKey: ['faq', 'suggested'], queryFn: suggestedQuestions })
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const createM = useMutation({
    mutationFn: () => createFaq(question.trim(), answer.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faq'] })
      qc.invalidateQueries({ queryKey: ['credits'] })
      setQuestion('')
      setAnswer('')
      toast(c.saved)
    },
  })
  const deleteM = useMutation({
    mutationFn: deleteFaq,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faq'] }),
  })

  const answered = new Set((faqs ?? []).map((f) => f.question.toLowerCase()))
  const openSuggestions = (suggested ?? []).filter((q) => !answered.has(q.toLowerCase()))

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{c.title}</h1>
      <p className="mt-1 text-navy-500">{c.subtitle}</p>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold text-navy-900">{c.addTitle}</h2>
        <div className="mt-4 space-y-3">
          <Input label={c.question} placeholder={c.questionPh} value={question} onChange={(e) => setQuestion(e.target.value)} />
          <TextArea label={c.answer} rows={3} placeholder={c.answerPh} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <Button className="rounded-full" disabled={!question.trim() || !answer.trim()} loading={createM.isPending} onClick={() => createM.mutate()}>
            {c.save}
          </Button>
        </div>

        {openSuggestions.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{c.suggested}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {openSuggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="rounded-full border border-navy-200 px-3 py-1.5 text-sm text-navy-600 transition-colors hover:border-electric-400 hover:text-electric-600"
                >
                  + {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <Card className="p-6"><Skeleton className="h-16 w-full" /></Card>
        ) : (faqs ?? []).length === 0 ? (
          <Card className="p-6 text-center text-sm text-navy-400">{c.empty}</Card>
        ) : (
          faqs!.map((f) => (
            <Card key={f.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-navy-900">{f.question}</p>
                <button onClick={() => deleteM.mutate(f.id)} className="flex-none text-navy-300 hover:text-red-500" aria-label="Delete">
                  ✕
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-navy-600">{f.answer}</p>
            </Card>
          ))
        )}
      </div>
    </PageTransition>
  )
}
