import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input, TextArea } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/Toast'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { getProfile, patchProfile } from '@/services/profile'
import { parseText } from '@/services/documents'
import { getPersonalAnalysis, getSkillSuggestions, localizeProfile } from '@/services/ai'
import type { Profile, Certification, ProjectItem, Education, LanguageLevel } from '@/types'
import { SkillsEditor } from './profile/SkillsEditor'
import { UploadStep } from './onboarding/UploadStep'
import { cn } from '@/lib/cn'
import { ApiError } from '@/lib/apiClient'
import { useT } from '@/i18n/I18nProvider'

const TABS = [
  'personal', 'experience', 'education', 'skills', 'certifications',
  'projects', 'languages', 'links', 'complementary', 'insights',
] as const
type Tab = (typeof TABS)[number]

interface ProfileExtraCopy {
  tabs: { certifications: string; projects: string; insights: string }
  reimport: string; replaceTitle: string; replaceDesc: string; orPaste: string; pastePh: string; parseBtn: string; imported: string; parseError: string
  yourSkills: string; avoidTitle: string; avoidSub: string
  start: string; end: string; endPh: string; highlights: string; addHighlight: string; removeRole: string; addExperience: string
  name: string; issuer: string; year: string; credUrl: string; remove: string; addCert: string
  url: string; description: string; addProject: string
  baseCoverLetter: string; baseCoverLetterPh: string
  analysisTitle: string; analysisSub: string; analyzeBtn: string; strengths: string; growthArea: string; motivation: string
  skillsTitle: string; skillsSub: string; suggestBtn: string; analyzeError: string; suggestError: string
}

