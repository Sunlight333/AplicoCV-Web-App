import { useCallback, useEffect, useMemo, useState } from 'react'
import { STEPS, TERMINAL_KINDS, type Step } from './funnelConfig'

// Funnel state: the current step index + the map of collected answers, persisted
// to localStorage so a reload (or a distracted user) doesn't lose progress. Nothing
// here is sensitive — the account isn't created until the very end of the flow.

const KEY = 'aplicocv.funnel.v1'

export interface FunnelState {
  index: number
  answers: Record<string, unknown>
}

function load(): FunnelState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as FunnelState
      if (typeof parsed.index === 'number' && parsed.answers) {
        // Never resume onto a terminal screen (matching/success/paywall) — those
        // recompute from answers; land the returning user on the last question.
        const safeIndex = Math.min(parsed.index, lastQuestionIndex())
        return { index: Math.max(0, safeIndex), answers: parsed.answers }
      }
    }
  } catch {
    /* fall through to a fresh start */
  }
  return { index: 0, answers: {} }
}

function lastQuestionIndex(): number {
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (!TERMINAL_KINDS.has(STEPS[i].kind)) return i
  }
  return 0
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
  // Progress counts questions answered, ignoring the terminal payoff screens.
  const questionSteps = useMemo(
    () => STEPS.filter((s) => !TERMINAL_KINDS.has(s.kind)).length,
    [],
  )
  const questionsBefore = useMemo(
    () => STEPS.slice(0, state.index).filter((s) => !TERMINAL_KINDS.has(s.kind)).length,
    [state.index],
  )
  const progress = Math.min(1, questionsBefore / questionSteps)

  const setAnswer = useCallback((key: string, value: unknown) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [key]: value } }))
  }, [])

  const next = useCallback(() => {
    setState((s) => ({ ...s, index: Math.min(total - 1, s.index + 1) }))
  }, [total])

  const back = useCallback(() => {
    setState((s) => ({ ...s, index: Math.max(0, s.index - 1) }))
  }, [])

  const reset = useCallback(() => {
    setState({ index: 0, answers: {} })
  }, [])

  const isFirst = state.index === 0
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
