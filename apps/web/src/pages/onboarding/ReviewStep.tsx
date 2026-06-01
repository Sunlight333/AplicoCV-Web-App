import { useState } from 'react'
import { Input, TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Profile } from '@/types'
import { useT } from '@/i18n/I18nProvider'

/**
 * Final onboarding step: let the user correct extraction errors before the
 * profile is committed. Editing here is intentionally lightweight — the full
 * editor lives on the Profile page.
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
  const [draft, setDraft] = useState<Profile>(profile)

  const setPersonal = (key: keyof Profile['personal'], value: string) =>
    setDraft((d) => ({ ...d, personal: { ...d.personal, [key]: value } }))

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

      <div className="rounded-xl border border-navy-100 bg-navy-50 p-4">
        <p className="text-sm font-semibold text-navy-700">
          {to.reviewExperience} <span className="font-normal text-navy-400">({draft.experience.length})</span>
        </p>
        <ul className="mt-2 space-y-1.5">
          {draft.experience.map((exp) => (
            <li key={exp.id} className="text-sm text-navy-600">
              <span className="font-medium text-navy-800">{exp.title}</span> · {exp.employer}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-navy-100 bg-navy-50 p-4">
        <p className="text-sm font-semibold text-navy-700">{to.reviewSkills}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {draft.skills.map((s) => (
            <Badge key={s} tone="info">{s}</Badge>
          ))}
        </div>
      </div>

      <Button onClick={() => onConfirm(draft)} className="w-full" loading={saving}>
        {to.saveFinish}
      </Button>
    </div>
  )
}
