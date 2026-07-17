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

// ---- Step shapes -----------------------------------------------------------

interface Base {
  id: string
  chapter: Chapter
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
  | (Base & { kind: 'upload' })
  | (Base & { kind: 'matching' })
  | (Base & { kind: 'success' })
  | (Base & { kind: 'email' })
  | (Base & { kind: 'paywall' })

// Steps that don't count toward the "question progress" bar (terminals + payoff).
export const TERMINAL_KINDS = new Set(['matching', 'success', 'email', 'paywall'])

// ---- The funnel ------------------------------------------------------------

export const STEPS: Step[] = [
  // ===== Chapter 1 — current situation =====================================
  {
    id: 'work_status',
    chapter: 'current',
    kind: 'single',
    saveTo: 'workStatus',
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
    id: 'proof_firstmonth',
    chapter: 'current',
    kind: 'interstitial',
    emoji: '📈',
    stat: L('65%', '65%', '65%'),
    title: L(
      'of our members land a job in the first month',
      'de nuestros miembros consigue trabajo en el primer mes',
      'dos nossos membros conseguem emprego no primeiro mês',
    ),
    body: L(
      'We’ll help you get there too — with a search that works for you around the clock.',
      'Te vamos a ayudar a llegar ahí también — con una búsqueda que trabaja por vos todo el día.',
      'Vamos te ajudar a chegar lá também — com uma busca que trabalha por você o tempo todo.',
    ),
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
    id: 'modality',
    chapter: 'seeking',
    kind: 'single',
    saveTo: 'modality',
    question: L('What kind of work do you prefer?', '¿Qué modalidad preferís?', 'Qual modalidade você prefere?'),
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
      'Usamos isso para encontrar vagas abertas na sua região.',
    ),
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
    question: L('Which job categories interest you?', '¿Qué categorías de trabajo te interesan?', 'Quais categorias de trabalho te interessam?'),
    sub: L('Pick as many as you like', 'Elegí las que quieras', 'Escolha quantas quiser'),
    options: [
      { id: 'any', emoji: '✨', label: L('Open to anything', 'Abierto a cualquier rol', 'Aberto a qualquer cargo') },
      { id: 'sales', emoji: '📈', label: L('Sales & partnerships', 'Ventas y alianzas', 'Vendas e parcerias') },
      { id: 'marketing', emoji: '📣', label: L('Marketing & PR', 'Marketing y RR.PP.', 'Marketing e RP') },
      { id: 'software', emoji: '💻', label: L('IT & software', 'TI y software', 'TI e software') },
      { id: 'design', emoji: '🎨', label: L('Design (UX, product)', 'Diseño (UX, producto)', 'Design (UX, produto)') },
      { id: 'ops', emoji: '⚙️', label: L('Admin & operations', 'Administración y operaciones', 'Admin. e operações') },
      { id: 'data', emoji: '📊', label: L('Data & analytics', 'Datos y análisis', 'Dados e análise') },
      { id: 'finance', emoji: '💰', label: L('Finance', 'Finanzas', 'Finanças') },
      { id: 'hr', emoji: '🧑‍🤝‍🧑', label: L('HR & recruiting', 'RR.HH. y reclutamiento', 'RH e recrutamento') },
      { id: 'customer', emoji: '🎧', label: L('Customer support', 'Atención al cliente', 'Atendimento ao cliente') },
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
  { id: 'matching', chapter: 'finish', kind: 'matching' },
  { id: 'success', chapter: 'finish', kind: 'success' },
  { id: 'email', chapter: 'finish', kind: 'email' },
  { id: 'paywall', chapter: 'finish', kind: 'paywall' },
]
