import { useState } from 'react'
import { Input, TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import type { Profile, WorkExperience, Education, LanguageSkill, LanguageLevel } from '@/types'
import { useT } from '@/i18n/I18nProvider'

const LEVELS: LanguageLevel[] = ['basic', 'conversational', 'professional', 'advanced', 'native', 'bilingual']

interface ReviewCopy {
  requiredTitle: string
  requiredHint: string
  missing: string
  experience: string
  education: string
  languages: string
  titlePh: string
  employerPh: string
  institutionPh: string
  degreePh: string
  languagePh: string
  add: string
  levelOpts: Record<LanguageLevel, string>
}

const COPY: Record<Locale, ReviewCopy> = {
  en: {
    requiredTitle: 'Required to continue',
    requiredHint: 'Add at least one Experience, Education and Language — the tools need these to autofill correctly.',
    missing: 'Please add at least one entry to: ',
    experience: 'Experience', education: 'Education', languages: 'Languages',
    titlePh: 'Job title', employerPh: 'Company', institutionPh: 'Institution', degreePh: 'Degree', languagePh: 'Language',
    add: 'Add',
    levelOpts: { basic: 'Basic', conversational: 'Conversational', professional: 'Professional', advanced: 'Advanced', native: 'Native', bilingual: 'Bilingual' },
  },
  es: {
    requiredTitle: 'Obligatorio para continuar',
    requiredHint: 'Agrega al menos una Experiencia, una Formación y un Idioma — la herramienta los necesita para autocompletar bien.',
    missing: 'Agrega al menos una entrada en: ',
    experience: 'Experiencia', education: 'Formación', languages: 'Idiomas',
    titlePh: 'Puesto', employerPh: 'Empresa', institutionPh: 'Institución', degreePh: 'Título', languagePh: 'Idioma',
    add: 'Agregar',
    levelOpts: { basic: 'Básico', conversational: 'Conversacional', professional: 'Profesional', advanced: 'Avanzado', native: 'Nativo', bilingual: 'Bilingüe' },
  },
  'pt-BR': {
    requiredTitle: 'Obrigatório para continuar',
    requiredHint: 'Adicione ao menos uma Experiência, uma Formação e um Idioma — a ferramenta precisa deles para preencher corretamente.',
    missing: 'Adicione ao menos uma entrada em: ',
    experience: 'Experiência', education: 'Formação', languages: 'Idiomas',
    titlePh: 'Cargo', employerPh: 'Empresa', institutionPh: 'Instituição', degreePh: 'Diploma', languagePh: 'Idioma',
    add: 'Adicionar',
    levelOpts: { basic: 'Básico', conversational: 'Conversacional', professional: 'Profissional', advanced: 'Avançado', native: 'Nativo', bilingual: 'Bilíngue' },
  },
}

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : String(Math.round(performance.now()))

/**
 * Final onboarding step: let the user correct extraction errors before the
 * profile is committed. Experience, Education and Languages are required — if the
 * CV parse missed any, the user adds it here so they are never blocked downstream.
 */
export function ReviewStep({
  profile,
  onConfirm,
  saving,
}: {
  profile: Profile
  onConfirm: (profile: Profile) => void
  saving: boolean
}) {
  const t = useT()
  const to = t.app.onboarding
  const tp = t.app.profile
  const c = useCopy(COPY)
  const [draft, setDraft] = useState<Profile>(profile)
  const [showMissing, setShowMissing] = useState(false)

  // new-row inputs
  const [exp, setExp] = useState({ title: '', employer: '' })
  const [edu, setEdu] = useState({ institution: '', degree: '' })
  const [lang, setLang] = useState<{ language: string; level: LanguageLevel }>({ language: '', level: 'professional' })

  const setPersonal = (key: keyof Profile['personal'], value: string) =>
    setDraft((d) => ({ ...d, personal: { ...d.personal, [key]: value } }))

  const addExp = () => {
    if (!exp.title.trim() || !exp.employer.trim()) return
    const row: WorkExperience = { id: uid(), title: exp.title.trim(), employer: exp.employer.trim(), startDate: '', endDate: null, bullets: [] }
    setDraft((d) => ({ ...d, experience: [...d.experience, row] }))
    setExp({ title: '', employer: '' })
  }
  const addEdu = () => {
    if (!edu.institution.trim() || !edu.degree.trim()) return
    const row: Education = { id: uid(), institution: edu.institution.trim(), degree: edu.degree.trim(), startDate: '', endDate: null }
    setDraft((d) => ({ ...d, education: [...d.education, row] }))
    setEdu({ institution: '', degree: '' })
  }
  const addLang = () => {
    if (!lang.language.trim()) return
    const row: LanguageSkill = { id: uid(), language: lang.language.trim(), level: lang.level }
    setDraft((d) => ({ ...d, languages: [...d.languages, row] }))
    setLang({ language: '', level: 'professional' })
  }

  const missing = [
    draft.experience.length === 0 && c.experience,
    draft.education.length === 0 && c.education,
    draft.languages.length === 0 && c.languages,
  ].filter(Boolean) as string[]

  const confirm = () => {
    if (missing.length) {
      setShowMissing(true)
      return
    }
    onConfirm(draft)
  }

  const fieldCls = 'h-10 w-full rounded-lg border border-navy-200 bg-white px-3 text-sm text-navy-700'

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-navy-900">{to.reviewTitle}</h2>
        <p className="mt-1 text-sm text-navy-500">{to.reviewSubtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={tp.fullName} value={draft.personal.fullName} onChange={(e) => setPersonal('fullName', e.target.value)} />
        <Input label={tp.headline} value={draft.personal.headline} onChange={(e) => setPersonal('headline', e.target.value)} />
        <Input label={tp.email} value={draft.personal.email} onChange={(e) => setPersonal('email', e.target.value)} />
        <Input label={tp.location} value={draft.personal.location ?? ''} onChange={(e) => setPersonal('location', e.target.value)} />
      </div>

      <TextArea
        label={to.reviewSummary}
        rows={3}
        value={draft.personal.summary}
        onChange={(e) => setPersonal('summary', e.target.value)}
      />

      {missing.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">{c.requiredTitle}</p>
          <p className="mt-1 text-sm text-amber-700">{c.requiredHint}</p>
        </div>
      )}

      {/* Experience (required) */}
      <div className="rounded-xl border border-navy-100 bg-navy-50 p-4">
        <p className="text-sm font-semibold text-navy-700">
          {c.experience} <span className="font-normal text-navy-400">({draft.experience.length})</span>
        </p>
        <ul className="mt-2 space-y-1.5">
          {draft.experience.map((e) => (
            <li key={e.id} className="text-sm text-navy-600">
              <span className="font-medium text-navy-800">{e.title}</span> · {e.employer}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className={`${fieldCls} flex-1`} placeholder={c.titlePh} value={exp.title} onChange={(e) => setExp((s) => ({ ...s, title: e.target.value }))} />
          <input className={`${fieldCls} flex-1`} placeholder={c.employerPh} value={exp.employer} onChange={(e) => setExp((s) => ({ ...s, employer: e.target.value }))} />
          <Button type="button" variant="secondary" className="rounded-full" onClick={addExp}>{c.add}</Button>
        </div>
      </div>

      {/* Education (required) */}
      <div className="rounded-xl border border-navy-100 bg-navy-50 p-4">
        <p className="text-sm font-semibold text-navy-700">
          {c.education} <span className="font-normal text-navy-400">({draft.education.length})</span>
        </p>
        <ul className="mt-2 space-y-1.5">
          {draft.education.map((e) => (
            <li key={e.id} className="text-sm text-navy-600">
              <span className="font-medium text-navy-800">{e.degree}</span> · {e.institution}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className={`${fieldCls} flex-1`} placeholder={c.institutionPh} value={edu.institution} onChange={(e) => setEdu((s) => ({ ...s, institution: e.target.value }))} />
          <input className={`${fieldCls} flex-1`} placeholder={c.degreePh} value={edu.degree} onChange={(e) => setEdu((s) => ({ ...s, degree: e.target.value }))} />
          <Button type="button" variant="secondary" className="rounded-full" onClick={addEdu}>{c.add}</Button>
        </div>
      </div>

      {/* Languages (required) */}
      <div className="rounded-xl border border-navy-100 bg-navy-50 p-4">
        <p className="text-sm font-semibold text-navy-700">
          {c.languages} <span className="font-normal text-navy-400">({draft.languages.length})</span>
        </p>
        <ul className="mt-2 space-y-1.5">
          {draft.languages.map((l) => (
            <li key={l.id} className="text-sm text-navy-600">
              <span className="font-medium text-navy-800">{l.language}</span> · {c.levelOpts[l.level]}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className={`${fieldCls} flex-1`} placeholder={c.languagePh} value={lang.language} onChange={(e) => setLang((s) => ({ ...s, language: e.target.value }))} />
          <select className={`${fieldCls} w-40`} value={lang.level} onChange={(e) => setLang((s) => ({ ...s, level: e.target.value as LanguageLevel }))}>
            {LEVELS.map((lv) => (
              <option key={lv} value={lv}>{c.levelOpts[lv]}</option>
            ))}
          </select>
          <Button type="button" variant="secondary" className="rounded-full" onClick={addLang}>{c.add}</Button>
        </div>
      </div>

      <div className="rounded-xl border border-navy-100 bg-navy-50 p-4">
        <p className="text-sm font-semibold text-navy-700">{to.reviewSkills}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {draft.skills.map((s) => (
            <Badge key={s} tone="info">{s}</Badge>
          ))}
        </div>
      </div>

      {showMissing && missing.length > 0 && (
        <p className="text-sm font-medium text-red-600">{c.missing}{missing.join(', ')}</p>
      )}

      <Button onClick={confirm} className="w-full" loading={saving} disabled={missing.length > 0}>
        {to.saveFinish}
      </Button>
    </div>
  )
}
