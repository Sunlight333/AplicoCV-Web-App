// Credit cost per AI action — mirrors credit_service.AI_COSTS on the backend so the
// UI can show what each tool costs (client feedback: tools must not look "free").
// Actions not listed here are free (e.g. the basic ATS keyword score).
export const AI_COSTS = {
  super_cv: 50,
  cover_letter: 20,
  cover_letter_pro: 40,
  personal_analysis: 10,
  skill_suggestions: 10,
  interview: 30,
  predictive_score: 15,
  ats_simulate: 15,
  ghost_recruiter: 10,
  salary_insights: 15,
  field_answer: 5,
} as const

export type AiAction = keyof typeof AI_COSTS

/** Localized "(N credits)" / "Free" label for a button. */
export function costLabel(action: AiAction | 0, locale: string): string {
  const credits =
    locale.startsWith('es') ? 'créditos' : locale.startsWith('pt') ? 'créditos' : 'credits'
  const free = locale.startsWith('es') ? 'Gratis' : locale.startsWith('pt') ? 'Grátis' : 'Free'
  if (action === 0) return free
  return `${AI_COSTS[action]} ${credits}`
}
