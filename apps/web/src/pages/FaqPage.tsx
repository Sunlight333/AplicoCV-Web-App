import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input, TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/Toast'
import { listFaq, suggestedQuestions, createFaq, deleteFaq } from '@/services/faq'

export default function FaqPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
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
      toast('Answer saved')
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
      <h1 className="text-2xl font-bold text-navy-900">Common questions</h1>
      <p className="mt-1 text-navy-500">
        Answer these once. The extension uses them to autofill open-text fields on application forms.
      </p>

      {/* Add an answer */}
      <Card className="mt-6 p-6">
        <h2 className="font-semibold text-navy-900">Add an answer</h2>
        <div className="mt-4 space-y-3">
          <Input
            label="Question"
            placeholder="e.g. Why do you want to work here?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <TextArea
            label="Your answer"
            rows={3}
            placeholder="Write a reusable answer the AI can adapt per application…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <Button
            className="rounded-full"
            disabled={!question.trim() || !answer.trim()}
            loading={createM.isPending}
            onClick={() => createM.mutate()}
          >
            Save answer
          </Button>
        </div>

        {openSuggestions.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Suggested questions</p>
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

      {/* Saved answers */}
      <div className="mt-6 space-y-3">
        {isLoading ? (
          <Card className="p-6"><Skeleton className="h-16 w-full" /></Card>
        ) : (faqs ?? []).length === 0 ? (
          <Card className="p-6 text-center text-sm text-navy-400">
            No answers yet — add a few to speed up your applications.
          </Card>
        ) : (
          faqs!.map((f) => (
            <Card key={f.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-navy-900">{f.question}</p>
                <button
                  onClick={() => deleteM.mutate(f.id)}
                  className="flex-none text-navy-300 hover:text-red-500"
                  aria-label="Delete"
                >
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
