// Declarative definition of the conversational onboarding funnel (Enfoque 2.0).
//
// The whole flow is DATA, not hand-wired components: FunnelPage walks this array
// and renders one <FunnelStep> per entry. Adding, removing or reordering a screen
// is editing this file — no component changes. Copy is localised inline (EN/ES/PT-BR)
// following the same per-locale pattern the rest of the app uses (IntakeWidget,
// CopilotPage), so the funnel stays self-contained.
//
// Modelled on the client's sanctioned reference (Global Work AI): empathy questions
// interleaved with value/social-proof interstitials, CV upload mid-flow, then
// matching → success → account → paywall. Numbers we show are meant to be REAL
// (wired to the live search), not fabricated — that is our differentiator.

import { COUNTRIES } from './countries'

export type Locale = 'en' | 'es' | 'pt-BR'

/** A string localised to the three supported locales. */
export type Localized = Record<Locale, string>

/** Terse helper so step definitions read as `L('English', 'Español', 'Português')`. */
export const L = (en: string, es: string, pt: string): Localized => ({ en, es, 'pt-BR': pt })

/** Pick the active locale's string, falling back to English. */
export const tr = (l: Localized, locale: string): string =>
  l[(locale as Locale)] ?? l.en

export interface Choice {
  id: string
  label: Localized
  emoji?: string
  // For multi-select: an "open to anything" option that subsumes the rest —
  // picking it clears the others, and picking any other clears it.
  exclusive?: boolean
}

/** The chapters shown in the progress bar, in order. */
export const CHAPTERS = ['current', 'seeking', 'experience', 'help', 'finish'] as const
export type Chapter = (typeof CHAPTERS)[number]

export const CHAPTER_LABEL: Record<Chapter, Localized> = {
  current: L('Your situation', 'Tu situación', 'Sua situação'),
  seeking: L('What you want', 'Lo que buscás', 'O que você busca'),
  experience: L('Your experience', 'Tu experiencia', 'Sua experiência'),
  help: L('How we help', 'Cómo te ayudamos', 'Como ajudamos'),
  finish: L('Almost there', 'Ya casi', 'Quase lá'),
}

/** The answers collected so far — a flat map keyed by each step's `saveTo`. */
export type Answers = Record<string, unknown>

// ---- Step shapes -----------------------------------------------------------

interface Base {
  id: string
  chapter: Chapter
  // Adaptive branching: when present and it returns false, the step is skipped.
  // This is how the funnel stays short and relevant — e.g. US work-authorization
  // questions never show to a LATAM user. The reference asks everyone everything.
  condition?: (a: Answers) => boolean
  // A short line the copilot "says" above the question, so the flow reads as a
  // conversation rather than a form. May adapt to prior answers.
  copilot?: (a: Answers, locale: string) => string
}

export type Step =
  | (Base & {
      kind: 'single'
      question: Localized
      sub?: Localized
      options: Choice[]
      saveTo: string
    })
  | (Base & {
      kind: 'multi'
      question: Localized
      sub?: Localized
      options: Choice[]
      saveTo: string
      min?: number
    })
  | (Base & {
      kind: 'affirm' // Yes/No empathy card ("¿Te identificas con…?")
      statement: Localized
      saveTo: string
    })
  | (Base & {
      kind: 'slider'
      question: Localized
      saveTo: string
      min: number
      max: number
      step: number
      // e.g. "USD/mo" — shown after the value
      unit: Localized
    })
  | (Base & {
      kind: 'country'
      question: Localized
      sub?: Localized
      saveTo: string
    })
  | (Base & {
      kind: 'interstitial' // value / education / social-proof, single CONTINUE
      emoji: string
      title: Localized
      body: Localized
      // optional highlighted stat rendered large above the title
      stat?: Localized
    })
  | (Base & {
      kind: 'testimonial'
      quote: Localized
      author: string
      role: Localized
    })
  | (Base & {
      // Personalized mirror: content is COMPUTED from the user's own answers, so
      // the screen reflects their exact situation back to them. This is the core of
      // "make them feel understood" — the reference has nothing like it.
      kind: 'reflect'
      build: (a: Answers, locale: string) => { emoji: string; title: string; body: string; stat?: string }
    })
  | (Base & { kind: 'upload' })
  | (Base & {
      // Mid-funnel account creation ("let's save your progress"). Placed at the
      // emotional peak so that by the paywall the account already exists and the
      // user can pay directly. Still shows the progress bar (it's not a terminal).
      kind: 'register'
    })
  | (Base & { kind: 'matching' })
  | (Base & { kind: 'success' })
  | (Base & { kind: 'email' })
  | (Base & { kind: 'paywall' })

