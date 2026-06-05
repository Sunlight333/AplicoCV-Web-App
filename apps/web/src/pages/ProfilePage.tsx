import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
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
import { getPersonalAnalysis, getSkillSuggestions } from '@/services/ai'
import type { Profile, Certification, ProjectItem } from '@/types'
import { SkillsEditor } from './profile/SkillsEditor'
import { UploadStep } from './onboarding/UploadStep'
import { cn } from '@/lib/cn'
import { ApiError } from '@/lib/apiClient'
import { useT } from '@/i18n/I18nProvider'

const TABS = [
  'personal',
  'experience',
  'education',
  'skills',
  'certifications',
  'projects',
  'languages',
  'links',
  'complementary',
  'insights',
] as const
type Tab = (typeof TABS)[number]

const EXTRA_TAB_LABELS: Record<string, string> = {
  certifications: 'Certifications',
  projects: 'Projects',
  insights: 'AI Insights',
}

const newId = (p: string) =>
  `${p}_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`

export default function ProfilePage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const t = useT()
  const tp = t.app.profile
  const [tab, setTab] = useState<Tab>('personal')
  const [draft, setDraft] = useState<Profile | null>(null)
  const [reimportOpen, setReimportOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasting, setPasting] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile })

  // The CV re-import (parse) already persisted the new profile server-side; just
  // reflect it locally and in the query cache, then close the modal.
  const handleReimported = (profile: Profile) => {
    setDraft(profile)
    qc.setQueryData(['profile'], profile)
    qc.invalidateQueries({ queryKey: ['credits'] })
    setReimportOpen(false)
    setPasteText('')
    toast('CV imported — your profile was updated')
  }

  const handlePaste = async () => {
    setPasting(true)
    try {
      const profile = await parseText(pasteText)
      if (profile) handleReimported(profile)
    } catch {
      toast('Could not parse the pasted text', 'error')
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

  // Update local draft immediately, persist debounced.
  const update = (patch: Partial<Profile>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d))
    save(patch)
  }

  const tabLabel = (k: Tab): string =>
    k in tp.tabs ? (tp.tabs as Record<string, string>)[k] : EXTRA_TAB_LABELS[k]

  // AI insights (each charges credits server-side).
  const [suggested, setSuggested] = useState<string[]>([])
  const analysisM = useMutation({
    mutationFn: getPersonalAnalysis,
    onSuccess: (res) => {
      setDraft((d) => (d ? { ...d, analysis: res } : d))
      qc.setQueryData(['profile'], (old: Profile | undefined) => (old ? { ...old, analysis: res } : old))
      qc.invalidateQueries({ queryKey: ['credits'] })
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Could not analyze', 'error'),
  })
  const skillsM = useMutation({
    mutationFn: getSkillSuggestions,
    onSuccess: (res) => {
      setSuggested(res)
      qc.invalidateQueries({ queryKey: ['credits'] })
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Could not suggest skills', 'error'),
  })
  const addSuggested = (skill: string) => {
    if (draft && !draft.skills.includes(skill)) update({ skills: [...draft.skills, skill] })
    setSuggested((s) => s.filter((x) => x !== skill))
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
          <Button variant="secondary" className="rounded-full" onClick={() => setReimportOpen(true)}>
            ↑ Re-import CV
          </Button>
        </div>
      </div>

      <Modal open={reimportOpen} onClose={() => setReimportOpen(false)}>
        <div className="rounded-2xl bg-white p-7 shadow-card-hover">
          <div className="mb-1 flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-navy-900">Replace your CV</h2>
            <button
              onClick={() => setReimportOpen(false)}
              className="text-navy-400 hover:text-navy-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="mb-4 text-sm text-navy-500">
            Upload a new CV — or paste your CV text — to re-parse and replace your current profile.
            You can edit anything afterward.
          </p>
          <UploadStep onParsed={handleReimported} />
          <div className="mt-5 border-t border-navy-100 pt-5">
            <p className="mb-2 text-sm font-medium text-navy-700">…or paste your CV text</p>
            <TextArea
              rows={5}
              placeholder="Paste your full CV text here — it's the main source for the AI."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <Button
              className="mt-3 rounded-full"
              disabled={!pasteText.trim()}
              loading={pasting}
              onClick={handlePaste}
            >
              Parse pasted text
            </Button>
          </div>
        </div>
      </Modal>

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
            {tabLabel(tabKey)}
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
                    <Input label="Start" placeholder="2022-01" value={exp.startDate} onChange={(e) => setExp({ startDate: e.target.value })} />
                    <Input label={`End (${tp.present})`} placeholder="2024-06 or blank" value={exp.endDate ?? ''} onChange={(e) => setExp({ endDate: e.target.value || null })} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-navy-700">Highlights</p>
                  <div className="mt-1.5 space-y-2">
                    {exp.bullets.map((b, bi) => (
                      <div key={bi} className="flex items-start gap-2">
                        <span className="mt-3 text-navy-300">•</span>
                        <TextArea
                          rows={1}
                          className="flex-1"
                          value={b}
                          onChange={(e) => setExp({ bullets: exp.bullets.map((x, xi) => (xi === bi ? e.target.value : x)) })}
                        />
                        <button
                          onClick={() => setExp({ bullets: exp.bullets.filter((_, xi) => xi !== bi) })}
                          className="mt-2 text-navy-300 hover:text-red-500"
                          aria-label="Remove highlight"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <button onClick={() => setExp({ bullets: [...exp.bullets, ''] })} className="text-sm font-medium text-electric-600 hover:underline">
                      + Add highlight
                    </button>
                    <button
                      onClick={() => update({ experience: draft.experience.filter((x) => x.id !== exp.id) })}
                      className="text-sm font-medium text-red-500 hover:text-red-600"
                    >
                      Remove role
                    </button>
                  </div>
                </div>
              )
            })}
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() =>
                update({
                  experience: [
                    ...draft.experience,
                    { id: newId('exp'), title: '', employer: '', startDate: '', endDate: null, bullets: [] },
                  ],
                })
              }
            >
              + Add experience
            </Button>
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
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-navy-700">Your skills</p>
              <SkillsEditor skills={draft.skills} onChange={(skills) => update({ skills })} />
            </div>
            <div>
              <p className="text-sm font-medium text-navy-700">Skills / roles to avoid</p>
              <p className="mb-2 text-xs text-navy-400">Things you don’t want to be matched on.</p>
              <SkillsEditor
                skills={draft.skillsToAvoid ?? []}
                onChange={(skillsToAvoid) => update({ skillsToAvoid })}
              />
            </div>
          </div>
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
            <div className="sm:col-span-2">
              <TextArea
                label="Base cover letter"
                rows={6}
                placeholder="A reusable letter the AI personalizes for each posting…"
                value={draft.baseCoverLetter ?? ''}
                onChange={(e) => update({ baseCoverLetter: e.target.value })}
              />
            </div>
          </div>
        )}

        {tab === 'certifications' && (
          <div className="space-y-3">
            {(draft.certifications ?? []).map((c, i) => (
              <div key={c.id} className="rounded-lg border border-navy-100 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Name"
                    value={c.name}
                    onChange={(e) => {
                      const next = [...(draft.certifications ?? [])]
                      next[i] = { ...c, name: e.target.value }
                      update({ certifications: next })
                    }}
                  />
                  <Input
                    label="Issuer"
                    value={c.issuer ?? ''}
                    onChange={(e) => {
                      const next = [...(draft.certifications ?? [])]
                      next[i] = { ...c, issuer: e.target.value }
                      update({ certifications: next })
                    }}
                  />
                  <Input
                    label="Year"
                    value={c.year ?? ''}
                    onChange={(e) => {
                      const next = [...(draft.certifications ?? [])]
                      next[i] = { ...c, year: e.target.value }
                      update({ certifications: next })
                    }}
                  />
                  <Input
                    label="Credential URL"
                    value={c.credentialUrl ?? ''}
                    onChange={(e) => {
                      const next = [...(draft.certifications ?? [])]
                      next[i] = { ...c, credentialUrl: e.target.value }
                      update({ certifications: next })
                    }}
                  />
                </div>
                <button
                  onClick={() => update({ certifications: (draft.certifications ?? []).filter((x) => x.id !== c.id) })}
                  className="mt-3 text-sm font-medium text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => {
                const item: Certification = { id: newId('cert'), name: '', issuer: '', year: '' }
                update({ certifications: [...(draft.certifications ?? []), item] })
              }}
            >
              + Add certification
            </Button>
          </div>
        )}

        {tab === 'projects' && (
          <div className="space-y-3">
            {(draft.projects ?? []).map((p, i) => (
              <div key={p.id} className="rounded-lg border border-navy-100 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Name"
                    value={p.name}
                    onChange={(e) => {
                      const next = [...(draft.projects ?? [])]
                      next[i] = { ...p, name: e.target.value }
                      update({ projects: next })
                    }}
                  />
                  <Input
                    label="URL"
                    value={p.url ?? ''}
                    onChange={(e) => {
                      const next = [...(draft.projects ?? [])]
                      next[i] = { ...p, url: e.target.value }
                      update({ projects: next })
                    }}
                  />
                </div>
                <TextArea
                  className="mt-3"
                  label="Description"
                  rows={2}
                  value={p.description ?? ''}
                  onChange={(e) => {
                    const next = [...(draft.projects ?? [])]
                    next[i] = { ...p, description: e.target.value }
                    update({ projects: next })
                  }}
                />
                <button
                  onClick={() => update({ projects: (draft.projects ?? []).filter((x) => x.id !== p.id) })}
                  className="mt-3 text-sm font-medium text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => {
                const item: ProjectItem = { id: newId('proj'), name: '', description: '', url: '' }
                update({ projects: [...(draft.projects ?? []), item] })
              }}
            >
              + Add project
            </Button>
          </div>
        )}

        {tab === 'insights' && (
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-navy-900">Personal analysis</h3>
                  <p className="text-sm text-navy-500">Your strengths, a growth area, and what drives you.</p>
                </div>
                <Button className="rounded-full" loading={analysisM.isPending} onClick={() => analysisM.mutate()}>
                  ✦ Analyze me (10 credits)
                </Button>
              </div>
              {draft.analysis && (
                <div className="mt-4 space-y-3 rounded-xl border border-navy-100 bg-navy-50/40 p-4">
                  <div>
                    <p className="text-sm font-semibold text-navy-700">Strengths</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {draft.analysis.strengths.map((s, i) => (
                        <Badge key={i} tone="success">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-700">Growth area</p>
                    <p className="mt-0.5 text-sm text-navy-600">{draft.analysis.weaknesses}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-700">Motivation</p>
                    <p className="mt-0.5 text-sm text-navy-600">{draft.analysis.motivation}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-navy-100 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-navy-900">Skill suggestions</h3>
                  <p className="text-sm text-navy-500">Relevant skills to add to your profile.</p>
                </div>
                <Button className="rounded-full" loading={skillsM.isPending} onClick={() => skillsM.mutate()}>
                  ✦ Suggest skills (10 credits)
                </Button>
              </div>
              {suggested.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {suggested.map((s) => (
                    <button
                      key={s}
                      onClick={() => addSuggested(s)}
                      className="inline-flex items-center gap-1 rounded-full border border-electric-300 bg-electric-50 px-3 py-1 text-sm font-medium text-electric-700 hover:bg-electric-100"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </PageTransition>
  )
}