const PROFILE_COPY: Record<Locale, ProfileExtraCopy> = {
  en: {
    tabs: { certifications: 'Certifications', projects: 'Projects', insights: 'AI Insights' },
    reimport: '↑ Re-import CV', replaceTitle: 'Replace your CV',
    replaceDesc: 'Upload a new CV — or paste your CV text — to re-parse and replace your current profile. You can edit anything afterward.',
    orPaste: '…or paste your CV text', pastePh: 'Paste your full CV text here — it’s the main source for the AI.', parseBtn: 'Parse pasted text',
    imported: 'CV imported — your profile was updated', parseError: 'Could not parse the pasted text',
    yourSkills: 'Your skills', avoidTitle: 'Skills / roles to avoid', avoidSub: 'Things you don’t want to be matched on.',
    start: 'Start', end: 'End', endPh: '2024-06 or blank', highlights: 'Highlights', addHighlight: 'Add highlight', removeRole: 'Remove role', addExperience: 'Add experience',
    name: 'Name', issuer: 'Issuer', year: 'Year', credUrl: 'Credential URL', remove: 'Remove', addCert: 'Add certification',
    url: 'URL', description: 'Description', addProject: 'Add project',
    baseCoverLetter: 'Base cover letter', baseCoverLetterPh: 'A reusable letter the AI personalizes for each posting…',
    analysisTitle: 'Personal analysis', analysisSub: 'Your strengths, a growth area, and what drives you.', analyzeBtn: '✦ Analyze me (10 credits)',
    strengths: 'Strengths', growthArea: 'Growth area', motivation: 'Motivation',
    skillsTitle: 'Skill suggestions', skillsSub: 'Relevant skills to add to your profile.', suggestBtn: '✦ Suggest skills (10 credits)',
    analyzeError: 'Could not analyze', suggestError: 'Could not suggest skills',
  },
  es: {
    tabs: { certifications: 'Certificaciones', projects: 'Proyectos', insights: 'Análisis IA' },
    reimport: '↑ Reimportar CV', replaceTitle: 'Reemplazar tu CV',
    replaceDesc: 'Sube un nuevo CV — o pega el texto de tu CV — para volver a analizarlo y reemplazar tu perfil actual. Puedes editar todo después.',
    orPaste: '…o pega el texto de tu CV', pastePh: 'Pega aquí el texto completo de tu CV — es la fuente principal para la IA.', parseBtn: 'Analizar texto pegado',
    imported: 'CV importado — tu perfil se actualizó', parseError: 'No se pudo analizar el texto pegado',
    yourSkills: 'Tus habilidades', avoidTitle: 'Habilidades / puestos a evitar', avoidSub: 'Cosas en las que no quieres que te emparejen.',
    start: 'Inicio', end: 'Fin', endPh: '2024-06 o en blanco', highlights: 'Logros', addHighlight: 'Agregar logro', removeRole: 'Eliminar puesto', addExperience: 'Agregar experiencia',
    name: 'Nombre', issuer: 'Emisor', year: 'Año', credUrl: 'URL de la credencial', remove: 'Eliminar', addCert: 'Agregar certificación',
    url: 'URL', description: 'Descripción', addProject: 'Agregar proyecto',
    baseCoverLetter: 'Carta de presentación base', baseCoverLetterPh: 'Una carta reutilizable que la IA personaliza para cada oferta…',
    analysisTitle: 'Análisis personal', analysisSub: 'Tus fortalezas, un área de mejora y lo que te motiva.', analyzeBtn: '✦ Analízame (10 créditos)',
    strengths: 'Fortalezas', growthArea: 'Área de mejora', motivation: 'Motivación',
    skillsTitle: 'Sugerencias de habilidades', skillsSub: 'Habilidades relevantes para agregar a tu perfil.', suggestBtn: '✦ Sugerir habilidades (10 créditos)',
    analyzeError: 'No se pudo analizar', suggestError: 'No se pudieron sugerir habilidades',
  },
  'pt-BR': {
    tabs: { certifications: 'Certificações', projects: 'Projetos', insights: 'Análise IA' },
    reimport: '↑ Reimportar currículo', replaceTitle: 'Substituir seu currículo',
    replaceDesc: 'Envie um novo currículo — ou cole o texto dele — para reanalisar e substituir seu perfil atual. Você pode editar tudo depois.',
    orPaste: '…ou cole o texto do seu currículo', pastePh: 'Cole aqui o texto completo do seu currículo — é a fonte principal para a IA.', parseBtn: 'Analisar texto colado',
    imported: 'Currículo importado — seu perfil foi atualizado', parseError: 'Não foi possível analisar o texto colado',
    yourSkills: 'Suas habilidades', avoidTitle: 'Habilidades / cargos a evitar', avoidSub: 'Coisas com as quais você não quer ser combinado.',
    start: 'Início', end: 'Fim', endPh: '2024-06 ou em branco', highlights: 'Destaques', addHighlight: 'Adicionar destaque', removeRole: 'Remover cargo', addExperience: 'Adicionar experiência',
    name: 'Nome', issuer: 'Emissor', year: 'Ano', credUrl: 'URL da credencial', remove: 'Remover', addCert: 'Adicionar certificação',
    url: 'URL', description: 'Descrição', addProject: 'Adicionar projeto',
    baseCoverLetter: 'Carta de apresentação base', baseCoverLetterPh: 'Uma carta reutilizável que a IA personaliza para cada vaga…',
    analysisTitle: 'Análise pessoal', analysisSub: 'Seus pontos fortes, um ponto a desenvolver e o que te motiva.', analyzeBtn: '✦ Analise-me (10 créditos)',
    strengths: 'Pontos fortes', growthArea: 'Ponto a desenvolver', motivation: 'Motivação',
    skillsTitle: 'Sugestões de habilidades', skillsSub: 'Habilidades relevantes para adicionar ao seu perfil.', suggestBtn: '✦ Sugerir habilidades (10 créditos)',
    analyzeError: 'Não foi possível analisar', suggestError: 'Não foi possível sugerir habilidades',
  },
}

const newId = (p: string) =>
  `${p}_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`

const DEGREE_LEVELS = ['secondary', 'certificate', 'associate', 'bachelor', 'master', 'doctorate', 'other'] as const
const LANG_LEVELS = ['basic', 'conversational', 'professional', 'advanced', 'native', 'bilingual'] as const

interface EduLangCopy {
  institution: string; degreeTitle: string; degreeTitlePh: string; degreeLevel: string; selectLevel: string
  fieldOfStudy: string; addEducation: string
  degreeLevels: Record<(typeof DEGREE_LEVELS)[number], string>
  language: string; generalLevel: string; oral: string; written: string; reading: string; isNative: string; addLanguage: string
  langLevels: Record<(typeof LANG_LEVELS)[number], string>
}

