import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input, TextArea } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/Toast'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { getProfile, patchProfile } from '@/services/profile'
import type { Profile } from '@/types'
import { SkillsEditor } from './profile/SkillsEditor'
import { cn } from '@/lib/cn'
import { useT } from '@/i18n/I18nProvider'

const TABS = [
  'personal',
  'experience',
  'education',
  'skills',
  'languages',
  'links',
  'complementary',
] as const
type Tab = (typeof TABS)[number]

export default function ProfilePage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const t = useT()
  const tp = t.app.profile
  const [tab, setTab] = useState<Tab>('personal')
  const [draft, setDraft] = useState<Profile | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile })

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

  // Update local draft immediately, persist debounced.
  const update = (patch: Partial<Profile>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d))
    save(patch)
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">{tp.title}</h1>
        {mutation.isPending && <span className="text-sm text-navy-400">{tp.saving}</span>}
      </div>

      {/* Tabs with animated underline */}
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
            {tp.tabs[tabKey]}
            {tab === tabKey && (
              <motion.span
                layoutId="profile-tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-electric-500"
              />
            )}
          </button>
        ))}
      </div>

      <Card className="mt-6 p-6">
        {tab === 'personal' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={tp.fullName}
              value={draft.personal.fullName}
              onChange={(e) => update({ personal: { ...draft.personal, fullName: e.target.value } })}
            />
            <Input
              label={tp.headline}
              value={draft.personal.headline}
              onChange={(e) => update({ personal: { ...draft.personal, headline: e.target.value } })}
            />
            <Input
              label={tp.email}
              value={draft.personal.email}
              onChange={(e) => update({ personal: { ...draft.personal, email: e.target.value } })}
            />
            <Input
              label={tp.phone}
              value={draft.personal.phone ?? ''}
              onChange={(e) => update({ personal: { ...draft.personal, phone: e.target.value } })}
            />
            <Input
              label={tp.location}
              value={draft.personal.location ?? ''}
              onChange={(e) => update({ personal: { ...draft.personal, location: e.target.value } })}
            />
            <div className="sm:col-span-2">
              <TextArea
                label={tp.summary}
                rows={4}
                value={draft.personal.summary}
                onChange={(e) => update({ personal: { ...draft.personal, summary: e.target.value } })}
              />
            </div>
          </div>
        )}

        {tab === 'experience' && (
          <div className="space-y-4">
            {draft.experience.map((exp, i) => (
              <div key={exp.id} className="rounded-lg border border-navy-100 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label={tp.title_}
                    value={exp.title}
                    onChange={(e) => {
                      const next = [...draft.experience]
                      next[i] = { ...exp, title: e.target.value }
                      update({ experience: next })
                    }}
                  />
                  <Input
                    label={tp.employer}
                    value={exp.employer}
                    onChange={(e) => {
                      const next = [...draft.experience]
                      next[i] = { ...exp, employer: e.target.value }
                      update({ experience: next })
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-navy-400">
                  {exp.startDate} – {exp.endDate ?? tp.present}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-navy-600">
                  {exp.bullets.map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {tab === 'education' && (
          <div className="space-y-3">
            {draft.education.map((edu) => (
              <div key={edu.id} className="rounded-lg border border-navy-100 p-4">
                <p className="font-medium text-navy-900">{edu.degree}</p>
                <p className="text-sm text-navy-500">{edu.institution}</p>
                <p className="mt-1 text-xs text-navy-400">
                  {edu.startDate} – {edu.endDate ?? tp.present}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === 'skills' && (
          <SkillsEditor skills={draft.skills} onChange={(skills) => update({ skills })} />
        )}

        {tab === 'languages' && (
          <div className="flex flex-wrap gap-2">
            {draft.languages.map((l) => (
              <Badge key={l.id} tone="neutral" className="capitalize">
                {l.language} · {l.level}
              </Badge>
            ))}
          </div>
        )}

        {tab === 'links' && (
          <div className="space-y-3">
            {draft.links.map((link, i) => (
              <div key={link.id} className="grid gap-3 sm:grid-cols-2">
                <Input
                  label={tp.label}
                  value={link.label}
                  onChange={(e) => {
                    const next = [...draft.links]
                    next[i] = { ...link, label: e.target.value }
                    update({ links: next })
                  }}
                />
                <Input
                  label={tp.url}
                  value={link.url}
                  onChange={(e) => {
                    const next = [...draft.links]
                    next[i] = { ...link, url: e.target.value }
                    update({ links: next })
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {tab === 'complementary' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={tp.workAuthorization}
              value={draft.complementary.workAuthorization ?? ''}
              onChange={(e) =>
                update({ complementary: { ...draft.complementary, workAuthorization: e.target.value } })
              }
            />
            <Input
              label={tp.noticePeriod}
              value={draft.complementary.noticePeriod ?? ''}
              onChange={(e) =>
                update({ complementary: { ...draft.complementary, noticePeriod: e.target.value } })
              }
            />
            <Input
              label={tp.preferredStartDate}
              type="date"
              value={draft.complementary.preferredStartDate ?? ''}
              onChange={(e) =>
                update({ complementary: { ...draft.complementary, preferredStartDate: e.target.value } })
              }
            />
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-medium text-navy-700">
              <input
                type="checkbox"
                checked={draft.complementary.willingToRelocate ?? false}
                onChange={(e) =>
                  update({ complementary: { ...draft.complementary, willingToRelocate: e.target.checked } })
                }
                className="h-4 w-4 rounded border-navy-300 text-electric-500 focus:ring-electric-400"
              />
              {tp.willingToRelocate}
            </label>
          </div>
        )}
      </Card>
    </PageTransition>
  )
}
