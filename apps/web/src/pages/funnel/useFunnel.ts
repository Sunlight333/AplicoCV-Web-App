import { useCallback, useEffect, useMemo, useState } from 'react'
import { STEPS, TERMINAL_KINDS, type Answers, type Step } from './funnelConfig'

// Funnel state: the current step index + the map of collected answers, persisted
// to localStorage so a reload (or a distracted user) doesn't lose progress. Nothing
// here is sensitive — the account isn't created until the very end of the flow.

const KEY = 'aplicocv.funnel.v2'

export interface FunnelState {
  index: number
  answers: Answers
}

/** A step is shown only when it has no condition, or its condition passes for the
 *  current answers. This is the adaptive branching (e.g. US-only questions). */
function visible(step: Step, answers: Answers): boolean {
  return !step.condition || step.condition(answers)
}

function firstVisibleFrom(index: number, dir: 1 | -1, answers: Answers): number {
  let i = index
  while (i >= 0 && i < STEPS.length) {
    if (visible(STEPS[i], answers)) return i
    i += dir
  }
  // Clamp: no visible step in that direction — stay at the nearest bound.
  return Math.max(0, Math.min(STEPS.length - 1, index - dir))
}

function lastQuestionIndex(): number {
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (!TERMINAL_KINDS.has(STEPS[i].kind)) return i
  }
  return 0
}

function load(): FunnelState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as FunnelState
      if (typeof parsed.index === 'number' && parsed.answers) {
        // Never resume onto a terminal screen (matching/success/paywall) — those
        // recompute from answers; land the returning user on the last question.
        const clamped = Math.min(parsed.index, lastQuestionIndex())
        const safe = firstVisibleFrom(Math.max(0, clamped), -1, parsed.answers)
        return { index: safe, answers: parsed.answers }
      }
    }
  } catch {
    /* fall through to a fresh start */
  }
  return { index: 0, answers: {} }
}

export function useFunnel() {
  const [state, setState] = useState<FunnelState>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage full / disabled — the funnel still works in-memory */
    }
  }, [state])

  const step: Step = STEPS[state.index]

  const total = STEPS.length

  // Progress counts the VISIBLE question steps (skipped branches don't inflate the
  // denominator, so the bar stays honest as the flow adapts).
  const { progress, isFirst } = useMemo(() => {
    const isQuestion = (s: Step) => !TERMINAL_KINDS.has(s.kind)
    const visibleQuestions = STEPS.filter((s) => isQuestion(s) && visible(s, state.answers)).length
    const done = STEPS.slice(0, state.index).filter((s) => isQuestion(s) && visible(s, state.answers)).length
    const firstVisible = firstVisibleFrom(0, 1, state.answers)
    return {
      progress: visibleQuestions ? Math.min(1, done / visibleQuestions) : 0,
      isFirst: state.index === firstVisible,
    }
  }, [state.index, state.answers])

  const setAnswer = useCallback((key: string, value: unknown) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [key]: value } }))
  }, [])

  const next = useCallback(() => {
    setState((s) => {
      const target = firstVisibleFrom(Math.min(total - 1, s.index + 1), 1, s.answers)
      return { ...s, index: target }
    })
  }, [total])

  const back = useCallback(() => {
    setState((s) => {
      const target = firstVisibleFrom(Math.max(0, s.index - 1), -1, s.answers)
      return { ...s, index: target }
    })
  }, [])

  const reset = useCallback(() => {
    setState({ index: 0, answers: {} })
  }, [])

  const isLast = state.index === total - 1

  return {
    step,
    index: state.index,
    total,
    progress,
    answers: state.answers,
    setAnswer,
    next,
    back,
    reset,
    isFirst,
    isLast,
  }
}
