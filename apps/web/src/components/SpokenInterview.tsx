import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// Realistic interview drill: an avatar SPEAKS each question (the text stays hidden),
// you get a countdown to answer out loud, then the next question. Nothing is
// recorded or stored — you talk to the screen, for yourself, with the avatar watching.

const ANSWER_SECONDS = 180 // 3 minutes per question

// BCP-47 voice language for the Web Speech API, by app locale.
const TTS_LANG: Record<string, string> = { en: 'en-US', es: 'es-ES', 'pt-BR': 'pt-BR' }

const COPY = {
  en: {
    listen: 'Listen to the question',
    speaking: 'The interviewer is asking…',
    answerNow: 'Answer out loud — you have',
    repeat: 'Repeat question',
    next: 'Next question',
    finish: 'Finish',
    q: (i: number, n: number) => `Question ${i} of ${n}`,
    doneTitle: 'Practice complete',
    doneSub: 'Your voice and answers were never recorded — no microphone is used. Only the questions are saved, so you can revisit the session. Run it again anytime.',
    again: 'Practice again',
    noVoice: 'Your browser can’t speak the question aloud, so it’s shown below.',
  },
  es: {
    listen: 'Escucha la pregunta',
    speaking: 'El entrevistador está preguntando…',
    answerNow: 'Responde en voz alta — tienes',
    repeat: 'Repetir pregunta',
    next: 'Siguiente pregunta',
    finish: 'Finalizar',
    q: (i: number, n: number) => `Pregunta ${i} de ${n}`,
    doneTitle: 'Práctica completa',
    doneSub: 'Tu voz y tus respuestas nunca se grabaron — no se usa micrófono. Solo se guardan las preguntas para que puedas repasar la sesión. Repítela cuando quieras.',
    again: 'Practicar de nuevo',
    noVoice: 'Tu navegador no puede leer la pregunta en voz alta, así que se muestra abajo.',
  },
  'pt-BR': {
    listen: 'Ouça a pergunta',
    speaking: 'O entrevistador está perguntando…',
    answerNow: 'Responda em voz alta — você tem',
    repeat: 'Repetir pergunta',
    next: 'Próxima pergunta',
    finish: 'Finalizar',
    q: (i: number, n: number) => `Pergunta ${i} de ${n}`,
    doneTitle: 'Prática concluída',
    doneSub: 'Sua voz e suas respostas nunca foram gravadas — nenhum microfone é usado. Apenas as perguntas são salvas, para você rever a sessão. Repita quando quiser.',
    again: 'Praticar de novo',
    noVoice: 'Seu navegador não consegue falar a pergunta, então ela aparece abaixo.',
  },
} as const

function mmss(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export function SpokenInterview({
  questions,
  locale,
  onDone,
}: {
  questions: string[]
  locale: string
  onDone: () => void
}) {
  const c = COPY[(locale as keyof typeof COPY)] ?? COPY.en
  const [idx, setIdx] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [remaining, setRemaining] = useState(ANSWER_SECONDS)
  const [finished, setFinished] = useState(false)
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  // Holds the latest `advance` so the timer can move the round on without being
  // re-created every question (which would restart the countdown).
  const advanceRef = useRef<() => void>(() => {})

  const startTimer = useCallback(() => {
    clearTimer()
    setRemaining(ANSWER_SECONDS)
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearTimer()
          // Time's up → go to the next question automatically, "until the round is
          // complete". It used to stop at 0:00 and wait for a click, which is not a
          // rehearsal — a real interviewer moves on.
          setTimeout(() => advanceRef.current(), 0)
          return 0
        }
        return r - 1
      })
    }, 1000)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!canSpeak) {
        startTimer()
        return
      }
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = TTS_LANG[locale] ?? 'en-US'
      u.rate = 0.95
      u.onstart = () => setSpeaking(true)
      u.onend = () => {
        setSpeaking(false)
        startTimer()
      }
      u.onerror = () => {
        setSpeaking(false)
        startTimer()
      }
      window.speechSynthesis.speak(u)
    },
    [canSpeak, locale, startTimer],
  )

  // Ask the current question whenever it changes.
  useEffect(() => {
    if (finished) return
    speak(questions[idx] ?? '')
    return () => {
      if (canSpeak) window.speechSynthesis.cancel()
      clearTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, finished])

  const advance = () => {
    if (canSpeak) window.speechSynthesis.cancel()
    clearTimer()
    if (idx + 1 >= questions.length) {
      setFinished(true)
    } else {
      setIdx((i) => i + 1)
    }
  }
  advanceRef.current = advance

  if (finished) {
    return (
      <Card className="mt-6 max-w-2xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
        <h2 className="mt-4 text-lg font-semibold text-navy-900">{c.doneTitle}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-navy-500">{c.doneSub}</p>
        <Button className="mt-5 rounded-full" onClick={onDone}>{c.again}</Button>
      </Card>
    )
  }

  return (
    <Card className="mt-6 max-w-2xl p-8">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-navy-400">
        {c.q(idx + 1, questions.length)}
      </p>

      {/* Avatar — pulses while the interviewer speaks; watches while you answer. */}
      <div className="mt-6 flex flex-col items-center">
        <div className="relative">
          {speaking && (
            <span className="absolute inset-0 animate-ping rounded-full bg-electric-300/60" />
          )}
          <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-brand-gradient shadow-glow">
            <img src="/avatars/avatar-01.png" alt="" className="h-full w-full object-cover" />
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-navy-600">
          {speaking ? c.speaking : `${c.answerNow} ${mmss(remaining)}`}
        </p>
      </div>

      {/* Countdown bar (only while answering). */}
      {!speaking && (
        <div className="mx-auto mt-4 h-2 w-full max-w-sm overflow-hidden rounded-full bg-navy-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-electric-400 to-violet-500 transition-[width] duration-1000 ease-linear"
            style={{ width: `${(remaining / ANSWER_SECONDS) * 100}%` }}
          />
        </div>
      )}

      {/* Fallback: if the browser can't speak, show the text so it's still usable. */}
      {!canSpeak && <p className="mt-4 text-center text-sm text-navy-500">{c.noVoice}<br />{questions[idx]}</p>}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" className="rounded-full" onClick={() => speak(questions[idx] ?? '')} disabled={speaking}>
          {c.repeat}
        </Button>
        <Button className="rounded-full" onClick={advance}>
          {idx + 1 >= questions.length ? c.finish : c.next}
        </Button>
      </div>
    </Card>
  )
}