const EDU_LANG: Record<Locale, EduLangCopy> = {
  en: {
    institution: 'Institution', degreeTitle: 'Degree title', degreeTitlePh: 'e.g. BSc Computer Science', degreeLevel: 'Degree level', selectLevel: 'Select level',
    fieldOfStudy: 'Field of study', addEducation: 'Add education',
    degreeLevels: { secondary: 'Secondary / High school', certificate: 'Certificate', associate: 'Associate', bachelor: 'Bachelor / Licenciatura', master: 'Master', doctorate: 'Doctorate / PhD', other: 'Other' },
    language: 'Language', generalLevel: 'Overall level', oral: 'Oral', written: 'Written', reading: 'Reading', isNative: 'Native language', addLanguage: 'Add language',
    langLevels: { basic: 'Basic', conversational: 'Conversational', professional: 'Professional', advanced: 'Advanced', native: 'Native', bilingual: 'Bilingual' },
  },
  es: {
    institution: 'Institución', degreeTitle: 'Título', degreeTitlePh: 'ej. Licenciatura en Informática', degreeLevel: 'Nivel del título', selectLevel: 'Selecciona el nivel',
    fieldOfStudy: 'Área de estudio', addEducation: 'Agregar formación',
    degreeLevels: { secondary: 'Secundaria / Bachillerato', certificate: 'Certificado', associate: 'Técnico', bachelor: 'Licenciatura / Grado', master: 'Máster', doctorate: 'Doctorado', other: 'Otro' },
    language: 'Idioma', generalLevel: 'Nivel general', oral: 'Oral', written: 'Escrito', reading: 'Lectura', isNative: 'Lengua materna', addLanguage: 'Agregar idioma',
    langLevels: { basic: 'Básico', conversational: 'Conversacional', professional: 'Profesional', advanced: 'Avanzado', native: 'Nativo', bilingual: 'Bilingüe' },
  },
  'pt-BR': {
    institution: 'Instituição', degreeTitle: 'Título', degreeTitlePh: 'ex. Bacharelado em Computação', degreeLevel: 'Nível do título', selectLevel: 'Selecione o nível',
    fieldOfStudy: 'Área de estudo', addEducation: 'Adicionar formação',
    degreeLevels: { secondary: 'Ensino médio', certificate: 'Certificado', associate: 'Tecnólogo', bachelor: 'Bacharelado / Licenciatura', master: 'Mestrado', doctorate: 'Doutorado', other: 'Outro' },
    language: 'Idioma', generalLevel: 'Nível geral', oral: 'Oral', written: 'Escrito', reading: 'Leitura', isNative: 'Língua materna', addLanguage: 'Adicionar idioma',
    langLevels: { basic: 'Básico', conversational: 'Conversacional', professional: 'Profissional', advanced: 'Avançado', native: 'Nativo', bilingual: 'Bilíngue' },
  },
}