// Steps that don't count toward the "question progress" bar (terminals + payoff).
// `register` is deliberately NOT here — the client wants the progress bar (e.g. 78%)
// to stay visible while the user saves their details, so it counts like a question.
export const TERMINAL_KINDS = new Set(['matching', 'success', 'email', 'paywall'])

// ---- Personalization helpers ----------------------------------------------
// Small label maps so the copilot lines and the "reflect" screens can speak the
// user's own answers back to them in natural language.

const STATUS_WORD: Record<string, Localized> = {
  unemployed: L('between jobs', 'sin empleo', 'sem emprego'),
  employed: L('working and looking', 'con empleo y buscando', 'empregado e buscando'),
  freelance: L('freelancing', 'trabajando por tu cuenta', 'como freelancer'),
  student: L('starting out', 'empezando tu carrera', 'começando a carreira'),
}
const TIME_WORD: Record<string, Localized> = {
  just: L('just getting started', 'recién empezando', 'começando agora'),
  '1-3': L('at it for a couple of months', 'buscando hace un par de meses', 'buscando há alguns meses'),
  '3-6': L('searching for months now', 'buscando hace varios meses', 'buscando há vários meses'),
  '6+': L('been searching a long while', 'buscando hace bastante', 'buscando há bastante tempo'),
}
const MODALITY_WORD: Record<string, Localized> = {
  remote: L('fully remote', 'completamente remoto', 'totalmente remoto'),
  hybrid: L('hybrid', 'híbrido', 'híbrido'),
  onsite: L('on-site', 'presencial', 'presencial'),
}

/** Resolve a stored id to its localized word, or '' if unknown. */
const word = (map: Record<string, Localized>, id: unknown, locale: string): string =>
  typeof id === 'string' && map[id] ? tr(map[id], locale) : ''

const countryName = (code: unknown): string => {
  const c = COUNTRIES.find((x) => x.code === code)
  return c ? `${c.flag} ${c.name}` : ''
}

// ---- The funnel ------------------------------------------------------------

