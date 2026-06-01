import { useState } from 'react'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import type { JobPreferences } from '@/types'
import { useT } from '@/i18n/I18nProvider'

const seniorities: JobPreferences['seniority'][] = ['intern', 'junior', 'mid', 'senior', 'lead', 'principal']
const remoteOptions: JobPreferences['remote'][] = ['onsite', 'hybrid', 'remote', 'any']

export function PreferencesStep({
  initial,
  onNext,
  saving,
}: {
  initial: JobPreferences
  onNext: (prefs: JobPreferences) => void
  saving: boolean
}) {
  const to = useT().app.onboarding
  const [roles, setRoles] = useState(initial.targetRoles.join(', '))
  const [seniority, setSeniority] = useState(initial.seniority)
  const [locations, setLocations] = useState(initial.locations.join(', '))
  const [remote, setRemote] = useState(initial.remote)
  const [salaryMin, setSalaryMin] = useState(initial.salaryMin?.toString() ?? '')

  const submit = () => {
    onNext({
      targetRoles: roles.split(',').map((s) => s.trim()).filter(Boolean),
      seniority,
      locations: locations.split(',').map((s) => s.trim()).filter(Boolean),
      remote,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryCurrency: initial.salaryCurrency ?? 'USD',
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-navy-900">{to.prefsTitle}</h2>
        <p className="mt-1 text-sm text-navy-500">{to.prefsSubtitle}</p>
      </div>

      <Input
        label={to.targetRoles}
        placeholder={to.targetRolesPlaceholder}
        value={roles}
        onChange={(e) => setRoles(e.target.value)}
      />

      <div>
        <p className="mb-1.5 text-sm font-medium text-navy-700">{to.seniority}</p>
        <div className="flex flex-wrap gap-2">
          {seniorities.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeniority(s)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                seniority === s
                  ? 'border-electric-500 bg-electric-50 text-electric-700'
                  : 'border-navy-200 text-navy-600 hover:bg-navy-50'
              }`}
            >
              {to.seniorities[s]}
            </button>
          ))}
        </div>
      </div>

      <Input
        label={to.preferredLocations}
        placeholder={to.locationsPlaceholder}
        value={locations}
        onChange={(e) => setLocations(e.target.value)}
      />

      <div>
        <p className="mb-1.5 text-sm font-medium text-navy-700">{to.workMode}</p>
        <div className="flex flex-wrap gap-2">
          {remoteOptions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRemote(r)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                remote === r
                  ? 'border-electric-500 bg-electric-50 text-electric-700'
                  : 'border-navy-200 text-navy-600 hover:bg-navy-50'
              }`}
            >
              {to.remote[r]}
            </button>
          ))}
        </div>
      </div>

      <Input
        label={to.minSalary}
        type="number"
        placeholder="45000"
        value={salaryMin}
        onChange={(e) => setSalaryMin(e.target.value)}
      />

      <Button onClick={submit} className="w-full" loading={saving}>
        {to.continue}
      </Button>
    </div>
  )
}