export default function ProfilePage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const t = useT()
  const tp = t.app.profile
  const pc = useCopy(PROFILE_COPY)
  const elc = useCopy(EDU_LANG)
  const [tab, setTab] = useState<Tab>('personal')
  const [draft, setDraft] = useState<Profile | null>(null)
  const [reimportOpen, setReimportOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasting, setPasting] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile })

  const handleReimported = (profile: Profile) => {
    setDraft(profile)
    qc.setQueryData(['profile'], profile)
    qc.invalidateQueries({ queryKey: ['credits'] })
    setReimportOpen(false)
    setPasteText('')
    toast(pc.imported)
  }

  const handlePaste = async () => {
    setPasting(true)
    try {
      const profile = await parseText(pasteText)
      if (profile) handleReimported(profile)
    } catch {
      toast(pc.parseError, 'error')
    } finally {
      setPasting(false)
    }
  }

  useEffect(() => {
    if (data && !draft) setDraft(data)
  }, [data, draft])

  const mutation = useMutation({
    mutationFn: (patch: Partial<Profile>) => patchProfile(patch),
    onSuccess: (updated) => {
      qc.setQueryData(['profile'], updated)
      toast(tp.saved)
    },
  })

  const save = useDebouncedCallback((patch: Partial<Profile>) => mutation.mutate(patch), 800)

  const update = (patch: Partial<Profile>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d))
    save(patch)
  }

  const tabLabel = (k: Tab): string =>
    k in tp.tabs ? (tp.tabs as Record<string, string>)[k] : (pc.tabs as Record<string, string>)[k]

  const [suggested, setSuggested] = useState<string[]>([])
  const analysisM = useMutation({
    mutationFn: getPersonalAnalysis,
    onSuccess: (res) => {
      setDraft((d) => (d ? { ...d, analysis: res } : d))
      qc.setQueryData(['profile'], (old: Profile | undefined) => (old ? { ...old, analysis: res } : old))
      qc.invalidateQueries({ queryKey: ['credits'] })
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : pc.analyzeError, 'error'),
  })
  const skillsM = useMutation({
    mutationFn: getSkillSuggestions,
    onSuccess: (res) => {
      setSuggested(res)
      qc.invalidateQueries({ queryKey: ['credits'] })
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : pc.suggestError, 'error'),
  })
  const addSuggested = (skill: string) => {
    if (draft && !draft.skills.includes(skill)) update({ skills: [...draft.skills, skill] })
    setSuggested((s) => s.filter((x) => x !== skill))
  }

  // Phase 2.2 — multilingual CV adaptation (more than translation: tone + seniority).
  const [localeLang, setLocaleLang] = useState('es')
  const [localeRegion, setLocaleRegion] = useState('')
  const [localized, setLocalized] = useState<Profile | null>(null)
  const localizeM = useMutation({
    mutationFn: () => localizeProfile(localeLang, localeRegion || undefined),
    onSuccess: (res) => {
      setLocalized(res)
      qc.invalidateQueries({ queryKey: ['credits'] })
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Could not adapt your CV', 'error'),
  })
  const applyLocalized = () => {
    if (!localized) return
    update({
      personal: localized.personal,
      experience: localized.experience,
      skills: localized.skills,
    })
    setLocalized(null)
    toast(pc.imported)
  }

  if (isLoading || !draft) {
    return (
      <PageTransition>
        <Skeleton className="h-8 w-48" />
        <Card className="mt-6 p-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-10 w-full" />
          <Skeleton className="mt-3 h-10 w-full" />
        </Card>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy-900">{tp.title}</h1>
        <div className="flex items-center gap-3">
          {mutation.isPending && <span className="text-sm text-navy-400">{tp.saving}</span>}
          <Button variant="secondary" className="rounded-full" onClick={() => setReimportOpen(true)}>{pc.reimport}</Button>
        </div>
      </div>

      <Modal open={reimportOpen} onClose={() => setReimportOpen(false)}>
        <div className="rounded-2xl bg-white p-7 shadow-elev-4">
          <div className="mb-1 flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-navy-900">{pc.replaceTitle}</h2>
            <button onClick={() => setReimportOpen(false)} className="text-navy-400 hover:text-navy-700" aria-label="Close">✕</button>
          </div>
          <p className="mb-4 text-sm text-navy-500">{pc.replaceDesc}</p>
          <UploadStep onParsed={handleReimported} />
          <div className="mt-5 border-t border-navy-100 pt-5">
            <p className="mb-2 text-sm font-medium text-navy-700">{pc.orPaste}</p>
            <TextArea rows={5} placeholder={pc.pastePh} value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
            <Button className="mt-3 rounded-full" disabled={!pasteText.trim()} loading={pasting} onClick={handlePaste}>{pc.parseBtn}</Button>
          </div>
        </div>
      </Modal>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-navy-100">
        {TABS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={cn(
              'relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
              tab === tabKey ? 'text-electric-600' : 'text-navy-400 hover:text-navy-700',
            )}
          >
            {tabLabel(tabKey)}
            {tab === tabKey && <motion.span layoutId="profile-tab-underline" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-electric-500" />}
          </button>
        ))}
      </div>

      <Card className="mt-6 p-6">
        {tab === 'personal' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={tp.fullName} value={draft.personal.fullName} onChange={(e) => update({ personal: { ...draft.personal, fullName: e.target.value } })} />
            <Input label={tp.headline} value={draft.personal.headline} onChange={(e) => update({ personal: { ...draft.personal, headline: e.target.value } })} />
            <Input label={tp.email} value={draft.personal.email} onChange={(e) => update({ personal: { ...draft.personal, email: e.target.value } })} />
            <Input label={tp.phone} value={draft.personal.phone ?? ''} onChange={(e) => update({ personal: { ...draft.personal, phone: e.target.value } })} />
            <Input label={tp.location} value={draft.personal.location ?? ''} onChange={(e) => update({ personal: { ...draft.personal, location: e.target.value } })} />
            <div className="sm:col-span-2">
              <TextArea label={tp.summary} rows={4} value={draft.personal.summary} onChange={(e) => update({ personal: { ...draft.personal, summary: e.target.value } })} />
            </div>
          </div>
        )}

        {tab === 'experience' && (
          <div className="space-y-4">
            {draft.experience.map((exp, i) => {
              const setExp = (patch: Partial<(typeof draft.experience)[number]>) => {
                const next = [...draft.experience]
                next[i] = { ...exp, ...patch }
                update({ experience: next })
              }
              return (
                <div key={exp.id} className="rounded-lg border border-navy-100 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label={tp.title_} value={exp.title} onChange={(e) => setExp({ title: e.target.value })} />
                    <Input label={tp.employer} value={exp.employer} onChange={(e) => setExp({ employer: e.target.value })} />
                    <Input label={pc.start} placeholder="2022-01" value={exp.startDate} onChange={(e) => setExp({ startDate: e.target.value })} />
                    <Input label={`${pc.end} (${tp.present})`} placeholder={pc.endPh} value={exp.endDate ?? ''} onChange={(e) => setExp({ endDate: e.target.value || null })} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-navy-700">{pc.highlights}</p>
                  <div className="mt-1.5 space-y-2">
                    {exp.bullets.map((b, bi) => (
                      <div key={bi} className="flex items-start gap-2">
                        <span className="mt-3 text-navy-300">•</span>
                        <TextArea rows={1} className="flex-1" value={b} onChange={(e) => setExp({ bullets: exp.bullets.map((x, xi) => (xi === bi ? e.target.value : x)) })} />
                        <button onClick={() => setExp({ bullets: exp.bullets.filter((_, xi) => xi !== bi) })} className="mt-2 text-navy-300 hover:text-red-500" aria-label="Remove">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <button onClick={() => setExp({ bullets: [...exp.bullets, ''] })} className="text-sm font-medium text-electric-600 hover:underline">+ {pc.addHighlight}</button>
                    <button onClick={() => update({ experience: draft.experience.filter((x) => x.id !== exp.id) })} className="text-sm font-medium text-red-500 hover:text-red-600">{pc.removeRole}</button>
                  </div>
                </div>
              )
            })}
            <Button variant="secondary" className="rounded-full" onClick={() => update({ experience: [...draft.experience, { id: newId('exp'), title: '', employer: '', startDate: '', endDate: null, bullets: [] }] })}>+ {pc.addExperience}</Button>
          </div>
        )}

        {tab === 'education' && (
          <div className="space-y-4">
            {draft.education.map((edu, i) => {
              const setEdu = (patch: Partial<(typeof draft.education)[number]>) => {
                const next = [...draft.education]
                next[i] = { ...edu, ...patch }
                update({ education: next })
              }
              return (
                <div key={edu.id} className="rounded-lg border border-navy-100 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label={elc.institution} value={edu.institution} onChange={(e) => setEdu({ institution: e.target.value })} />
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy-700">{elc.degreeLevel}</label>
                      <select
                        value={edu.degreeLevel ?? ''}
                        onChange={(e) => setEdu({ degreeLevel: (e.target.value || null) as Education['degreeLevel'] })}
                        className="h-11 w-full rounded-xl border border-navy-200 bg-white px-3 text-sm text-navy-900 focus:border-electric-400 focus:outline-none focus:ring-2 focus:ring-electric-400/40"
                      >
                        <option value="">{elc.selectLevel}</option>
                        {DEGREE_LEVELS.map((d) => (
                          <option key={d} value={d}>{elc.degreeLevels[d]}</option>
                        ))}
                      </select>
                    </div>
                    <Input label={elc.degreeTitle} placeholder={elc.degreeTitlePh} value={edu.degree} onChange={(e) => setEdu({ degree: e.target.value })} />
                    <Input label={elc.fieldOfStudy} value={edu.field ?? ''} onChange={(e) => setEdu({ field: e.target.value })} />
                    <Input label={pc.start} placeholder="2018-03" value={edu.startDate} onChange={(e) => setEdu({ startDate: e.target.value })} />
                    <Input label={`${pc.end} (${tp.present})`} placeholder={pc.endPh} value={edu.endDate ?? ''} onChange={(e) => setEdu({ endDate: e.target.value || null })} />
                  </div>
                  <button onClick={() => update({ education: draft.education.filter((x) => x.id !== edu.id) })} className="mt-3 text-sm font-medium text-red-500 hover:text-red-600">{pc.removeRole}</button>
                </div>
              )
            })}
            <Button variant="secondary" className="rounded-full" onClick={() => update({ education: [...draft.education, { id: newId('edu'), institution: '', degree: '', degreeLevel: null, field: '', startDate: '', endDate: null }] })}>+ {elc.addEducation}</Button>
          </div>
        )}

        {tab === 'skills' && (
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-navy-700">{pc.yourSkills}</p>
              <SkillsEditor skills={draft.skills} onChange={(skills) => update({ skills })} />
            </div>
            <div>
              <p className="text-sm font-medium text-navy-700">{pc.avoidTitle}</p>
              <p className="mb-2 text-xs text-navy-400">{pc.avoidSub}</p>
              <SkillsEditor skills={draft.skillsToAvoid ?? []} onChange={(skillsToAvoid) => update({ skillsToAvoid })} />
            </div>
          </div>
        )}

        {tab === 'languages' && (
          <div className="space-y-4">
            {draft.languages.map((l, i) => {
              const setLang = (patch: Partial<(typeof draft.languages)[number]>) => {
                const next = [...draft.languages]
                next[i] = { ...l, ...patch }
                update({ languages: next })
              }
              const LevelSelect = ({ label, value, onPick, allowEmpty }: { label: string; value?: string | null; onPick: (v: string) => void; allowEmpty?: boolean }) => (
                <div>
                  <label className="mb-1 block text-xs font-medium text-navy-600">{label}</label>
                  <select
                    value={value ?? ''}
                    onChange={(e) => onPick(e.target.value)}
                    className="h-10 w-full rounded-lg border border-navy-200 bg-white px-2 text-sm text-navy-900 focus:border-electric-400 focus:outline-none"
                  >
                    {allowEmpty && <option value="">—</option>}
                    {LANG_LEVELS.map((lv) => (
                      <option key={lv} value={lv}>{elc.langLevels[lv]}</option>
                    ))}
                  </select>
                </div>
              )
              return (
                <div key={l.id} className="rounded-lg border border-navy-100 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label={elc.language} value={l.language} onChange={(e) => setLang({ language: e.target.value })} />
                    <LevelSelect label={elc.generalLevel} value={l.level} onPick={(v) => setLang({ level: v as LanguageLevel })} />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <LevelSelect label={elc.oral} value={l.oral} onPick={(v) => setLang({ oral: (v || null) as LanguageLevel | null })} allowEmpty />
                    <LevelSelect label={elc.written} value={l.written} onPick={(v) => setLang({ written: (v || null) as LanguageLevel | null })} allowEmpty />
                    <LevelSelect label={elc.reading} value={l.reading} onPick={(v) => setLang({ reading: (v || null) as LanguageLevel | null })} allowEmpty />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-medium text-navy-700">
                      <input type="checkbox" checked={l.native ?? false} onChange={(e) => setLang({ native: e.target.checked })} className="h-4 w-4 rounded border-navy-300 text-electric-500 focus:ring-electric-400" />
                      {elc.isNative}
                    </label>
                    <button onClick={() => update({ languages: draft.languages.filter((x) => x.id !== l.id) })} className="text-sm font-medium text-red-500 hover:text-red-600">{pc.remove}</button>
                  </div>
                </div>
              )
            })}
            <Button variant="secondary" className="rounded-full" onClick={() => update({ languages: [...draft.languages, { id: newId('lang'), language: '', level: 'professional' }] })}>+ {elc.addLanguage}</Button>
          </div>
        )}

        {tab === 'links' && (
          <div className="space-y-3">
            {draft.links.map((link, i) => (
              <div key={link.id} className="grid gap-3 sm:grid-cols-2">
                <Input label={tp.label} value={link.label} onChange={(e) => { const next = [...draft.links]; next[i] = { ...link, label: e.target.value }; update({ links: next }) }} />
                <Input label={tp.url} value={link.url} onChange={(e) => { const next = [...draft.links]; next[i] = { ...link, url: e.target.value }; update({ links: next }) }} />
              </div>
            ))}
          </div>
        )}

        {tab === 'complementary' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={tp.workAuthorization} value={draft.complementary.workAuthorization ?? ''} onChange={(e) => update({ complementary: { ...draft.complementary, workAuthorization: e.target.value } })} />
            <Input label={tp.noticePeriod} value={draft.complementary.noticePeriod ?? ''} onChange={(e) => update({ complementary: { ...draft.complementary, noticePeriod: e.target.value } })} />
            <Input label={tp.preferredStartDate} type="date" value={draft.complementary.preferredStartDate ?? ''} onChange={(e) => update({ complementary: { ...draft.complementary, preferredStartDate: e.target.value } })} />
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-medium text-navy-700">
              <input type="checkbox" checked={draft.complementary.willingToRelocate ?? false} onChange={(e) => update({ complementary: { ...draft.complementary, willingToRelocate: e.target.checked } })} className="h-4 w-4 rounded border-navy-300 text-electric-500 focus:ring-electric-400" />
              {tp.willingToRelocate}
            </label>
            <div className="sm:col-span-2">
              <TextArea label={pc.baseCoverLetter} rows={6} placeholder={pc.baseCoverLetterPh} value={draft.baseCoverLetter ?? ''} onChange={(e) => update({ baseCoverLetter: e.target.value })} />
            </div>
          </div>
        )}

        {tab === 'certifications' && (
          <div className="space-y-3">
            {(draft.certifications ?? []).map((c, i) => (
              <div key={c.id} className="rounded-lg border border-navy-100 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label={pc.name} value={c.name} onChange={(e) => { const next = [...(draft.certifications ?? [])]; next[i] = { ...c, name: e.target.value }; update({ certifications: next }) }} />
                  <Input label={pc.issuer} value={c.issuer ?? ''} onChange={(e) => { const next = [...(draft.certifications ?? [])]; next[i] = { ...c, issuer: e.target.value }; update({ certifications: next }) }} />
                  <Input label={pc.year} value={c.year ?? ''} onChange={(e) => { const next = [...(draft.certifications ?? [])]; next[i] = { ...c, year: e.target.value }; update({ certifications: next }) }} />
                  <Input label={pc.credUrl} value={c.credentialUrl ?? ''} onChange={(e) => { const next = [...(draft.certifications ?? [])]; next[i] = { ...c, credentialUrl: e.target.value }; update({ certifications: next }) }} />
                </div>
                <button onClick={() => update({ certifications: (draft.certifications ?? []).filter((x) => x.id !== c.id) })} className="mt-3 text-sm font-medium text-red-500 hover:text-red-600">{pc.remove}</button>
              </div>
            ))}
            <Button variant="secondary" className="rounded-full" onClick={() => { const item: Certification = { id: newId('cert'), name: '', issuer: '', year: '' }; update({ certifications: [...(draft.certifications ?? []), item] }) }}>+ {pc.addCert}</Button>
          </div>
        )}

        {tab === 'projects' && (
          <div className="space-y-3">
            {(draft.projects ?? []).map((p, i) => (
              <div key={p.id} className="rounded-lg border border-navy-100 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label={pc.name} value={p.name} onChange={(e) => { const next = [...(draft.projects ?? [])]; next[i] = { ...p, name: e.target.value }; update({ projects: next }) }} />
                  <Input label={pc.url} value={p.url ?? ''} onChange={(e) => { const next = [...(draft.projects ?? [])]; next[i] = { ...p, url: e.target.value }; update({ projects: next }) }} />
                </div>
                <TextArea className="mt-3" label={pc.description} rows={2} value={p.description ?? ''} onChange={(e) => { const next = [...(draft.projects ?? [])]; next[i] = { ...p, description: e.target.value }; update({ projects: next }) }} />
                <button onClick={() => update({ projects: (draft.projects ?? []).filter((x) => x.id !== p.id) })} className="mt-3 text-sm font-medium text-red-500 hover:text-red-600">{pc.remove}</button>
              </div>
            ))}
            <Button variant="secondary" className="rounded-full" onClick={() => { const item: ProjectItem = { id: newId('proj'), name: '', description: '', url: '' }; update({ projects: [...(draft.projects ?? []), item] }) }}>+ {pc.addProject}</Button>
          </div>
        )}

        {tab === 'insights' && (
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-navy-900">{pc.analysisTitle}</h3>
                  <p className="text-sm text-navy-500">{pc.analysisSub}</p>
                </div>
                <Button className="rounded-full" loading={analysisM.isPending} onClick={() => analysisM.mutate()}>{pc.analyzeBtn}</Button>
              </div>
              {draft.analysis && (
                <div className="mt-4 space-y-3 rounded-xl border border-navy-100 bg-navy-50/40 p-4">
                  <div>
                    <p className="text-sm font-semibold text-navy-700">{pc.strengths}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {draft.analysis.strengths.map((s, i) => (<Badge key={i} tone="success">{s}</Badge>))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-700">{pc.growthArea}</p>
                    <p className="mt-0.5 text-sm text-navy-600">{draft.analysis.weaknesses}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-700">{pc.motivation}</p>
                    <p className="mt-0.5 text-sm text-navy-600">{draft.analysis.motivation}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-navy-100 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-navy-900">{pc.skillsTitle}</h3>
                  <p className="text-sm text-navy-500">{pc.skillsSub}</p>
                </div>
                <Button className="rounded-full" loading={skillsM.isPending} onClick={() => skillsM.mutate()}>{pc.suggestBtn}</Button>
              </div>
              {suggested.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {suggested.map((s) => (
                    <button key={s} onClick={() => addSuggested(s)} className="inline-flex items-center gap-1 rounded-full border border-electric-300 bg-electric-50 px-3 py-1 text-sm font-medium text-electric-700 hover:bg-electric-100">+ {s}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Phase 2.2 — multilingual CV adaptation (tone + seniority, not just translation) */}
            <div className="border-t border-navy-100 pt-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-navy-900">Adapt my CV to another language</h3>
                  <p className="text-sm text-navy-500">Translates and adapts tone, formality and seniority to the target market — more than a translation.</p>
                </div>
                <div className="flex items-end gap-2">
                  <label className="text-sm">
                    <span className="mb-1 block text-navy-500">Language</span>
                    <select value={localeLang} onChange={(e) => setLocaleLang(e.target.value)} className="h-10 rounded-lg border border-navy-200 bg-white px-3 text-sm text-navy-900">
                      <option value="es">Spanish</option>
                      <option value="pt-BR">Portuguese (BR)</option>
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </label>
                  <div className="w-28">
                    <Input label="Region" placeholder="optional" value={localeRegion} onChange={(e) => setLocaleRegion(e.target.value)} />
                  </div>
                  <Button className="rounded-full" loading={localizeM.isPending} onClick={() => localizeM.mutate()}>✦ Adapt</Button>
                </div>
              </div>
              {localized && (
                <div className="mt-4 space-y-3 rounded-xl border border-navy-100 bg-navy-50/40 p-4">
                  <div>
                    <p className="text-sm font-semibold text-navy-700">Adapted headline</p>
                    <p className="mt-0.5 text-sm text-navy-600">{localized.personal.headline}</p>
                  </div>
                  {localized.personal.summary && (
                    <div>
                      <p className="text-sm font-semibold text-navy-700">Adapted summary</p>
                      <p className="mt-0.5 text-sm text-navy-600">{localized.personal.summary}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button className="rounded-full" onClick={applyLocalized}>Apply as my profile</Button>
                    <Button variant="secondary" className="rounded-full" onClick={() => setLocalized(null)}>Discard</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </PageTransition>
  )
}