export const STEPS: Step[] = [
  // ===== Chapter 1 — current situation =====================================
  {
    id: 'work_status',
    chapter: 'current',
    kind: 'single',
    saveTo: 'workStatus',
    copilot: () => '', // first question — the greeting is shown by the header
    question: L(
      'What’s your current work situation?',
      '¿Cuál es tu situación laboral actual?',
      'Qual é a sua situação profissional atual?',
    ),
    options: [
      { id: 'unemployed', emoji: '🔍', label: L('Unemployed', 'Estoy sin empleo', 'Estou sem emprego') },
      { id: 'employed', emoji: '💼', label: L('Employed', 'Tengo empleo', 'Tenho emprego') },
      { id: 'freelance', emoji: '🧑‍💻', label: L('Self-employed / freelance', 'Cuenta propia / freelance', 'Autônomo / freelance') },
      { id: 'student', emoji: '🎓', label: L('Student / first job', 'Estudiante / primer empleo', 'Estudante / primeiro emprego') },
    ],
  },
  {
    id: 'search_focus',
    chapter: 'current',
    kind: 'single',
    saveTo: 'searchFocus',
    question: L(
      'How are you approaching your job search right now?',
      '¿Cómo estás encarando tu búsqueda ahora mismo?',
      'Como você está encarando sua busca agora?',
    ),
    options: [
      { id: 'active', emoji: '🚀', label: L('Actively looking', 'Buscando activamente', 'Buscando ativamente') },
      { id: 'open', emoji: '👀', label: L('Open to opportunities', 'Abierto a oportunidades', 'Aberto a oportunidades') },
      { id: 'exploring', emoji: '🧭', label: L('Just exploring', 'Solo explorando', 'Só explorando') },
    ],
  },
  {
    id: 'search_time',
    chapter: 'current',
    kind: 'single',
    saveTo: 'searchTime',
    question: L(
      'How long have you been looking?',
      '¿Cuánto tiempo llevás buscando?',
      'Há quanto tempo você está procurando?',
    ),
    options: [
      { id: 'just', label: L('Just started (<1 month)', 'Recién empiezo (<1 mes)', 'Acabei de começar (<1 mês)') },
      { id: '1-3', label: L('1–3 months', '1–3 meses', '1–3 meses') },
      { id: '3-6', label: L('3–6 months', '3–6 meses', '3–6 meses') },
      { id: '6+', label: L('6+ months', '6+ meses', '6+ meses') },
    ],
  },
  {
    // Personalized mirror #1 — reads their exact status + search duration back to
    // them, with empathy calibrated to how long they've been at it.
    id: 'reflect_current',
    chapter: 'current',
    kind: 'reflect',
    build: (a, locale) => {
      const status = word(STATUS_WORD, a.workStatus, locale)
      const time = word(TIME_WORD, a.searchTime, locale)
      const longSearch = a.searchTime === '3-6' || a.searchTime === '6+'
      return {
        emoji: longSearch ? '🤝' : '👋',
        title: tr(
          L(
            `You’re ${status || 'here'} and ${time || 'looking'} — we’ve got you.`,
            `Estás ${status || 'acá'} y ${time || 'buscando'} — estamos con vos.`,
            `Você está ${status || 'aqui'} e ${time || 'buscando'} — estamos com você.`,
          ),
          locale,
        ),
        body: tr(
          longSearch
            ? L(
                'A long search usually isn’t about you — it’s about being buried under hundreds of applicants and filtered out by software. That’s exactly what we fix.',
                'Una búsqueda larga rara vez es por vos — es quedar sepultado entre cientos de postulantes y filtrado por software. Eso es justo lo que resolvemos.',
                'Uma busca longa raramente é sobre você — é ficar soterrado entre centenas de candidatos e filtrado por software. É exatamente isso que resolvemos.',
              )
            : L(
                'Great moment to start right. We’ll aim your search where you actually have an edge, so you don’t waste weeks.',
                'Buen momento para arrancar bien. Vamos a apuntar tu búsqueda donde realmente tenés ventaja, para que no pierdas semanas.',
                'Ótimo momento para começar certo. Vamos direcionar sua busca onde você realmente tem vantagem, sem perder semanas.',
              ),
          locale,
        ),
      }
    },
  },

  // ===== Chapter 2 — what you want ========================================
  {
    id: 'goal',
    chapter: 'seeking',
    kind: 'multi',
    saveTo: 'goals',
    question: L('What are you looking for?', '¿Qué estás buscando?', 'O que você está buscando?'),
    sub: L('Choose all that apply', 'Elegí todas las que apliquen', 'Escolha todas que se aplicam'),
    options: [
      { id: 'career_change', label: L('A career change', 'Un cambio de carrera', 'Uma mudança de carreira') },
      { id: 'extra_income', label: L('Extra income', 'Ingresos adicionales', 'Renda extra') },
      { id: 'urgent_income', label: L('Urgent income', 'Ingresos urgentes', 'Renda urgente') },
      { id: 'first_fulltime', label: L('First full-time job', 'Primer empleo full-time', 'Primeiro emprego full-time') },
      { id: 'work_life', label: L('Work–life balance', 'Equilibrio vida–trabajo', 'Equilíbrio vida–trabalho') },
      { id: 'long_term', label: L('A long-term role', 'Un empleo a largo plazo', 'Um emprego de longo prazo') },
      { id: 'growth', label: L('Professional growth', 'Crecimiento profesional', 'Crescimento profissional') },
    ],
  },
  {
    id: 'job_type',
    chapter: 'seeking',
    kind: 'multi',
    saveTo: 'jobTypes',
    question: L('What type of work interests you?', '¿Qué tipo de trabajo te interesa?', 'Que tipo de trabalho te interessa?'),
    options: [
      { id: 'fulltime', label: L('Full-time', 'Tiempo completo', 'Tempo integral') },
      { id: 'parttime', label: L('Part-time', 'Medio tiempo', 'Meio período') },
      { id: 'contract', label: L('Freelance / contract', 'Freelance / contrato', 'Freelance / contrato') },
      { id: 'internship', label: L('Internship', 'Prácticas', 'Estágio') },
    ],
  },
  {
    id: 'salary',
    chapter: 'seeking',
    kind: 'slider',
    saveTo: 'minSalary',
    question: L('What’s your minimum desired salary?', '¿Cuál es tu salario mínimo deseado?', 'Qual é o seu salário mínimo desejado?'),
    min: 500,
    max: 15000,
    step: 100,
    unit: L('USD/mo', 'USD/mes', 'USD/mês'),
  },
  {
    // Multi-select (client feedback 18.07): a job seeker can be open to remote AND
    // hybrid, and this is key input for where the search engine aims — pick-one was
    // silently narrowing their matches.
    id: 'modality',
    chapter: 'seeking',
    kind: 'multi',
    saveTo: 'modality',
    min: 1,
    question: L('What work styles are you open to?', '¿Qué modalidades estás dispuesto a considerar?', 'Quais modalidades você considera?'),
    sub: L('Pick every one that works for you', 'Elegí todas las que te sirvan', 'Escolha todas que funcionam para você'),
    options: [
      { id: 'remote', emoji: '🏠', label: L('Fully remote', 'Completamente remoto', 'Totalmente remoto') },
      { id: 'hybrid', emoji: '🔀', label: L('Hybrid', 'Híbrido', 'Híbrido') },
      { id: 'onsite', emoji: '🏢', label: L('On-site', 'En oficina', 'No escritório') },
    ],
  },
  {
    id: 'affirm_200',
    chapter: 'seeking',
    kind: 'affirm',
    saveTo: 'a_200apps',
    statement: L(
      'Every job I like on LinkedIn already has 200+ applicants.',
      'Cada empleo que me gusta en LinkedIn ya tiene 200+ postulantes.',
      'Toda vaga que gosto no LinkedIn já tem 200+ candidatos.',
    ),
  },
  {
    id: 'country',
    chapter: 'seeking',
    kind: 'country',
    saveTo: 'country',
    question: L('Where are you based?', '¿En qué país estás?', 'Em que país você está?'),
    sub: L(
      'We use this to match roles open in your region.',
      'Lo usamos para encontrar roles abiertos en tu región.',
      'Usamos isso para encontrar vagas abertas na sua región.',
    ),
  },
  {
    // Branching: only US-based users get the work-authorization question. A LATAM
    // user never sees it — that's a concrete way we're smarter than the reference,
    // which asks everyone about US visas regardless of where they live.
    id: 'us_auth',
    chapter: 'seeking',
    kind: 'single',
    saveTo: 'usAuth',
    condition: (a) => a.country === 'US',
    question: L('What’s your US work authorization?', '¿Cuál es tu autorización para trabajar en EE. UU.?', 'Qual é a sua autorização para trabalhar nos EUA?'),
    options: [
      { id: 'citizen', label: L('Citizen / permanent resident', 'Ciudadano / residente permanente', 'Cidadão / residente permanente') },
      { id: 'visa', label: L('Valid work visa', 'Visa de trabajo válida', 'Visto de trabalho válido') },
      { id: 'student', label: L('Student authorization (OPT/CPT)', 'Autorización de estudiante (OPT/CPT)', 'Autorização de estudante (OPT/CPT)') },
      { id: 'need_sponsor', label: L('I’ll need sponsorship', 'Necesitaré patrocinio', 'Vou precisar de patrocínio') },
    ],
  },
  {
    // Branching: skip entirely for on-site seekers.
    id: 'why_remote',
    chapter: 'seeking',
    kind: 'multi',
    saveTo: 'whyRemote',
    condition: (a) => {
      const m = a.modality
      return Array.isArray(m) ? m.includes('remote') || m.includes('hybrid') : m === 'remote' || m === 'hybrid'
    },
    question: L('What do you value most about remote work?', '¿Qué es lo que más valorás del trabajo remoto?', 'O que você mais valoriza no trabalho remoto?'),
    options: [
      { id: 'no_commute', label: L('No commute', 'Sin tiempo de traslado', 'Sem deslocamento') },
      { id: 'family', label: L('Family / personal needs', 'Necesidades familiares / personales', 'Necessidades familiares / pessoais') },
      { id: 'more_opportunities', label: L('More opportunities', 'Más oportunidades', 'Mais oportunidades') },
      { id: 'anywhere', label: L('Work from anywhere', 'Trabajar desde cualquier lugar', 'Trabalhar de qualquer lugar') },
      { id: 'flexible', label: L('Flexible hours', 'Horario flexible', 'Horário flexível') },
    ],
  },
  {
    id: 'value_hidden',
    chapter: 'seeking',
    kind: 'interstitial',
    emoji: '🧊',
    title: L('Most jobs are hidden', 'La mayoría de los empleos están ocultos', 'A maioria das vagas está escondida'),
    body: L(
      'Most job seekers only ever see about a quarter of what’s out there. We scan 1,000+ sources every day to surface the rest.',
      'La mayoría de las personas solo ve una cuarta parte de lo que existe. Escaneamos 1.000+ fuentes cada día para encontrar el resto.',
      'A maioria só vê cerca de um quarto do que existe. Escaneamos 1.000+ fontes por dia para encontrar o resto.',
    ),
  },

  // ===== Chapter 3 — your experience ======================================
  {
    id: 'categories',
    chapter: 'experience',
    kind: 'multi',
    saveTo: 'categories',
    // Client 24.07: be explicit that THIS answer drives the recommendations, and offer
    // a wider set of categories (he got "Software" roles he never asked for).
    question: L('Which job categories interest you?', '¿Qué categorías de trabajo te interesan?', 'Quais categorias de trabalho te interessam?'),
    sub: L(
      'We search for jobs based on this — pick every area you’d take.',
      'Buscamos empleos en base a esto — elegí todas las áreas que aceptarías.',
      'Buscamos vagas com base nisto — escolha todas as áreas que você aceitaria.',
    ),
    options: [
      { id: 'any', emoji: '✨', exclusive: true, label: L('Open to anything', 'Abierto a cualquier rol', 'Aberto a qualquer cargo') },
      { id: 'sales', emoji: '📈', label: L('Sales & partnerships', 'Ventas y alianzas', 'Vendas e parcerias') },
      { id: 'marketing', emoji: '📣', label: L('Marketing & PR', 'Marketing y RR.PP.', 'Marketing e RP') },
      { id: 'software', emoji: '💻', label: L('IT & software', 'TI y software', 'TI e software') },
      { id: 'design', emoji: '🎨', label: L('Design (UX, product)', 'Diseño (UX, producto)', 'Design (UX, produto)') },
      { id: 'ops', emoji: '⚙️', label: L('Admin & operations', 'Administración y operaciones', 'Admin. e operações') },
      { id: 'data', emoji: '📊', label: L('Data & analytics', 'Datos y análisis', 'Dados e análise') },
      { id: 'finance', emoji: '💰', label: L('Finance', 'Finanzas', 'Finanças') },
      { id: 'hr', emoji: '🧑‍🤝‍🧑', label: L('HR & recruiting', 'RR.HH. y reclutamiento', 'RH e recrutamento') },
      { id: 'customer', emoji: '🎧', label: L('Customer support', 'Atención al cliente', 'Atendimento ao cliente') },
      { id: 'engineering', emoji: '⚙', label: L('Engineering & manufacturing', 'Ingeniería y manufactura', 'Engenharia e manufatura') },
      { id: 'health', emoji: '🩺', label: L('Health & medicine', 'Salud y medicina', 'Saúde e medicina') },
      { id: 'education', emoji: '🎓', label: L('Education & training', 'Educación y formación', 'Educação e formação') },
      { id: 'legal', emoji: '⚖', label: L('Legal', 'Legal', 'Jurídico') },
      { id: 'logistics', emoji: '🚚', label: L('Logistics & supply chain', 'Logística y cadena de suministro', 'Logística e cadeia de suprimentos') },
      { id: 'hospitality', emoji: '🍽', label: L('Hospitality & tourism', 'Hostelería y turismo', 'Hotelaria e turismo') },
      { id: 'construction', emoji: '🏗', label: L('Construction & trades', 'Construcción y oficios', 'Construção e ofícios') },
      { id: 'retail', emoji: '🛍', label: L('Retail', 'Retail y comercio', 'Varejo') },
      { id: 'media', emoji: '🎬', label: L('Media & communications', 'Medios y comunicación', 'Mídia e comunicação') },
    ],
  },
  {
    id: 'education',
    chapter: 'experience',
    kind: 'single',
    saveTo: 'education',
    question: L('What’s your highest level of education?', '¿Cuál es tu nivel de educación más alto?', 'Qual é o seu maior nível de educação?'),
    options: [
      { id: 'none', label: L('No formal education', 'Sin educación formal', 'Sem educação formal') },
      { id: 'highschool', label: L('High school', 'Secundario', 'Ensino médio') },
      { id: 'technical', label: L('Technical', 'Técnico', 'Técnico') },
      { id: 'bachelor', label: L('Bachelor’s', 'Licenciatura', 'Graduação') },
      { id: 'master', label: L('Master’s', 'Maestría', 'Mestrado') },
      { id: 'doctorate', label: L('Doctorate', 'Doctorado', 'Doutorado') },
    ],
  },
  {
    id: 'level',
    chapter: 'experience',
    kind: 'single',
    saveTo: 'level',
    question: L('What’s your current professional level?', '¿Cuál es tu nivel profesional actual?', 'Qual é o seu nível profissional atual?'),
    options: [
      { id: 'entry', label: L('Entry level', 'Principiante', 'Iniciante') },
      { id: 'junior', label: L('Junior (<2 yrs)', 'Junior (<2 años)', 'Júnior (<2 anos)') },
      { id: 'mid', label: L('Mid (2–4 yrs)', 'Intermedio (2–4 años)', 'Pleno (2–4 anos)') },
      { id: 'senior', label: L('Senior (5+ yrs)', 'Senior (5+ años)', 'Sênior (5+ anos)') },
      { id: 'lead', label: L('Lead / Manager', 'Líder / Gerente', 'Líder / Gerente') },
      { id: 'exec', label: L('Director / VP+', 'Director / VP+', 'Diretor / VP+') },
    ],
  },
  {
    id: 'affirm_blackhole',
    chapter: 'experience',
    kind: 'affirm',
    saveTo: 'a_blackhole',
    statement: L(
      'I worry my CV disappears into a black hole after I apply.',
      'Me preocupa que mi CV desaparezca en un agujero negro al postular.',
      'Tenho medo de que meu currículo suma num buraco negro quando me candidato.',
    ),
  },
  {
    id: 'value_ats',
    chapter: 'experience',
    kind: 'interstitial',
    emoji: '🤖',
    title: L(
      'From black holes to answers',
      'De agujeros negros a respuestas',
      'De buracos negros a respostas',
    ),
    body: L(
      'Most CVs are filtered by software (ATS) before a human ever reads them. We tune your CV to pass those filters — and to reach the people who actually decide.',
      'La mayoría de los CV los filtra un software (ATS) antes de que los lea una persona. Ajustamos tu CV para pasar esos filtros — y llegar a quienes realmente deciden.',
      'A maioria dos currículos é filtrada por software (ATS) antes de um humano ler. Ajustamos seu currículo para passar por esses filtros — e chegar a quem decide.',
    ),
  },
  {
    id: 'strategies',
    chapter: 'experience',
    kind: 'multi',
    saveTo: 'strategies',
    question: L('Which job-search strategies have you tried?', '¿Qué estrategias de búsqueda probaste?', 'Quais estratégias de busca você já tentou?'),
    options: [
      { id: 'boards', label: L('Job boards (LinkedIn, Indeed…)', 'Portales (LinkedIn, Indeed…)', 'Portais (LinkedIn, Indeed…)') },
      { id: 'referral', label: L('Referrals (friends, colleagues)', 'Referidos (amigos, colegas)', 'Indicações (amigos, colegas)') },
      { id: 'agencies', label: L('Recruiting agencies', 'Agencias de reclutamiento', 'Agências de recrutamento') },
      { id: 'networking', label: L('Networking / events', 'Networking / eventos', 'Networking / eventos') },
      { id: 'social', label: L('Personal blog / social', 'Blog / redes personales', 'Blog / redes pessoais') },
      { id: 'other', label: L('Other', 'Otro', 'Outro') },
    ],
  },
  {
    id: 'cv_upload',
    chapter: 'experience',
    kind: 'upload',
  },

  // ===== Chapter 4 — how we help ==========================================
  {
    id: 'affirm_forms',
    chapter: 'help',
    kind: 'affirm',
    saveTo: 'a_forms',
    statement: L(
      'I’m tired of filling out the same application forms over and over.',
      'Estoy cansado de llenar los mismos formularios una y otra vez.',
      'Estou cansado de preencher os mesmos formulários repetidamente.',
    ),
  },
  {
    id: 'value_autofill',
    chapter: 'help',
    kind: 'interstitial',
    emoji: '⚡',
    stat: L('10×', '10×', '10×'),
    title: L('more applications, on autopilot', 'más postulaciones, en piloto automático', 'mais candidaturas, no piloto automático'),
    body: L(
      'Our AI tailors your CV to each role and fills the forms for you, so you apply to far more jobs in far less time.',
      'Nuestra IA adapta tu CV a cada rol y completa los formularios por vos, para que postules a muchos más empleos en mucho menos tiempo.',
      'Nossa IA adapta seu currículo a cada vaga e preenche os formulários por você, para você se candidatar a muito mais vagas em muito menos tempo.',
    ),
  },
  {
    // Mid-funnel registration (client feedback 18.07). Right after the ×10 hook, at
    // the emotional peak — framed as "let's save your progress", staying inside the
    // questionnaire format (progress bar still shows). Creating the account here means
    // the paywall can charge directly instead of bouncing to a register page.
    id: 'register',
    chapter: 'help',
    kind: 'register',
  },
  {
    id: 'testimonial_michael',
    chapter: 'help',
    kind: 'testimonial',
    author: 'Michael R.',
    role: L('Product Manager', 'Product Manager', 'Product Manager'),
    quote: L(
      'Automating my applications with AI saved me countless hours and landed me 12 interviews in three weeks.',
      'Automatizar mis postulaciones con IA me ahorró incontables horas y me consiguió 12 entrevistas en tres semanas.',
      'Automatizar minhas candidaturas com IA me poupou horas e rendeu 12 entrevistas em três semanas.',
    ),
  },
  {
    id: 'daily_time',
    chapter: 'help',
    kind: 'single',
    saveTo: 'dailyTime',
    question: L('How much time can you spend applying each day?', '¿Cuánto tiempo podés dedicar a postular por día?', 'Quanto tempo você pode dedicar a se candidatar por dia?'),
    options: [
      { id: '3-4h', label: L('3–4 hours', '3–4 horas', '3–4 horas') },
      { id: '1-2h', label: L('1–2 hours', '1–2 horas', '1–2 horas') },
      { id: '30-60', label: L('30–60 min', '30–60 min', '30–60 min') },
      { id: '<30', label: L('Under 30 min', 'Menos de 30 min', 'Menos de 30 min') },
    ],
  },

  // ===== Chapter 5 — finish → payoff ======================================
  {
    id: 'benefits',
    chapter: 'finish',
    kind: 'multi',
    saveTo: 'benefits',
    question: L('Which benefits matter most to you?', '¿Qué beneficios son más importantes para vos?', 'Quais benefícios são mais importantes para você?'),
    options: [
      { id: 'pto', label: L('Flexible PTO', 'PTO flexible', 'Férias flexíveis') },
      { id: 'health', label: L('Health insurance', 'Seguro médico', 'Plano de saúde') },
      { id: 'home_office', label: L('Home-office budget', 'Presupuesto home-office', 'Ajuda home-office') },
      { id: 'learning', label: L('Learning budget', 'Presupuesto de aprendizaje', 'Verba para aprendizado') },
      { id: 'growth', label: L('Career growth', 'Crecimiento profesional', 'Crescimento na carreira') },
      { id: 'mental', label: L('Mental-health support', 'Apoyo en salud mental', 'Apoio à saúde mental') },
    ],
  },
  {
    id: 'affirm_relevant',
    chapter: 'finish',
    kind: 'affirm',
    saveTo: 'a_relevant',
    statement: L(
      'I rarely find postings that actually match my profile.',
      'Rara vez encuentro ofertas que realmente coincidan con mi perfil.',
      'Raramente encontro vagas que realmente combinam com meu perfil.',
    ),
  },
  {
    // Personalized mirror #2 — a crisp read-back of the profile we just built,
    // right before we go find matches. This is the "you get me" beat.
    id: 'reflect_profile',
    chapter: 'finish',
    kind: 'reflect',
    build: (a, locale) => {
      // modality is now a list; join the chosen styles ("remoto / híbrido").
      const modalityIds = Array.isArray(a.modality) ? (a.modality as string[]) : a.modality ? [a.modality as string] : []
      const modality = modalityIds.map((id) => word(MODALITY_WORD, id, locale)).filter(Boolean).join(' / ')
      const country = countryName(a.country)
      const salary = typeof a.minSalary === 'number' ? a.minSalary.toLocaleString() : ''
      const parts: string[] = []
      if (modality) parts.push(modality)
      if (salary) parts.push(`$${salary}+`)
      if (country) parts.push(country)
      const line = parts.join(' · ')
      return {
        emoji: '🎯',
        title: tr(L('Here’s your search profile', 'Este es tu perfil de búsqueda', 'Este é o seu perfil de busca'), locale),
        body:
          (line ? line + '\n\n' : '') +
          tr(
            L(
              'Now we’ll scan live postings and rank the ones that actually fit — by your skills, not just keywords.',
              'Ahora vamos a escanear ofertas en vivo y ordenar las que realmente encajan — por tus habilidades, no solo palabras clave.',
              'Agora vamos escanear vagas ao vivo e ranquear as que realmente combinam — pelas suas habilidades, não só palavras-chave.',
            ),
            locale,
          ),
      }
    },
  },
  { id: 'matching', chapter: 'finish', kind: 'matching' },
  { id: 'success', chapter: 'finish', kind: 'success' },
  // The standalone email-capture step is gone — the mid-funnel 'register' step above
  // already collects the email (and name + password), so the paywall follows success
  // directly and can charge without a detour.
  { id: 'paywall', chapter: 'finish', kind: 'paywall' },
]
