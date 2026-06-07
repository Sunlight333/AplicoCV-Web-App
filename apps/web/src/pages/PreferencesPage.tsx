import { useState, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/auth/AuthContext'
import { updatePreferences } from '@/services/auth'
import { ApiError } from '@/lib/apiClient'
import type { JobPreferences, OnsiteLocation, Citizenship } from '@/types'

const MODALITIES = ['part_time', 'full_time', 'remote'] as const
const REGIONS = ['europe', 'north_america', 'south_america', 'oceania', 'asia', 'africa', 'worldwide'] as const
const CITIZENSHIPS: Citizenship[] = ['citizen', 'permanent_resident', 'work_visa', 'open_work_permit', 'not_authorized']
const EMPLOYMENT = ['unemployed', 'unemployed_relaxed', 'employed_seeking', 'employed_open'] as const

interface PrefCopy {
  title: string; subtitle: string; save: string; saved: string; error: string
  employment: string; employmentOpts: Record<(typeof EMPLOYMENT)[number], string>
  roles: string; rolesHint: string; rolesPh: string; add: string; max5: string
  salary: string; localCurrency: string; localCurrencyPh: string; localAmount: string; usdAmount: string
  industries: string; industriesPh: string
  modality: string; modalities: Record<(typeof MODALITIES)[number], string>
  scope: string; fullRemote: string; onsiteHybrid: string
  regions: string; regionLabels: Record<(typeof REGIONS)[number], string>
  onsite: string; cityPh: string; citizenship: string; citizenshipOpts: Record<Citizenship, string>; addCity: string; remove: string
  availability: string; asap: string; nextWeek: string; specificDate: string
  relocation: string; license: string; veteran: string; disability: string; accommodation: string; accommodationPh: string
  gender: string; genderPh: string
  howHeard: string; howHeardPh: string
  defaults: string; defaultsHint: string; workedHere: string; knowsSomeone: string; dataPolicy: string
  assistant: string; assistantHint: string; emailDigest: string; autoApply: string
  yes: string; no: string
}

const COPY: Record<Locale, PrefCopy> = {
  en: {
    title: 'Job preferences', subtitle: 'These answers let the autofill complete tricky application fields for you and help us recommend better-matched jobs. The more you fill, the fewer empty fields and errors.',
    save: 'Save preferences', saved: 'Preferences saved', error: 'Could not save',
    employment: 'Your current situation', employmentOpts: { unemployed: 'Unemployed', unemployed_relaxed: 'Unemployed, no rush', employed_seeking: 'Employed, need a change', employed_open: 'Employed, open to offers' },
    roles: 'Roles you are looking for', rolesHint: 'Up to 5. The AI adapts the title to each posting.', rolesPh: 'e.g. Commercial Manager', add: 'Add', max5: 'Up to 5 roles',
    salary: 'Salary expectation', localCurrency: 'Local currency', localCurrencyPh: 'e.g. CLP', localAmount: 'Amount (local)', usdAmount: 'Amount (USD)',
    industries: 'Preferred industries', industriesPh: 'e.g. Healthcare, Finance, Sales',
    modality: 'Work modality', modalities: { part_time: 'Part time', full_time: 'Full time', remote: 'Remote' },
    scope: 'Remote or on-site?', fullRemote: 'Full remote — anywhere in the world', onsiteHybrid: 'On-site or hybrid — near my city',
    regions: 'Where would you work remotely?', regionLabels: { europe: 'Europe', north_america: 'North America', south_america: 'South America', oceania: 'Oceania', asia: 'Asia', africa: 'Africa', worldwide: 'Worldwide' },
    onsite: 'Where would you work on-site?', cityPh: 'City or capital', citizenship: 'Work status there', citizenshipOpts: { citizen: 'Citizen', permanent_resident: 'Permanent resident', work_visa: 'Work visa', open_work_permit: 'Open work permit', not_authorized: 'Not yet authorized' }, addCity: 'Add city', remove: 'Remove',
    availability: 'Start availability', asap: 'As soon as possible', nextWeek: 'Next week', specificDate: 'Specific date',
    relocation: 'Open to relocation?', license: 'Driver’s license?', veteran: 'Veteran?', disability: 'Any disability?', accommodation: 'Accommodation needed for interviews?', accommodationPh: 'Optional — tell us how we can help',
    gender: 'How do you identify?', genderPh: 'e.g. Man, Woman, Non-binary, Prefer not to say',
    howHeard: 'How did you hear about jobs (default answer)', howHeardPh: 'e.g. LinkedIn / Job Board',
    defaults: 'Application defaults', defaultsHint: 'Applied automatically to common application checkboxes so forms do not error.', workedHere: 'I have NOT worked at the company before', knowsSomeone: 'I do NOT know anyone at the company', dataPolicy: 'Accept the data policy of each site I apply to',
    assistant: 'Smart assistant', assistantHint: 'Let AplicoCV work while you are offline.', emailDigest: 'Email me a digest of new high-match jobs', autoApply: 'Prepare strong matches for me to review (apply queue)',
    yes: 'Yes', no: 'No',
  },
  es: {
    title: 'Preferencias de empleo', subtitle: 'Estas respuestas permiten que el autocompletado complete los campos difíciles por ti y nos ayudan a recomendarte mejores empleos. Cuanto más completes, menos campos vacíos y errores.',
    save: 'Guardar preferencias', saved: 'Preferencias guardadas', error: 'No se pudo guardar',
    employment: 'Tu situación actual', employmentOpts: { unemployed: 'Desempleado', unemployed_relaxed: 'Desempleado, sin apuro', employed_seeking: 'Empleado, necesito un cambio', employed_open: 'Empleado, abierto a ofertas' },
    roles: 'Puestos que buscas', rolesHint: 'Hasta 5. La IA adapta el título a cada oferta.', rolesPh: 'ej. Commercial Manager', add: 'Agregar', max5: 'Hasta 5 puestos',
    salary: 'Expectativa salarial', localCurrency: 'Moneda local', localCurrencyPh: 'ej. CLP', localAmount: 'Monto (local)', usdAmount: 'Monto (USD)',
    industries: 'Industrias preferidas', industriesPh: 'ej. Salud, Finanzas, Ventas',
    modality: 'Modalidad de trabajo', modalities: { part_time: 'Medio tiempo', full_time: 'Tiempo completo', remote: 'Remoto' },
    scope: '¿Remoto o presencial?', fullRemote: 'Full remoto — en cualquier lugar del mundo', onsiteHybrid: 'Presencial o híbrido — cerca de mi ciudad',
    regions: '¿Dónde trabajarías remoto?', regionLabels: { europe: 'Europa', north_america: 'Norteamérica', south_america: 'Sudamérica', oceania: 'Oceanía', asia: 'Asia', africa: 'África', worldwide: 'Todo el mundo' },
    onsite: '¿Dónde trabajarías presencial?', cityPh: 'Ciudad o capital', citizenship: 'Tu estatus allí', citizenshipOpts: { citizen: 'Ciudadano', permanent_resident: 'Residente permanente', work_visa: 'Visa de trabajo', open_work_permit: 'Permiso de trabajo abierto', not_authorized: 'Aún no autorizado' }, addCity: 'Agregar ciudad', remove: 'Quitar',
    availability: 'Disponibilidad de inicio', asap: 'Lo antes posible', nextWeek: 'La próxima semana', specificDate: 'Fecha específica',
    relocation: '¿Abierto a reubicarte?', license: '¿Licencia de conducir?', veteran: '¿Veterano?', disability: '¿Alguna discapacidad?', accommodation: '¿Necesitas adaptación para entrevistas?', accommodationPh: 'Opcional — cuéntanos cómo ayudarte',
    gender: '¿Cómo te identificas?', genderPh: 'ej. Hombre, Mujer, No binario, Prefiero no decir',
    howHeard: '¿Cómo te enteraste del empleo? (respuesta por defecto)', howHeardPh: 'ej. LinkedIn / Portal de empleo',
    defaults: 'Respuestas por defecto', defaultsHint: 'Se aplican automáticamente en las casillas comunes para que los formularios no den error.', workedHere: 'NO he trabajado en la empresa antes', knowsSomeone: 'NO conozco a nadie en la empresa', dataPolicy: 'Aceptar la política de datos de cada sitio donde me postulo',
    assistant: 'Asistente inteligente', assistantHint: 'Deja que AplicoCV trabaje mientras no estás conectado.', emailDigest: 'Enviarme por correo un resumen de nuevos empleos con alta coincidencia', autoApply: 'Preparar las mejores coincidencias para que yo las revise (cola de postulación)',
    yes: 'Sí', no: 'No',
  },
  'pt-BR': {
    title: 'Preferências de emprego', subtitle: 'Estas respostas permitem que o preenchimento automático complete os campos difíceis por você e nos ajudam a recomendar vagas mais compatíveis. Quanto mais você preencher, menos campos vazios e erros.',
    save: 'Salvar preferências', saved: 'Preferências salvas', error: 'Não foi possível salvar',
    employment: 'Sua situação atual', employmentOpts: { unemployed: 'Desempregado', unemployed_relaxed: 'Desempregado, sem pressa', employed_seeking: 'Empregado, preciso mudar', employed_open: 'Empregado, aberto a ofertas' },
    roles: 'Cargos que você procura', rolesHint: 'Até 5. A IA adapta o título a cada vaga.', rolesPh: 'ex. Commercial Manager', add: 'Adicionar', max5: 'Até 5 cargos',
    salary: 'Expectativa salarial', localCurrency: 'Moeda local', localCurrencyPh: 'ex. BRL', localAmount: 'Valor (local)', usdAmount: 'Valor (USD)',
    industries: 'Setores preferidos', industriesPh: 'ex. Saúde, Finanças, Vendas',
    modality: 'Modalidade de trabalho', modalities: { part_time: 'Meio período', full_time: 'Tempo integral', remote: 'Remoto' },
    scope: 'Remoto ou presencial?', fullRemote: 'Full remoto — em qualquer lugar do mundo', onsiteHybrid: 'Presencial ou híbrido — perto da minha cidade',
    regions: 'Onde você trabalharia remoto?', regionLabels: { europe: 'Europa', north_america: 'América do Norte', south_america: 'América do Sul', oceania: 'Oceania', asia: 'Ásia', africa: 'África', worldwide: 'Mundo todo' },
    onsite: 'Onde você trabalharia presencial?', cityPh: 'Cidade ou capital', citizenship: 'Seu status lá', citizenshipOpts: { citizen: 'Cidadão', permanent_resident: 'Residente permanente', work_visa: 'Visto de trabalho', open_work_permit: 'Permissão de trabalho aberta', not_authorized: 'Ainda não autorizado' }, addCity: 'Adicionar cidade', remove: 'Remover',
    availability: 'Disponibilidade de início', asap: 'O mais rápido possível', nextWeek: 'Próxima semana', specificDate: 'Data específica',
    relocation: 'Aberto a mudança de cidade?', license: 'Carteira de motorista?', veteran: 'Veterano?', disability: 'Alguma deficiência?', accommodation: 'Precisa de adaptação para entrevistas?', accommodationPh: 'Opcional — diga como podemos ajudar',
    gender: 'Como você se identifica?', genderPh: 'ex. Homem, Mulher, Não binário, Prefiro não dizer',
    howHeard: 'Como soube da vaga? (resposta padrão)', howHeardPh: 'ex. LinkedIn / Portal de vagas',
    defaults: 'Respostas padrão', defaultsHint: 'Aplicadas automaticamente nas caixas comuns para os formulários não darem erro.', workedHere: 'NÃO trabalhei na empresa antes', knowsSomeone: 'NÃO conheço ninguém na empresa', dataPolicy: 'Aceitar a política de dados de cada site onde me candidato',
    assistant: 'Assistente inteligente', assistantHint: 'Deixe a AplicoCV trabalhar enquanto você está offline.', emailDigest: 'Enviar por e-mail um resumo de novas vagas com alta compatibilidade', autoApply: 'Preparar as melhores combinações para eu revisar (fila de candidatura)',
    yes: 'Sim', no: 'Não',
  },
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="font-semibold text-navy-900">{title}</h2>
      {hint && <p className="mt-1 text-sm text-navy-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'border-electric-500 bg-electric-50 text-electric-700' : 'border-navy-200 text-navy-600 hover:bg-navy-50'
      }`}
    >
      {children}
    </button>
  )
}

function YesNo({ value, onChange, yes, no }: { value: boolean | undefined; onChange: (v: boolean) => void; yes: string; no: string }) {
  return (
    <div className="flex gap-2">
      <Chip active={value === true} onClick={() => onChange(true)}>{yes}</Chip>
      <Chip active={value === false} onClick={() => onChange(false)}>{no}</Chip>
    </div>
  )
}

export default function PreferencesPage() {
  const c = useCopy(COPY)
  const { toast } = useToast()
  const { user, setUser } = useAuth()
  const [p, setP] = useState<JobPreferences>(
    () => user?.preferences ?? { targetRoles: [], seniority: 'mid', locations: [], remote: 'any' },
  )
  const [roleInput, setRoleInput] = useState('')
  const [industryInput, setIndustryInput] = useState('')
  const [cityInput, setCityInput] = useState('')

  const set = (patch: Partial<JobPreferences>) => setP((prev) => ({ ...prev, ...patch }))
  const toggle = (list: string[] | undefined, value: string): string[] => {
    const arr = list ?? []
    return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
  }

  const save = useMutation({
    mutationFn: () => updatePreferences(p),
    onSuccess: (u) => {
      setUser(u)
      toast(c.saved)
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : c.error, 'error'),
  })

  const addRole = () => {
    const v = roleInput.trim()
    if (v && (p.targetRoles?.length ?? 0) < 5 && !p.targetRoles.includes(v)) {
      set({ targetRoles: [...p.targetRoles, v] })
    }
    setRoleInput('')
  }
  const addIndustry = () => {
    const v = industryInput.trim()
    if (v && !(p.industries ?? []).includes(v)) set({ industries: [...(p.industries ?? []), v] })
    setIndustryInput('')
  }
  const addCity = () => {
    const v = cityInput.trim()
    if (v) set({ onsiteLocations: [...(p.onsiteLocations ?? []), { city: v, citizenship: null }] })
    setCityInput('')
  }
  const setCity = (i: number, patch: Partial<OnsiteLocation>) => {
    const next = [...(p.onsiteLocations ?? [])]
    next[i] = { ...next[i], ...patch }
    set({ onsiteLocations: next })
  }

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{c.title}</h1>
      <p className="mt-1 max-w-3xl text-navy-500">{c.subtitle}</p>

      <div className="mt-6 grid gap-5">
        <Section title={c.employment}>
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT.map((e) => (
              <Chip key={e} active={p.employmentStatus === e} onClick={() => set({ employmentStatus: e })}>{c.employmentOpts[e]}</Chip>
            ))}
          </div>
        </Section>

        <Section title={c.roles} hint={c.rolesHint}>
          <div className="flex gap-2">
            <Input className="flex-1" placeholder={c.rolesPh} value={roleInput} onChange={(e) => setRoleInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())} />
            <Button type="button" variant="secondary" className="rounded-full" disabled={(p.targetRoles?.length ?? 0) >= 5} onClick={addRole}>{c.add}</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.targetRoles.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 rounded-full bg-electric-50 px-3 py-1 text-sm text-electric-700">
                {r}
                <button onClick={() => set({ targetRoles: p.targetRoles.filter((x) => x !== r) })} className="text-electric-400 hover:text-red-500">✕</button>
              </span>
            ))}
            <span className="self-center text-xs text-navy-400">{p.targetRoles.length}/5</span>
          </div>
        </Section>

        <Section title={c.salary}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label={c.localCurrency} placeholder={c.localCurrencyPh} value={p.salaryLocalCurrency ?? ''} onChange={(e) => set({ salaryLocalCurrency: e.target.value })} />
            <Input label={c.localAmount} type="number" value={p.salaryLocalAmount?.toString() ?? ''} onChange={(e) => set({ salaryLocalAmount: e.target.value ? Number(e.target.value) : undefined })} />
            <Input label={c.usdAmount} type="number" value={p.salaryUsdAmount?.toString() ?? ''} onChange={(e) => set({ salaryUsdAmount: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
        </Section>

        <Section title={c.industries}>
          <div className="flex gap-2">
            <Input className="flex-1" placeholder={c.industriesPh} value={industryInput} onChange={(e) => setIndustryInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIndustry())} />
            <Button type="button" variant="secondary" className="rounded-full" onClick={addIndustry}>{c.add}</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(p.industries ?? []).map((r) => (
              <span key={r} className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-3 py-1 text-sm text-navy-700">
                {r}
                <button onClick={() => set({ industries: (p.industries ?? []).filter((x) => x !== r) })} className="text-navy-400 hover:text-red-500">✕</button>
              </span>
            ))}
          </div>
        </Section>

        <Section title={c.modality}>
          <div className="flex flex-wrap gap-2">
            {MODALITIES.map((m) => (
              <Chip key={m} active={(p.workModalities ?? []).includes(m)} onClick={() => set({ workModalities: toggle(p.workModalities, m) })}>{c.modalities[m]}</Chip>
            ))}
          </div>
        </Section>

        <Section title={c.scope}>
          <div className="flex flex-wrap gap-2">
            <Chip active={p.remoteScope === 'full_remote'} onClick={() => set({ remoteScope: 'full_remote' })}>{c.fullRemote}</Chip>
            <Chip active={p.remoteScope === 'onsite_hybrid'} onClick={() => set({ remoteScope: 'onsite_hybrid' })}>{c.onsiteHybrid}</Chip>
          </div>
        </Section>

        {p.remoteScope !== 'onsite_hybrid' && (
          <Section title={c.regions}>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <Chip key={r} active={(p.remoteRegions ?? []).includes(r)} onClick={() => set({ remoteRegions: toggle(p.remoteRegions, r) })}>{c.regionLabels[r]}</Chip>
              ))}
            </div>
          </Section>
        )}

        {p.remoteScope !== 'full_remote' && (
          <Section title={c.onsite}>
            <div className="flex gap-2">
              <Input className="flex-1" placeholder={c.cityPh} value={cityInput} onChange={(e) => setCityInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCity())} />
              <Button type="button" variant="secondary" className="rounded-full" onClick={addCity}>{c.addCity}</Button>
            </div>
            <div className="mt-3 space-y-2">
              {(p.onsiteLocations ?? []).map((loc, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-navy-100 p-3">
                  <span className="font-medium text-navy-800">{loc.city}</span>
                  <select
                    value={loc.citizenship ?? ''}
                    onChange={(e) => setCity(i, { citizenship: (e.target.value || null) as Citizenship | null })}
                    className="h-9 rounded-lg border border-navy-200 bg-white px-2 text-sm text-navy-700"
                  >
                    <option value="">{c.citizenship}</option>
                    {CITIZENSHIPS.map((ci) => (
                      <option key={ci} value={ci}>{c.citizenshipOpts[ci]}</option>
                    ))}
                  </select>
                  <button onClick={() => set({ onsiteLocations: (p.onsiteLocations ?? []).filter((_, x) => x !== i) })} className="ml-auto text-sm text-navy-400 hover:text-red-500">{c.remove}</button>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title={c.availability}>
          <div className="flex flex-wrap gap-2">
            <Chip active={p.availability === 'asap'} onClick={() => set({ availability: 'asap' })}>{c.asap}</Chip>
            <Chip active={p.availability === 'next_week'} onClick={() => set({ availability: 'next_week' })}>{c.nextWeek}</Chip>
            <Input type="date" className="w-44" value={p.availability && /^\d{4}-/.test(p.availability) ? p.availability : ''} onChange={(e) => set({ availability: e.target.value })} />
          </div>
        </Section>

        <Section title={c.gender}>
          <Input placeholder={c.genderPh} value={p.gender ?? ''} onChange={(e) => set({ gender: e.target.value })} />
        </Section>

        <div className="grid gap-5 sm:grid-cols-2">
          <Section title={c.relocation}><YesNo value={p.relocation} onChange={(v) => set({ relocation: v })} yes={c.yes} no={c.no} /></Section>
          <Section title={c.license}><YesNo value={p.driverLicense} onChange={(v) => set({ driverLicense: v })} yes={c.yes} no={c.no} /></Section>
          <Section title={c.veteran}><YesNo value={p.veteran} onChange={(v) => set({ veteran: v })} yes={c.yes} no={c.no} /></Section>
          <Section title={c.disability}>
            <YesNo value={p.disability} onChange={(v) => set({ disability: v })} yes={c.yes} no={c.no} />
            {p.disability && (
              <Input className="mt-3" placeholder={c.accommodationPh} value={p.disabilityAccommodation ?? ''} onChange={(e) => set({ disabilityAccommodation: e.target.value })} />
            )}
          </Section>
        </div>

        <Section title={c.howHeard}>
          <Input placeholder={c.howHeardPh} value={p.howDidYouHear ?? ''} onChange={(e) => set({ howDidYouHear: e.target.value })} />
        </Section>

        <Section title={c.defaults} hint={c.defaultsHint}>
          <div className="space-y-2.5">
            {([
              ['workedHereBefore', c.workedHere],
              ['knowsSomeoneHere', c.knowsSomeone],
              ['acceptDataPolicy', c.dataPolicy],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5 text-sm text-navy-700">
                <input
                  type="checkbox"
                  checked={key === 'acceptDataPolicy' ? p.acceptDataPolicy !== false : Boolean(p[key])}
                  onChange={(e) => set({ [key]: e.target.checked } as Partial<JobPreferences>)}
                  className="h-4 w-4 rounded border-navy-300 text-electric-500 focus:ring-electric-400"
                />
                {label}
              </label>
            ))}
          </div>
        </Section>

        <Section title={c.assistant} hint={c.assistantHint}>
          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 text-sm text-navy-700">
              <input type="checkbox" checked={Boolean(p.emailDigest)} onChange={(e) => set({ emailDigest: e.target.checked })} className="h-4 w-4 rounded border-navy-300 text-electric-500 focus:ring-electric-400" />
              {c.emailDigest}
            </label>
            <label className="flex items-center gap-2.5 text-sm text-navy-700">
              <input type="checkbox" checked={Boolean(p.autoApply)} onChange={(e) => set({ autoApply: e.target.checked })} className="h-4 w-4 rounded border-navy-300 text-electric-500 focus:ring-electric-400" />
              {c.autoApply}
            </label>
          </div>
        </Section>

        <div className="sticky bottom-4 flex justify-end">
          <Button className="rounded-full shadow-elev-3" loading={save.isPending} onClick={() => save.mutate()}>{c.save}</Button>
        </div>
      </div>
    </PageTransition>
  )
}
