import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TextArea } from '@/components/ui/Field'
import { AtsRing } from '@/components/AtsRing'
import { useToast } from '@/components/Toast'
import { scoreAts } from '@/services/dashboard'
import { addSkills } from '@/services/profile'
import { generateCoverLetter, type CoverLetterTone } from '@/services/ai'
import { useT } from '@/i18n/I18nProvider'
import type { AtsAnalysis } from '@/types'

export default function AiToolsPage() {
  const t = useT()
  const ta = t.app.aiTools
  const qc = useQueryClient()
  const { toast } = useToast()

  const [jd, setJd] = useState('')
  const [analysis, setAnalysis] = useState<AtsAnalysis | null>(null)
  const [tone, setTone] = useState<CoverLetterTone>('professional')
  const [letter, setLetter] = useState('')

  const ats = useMutation({
    mutationFn: () => scoreAts(jd),
    onSuccess: setAnalysis,
    onError: () => toast(ta.error, 'error'),
  })

  const cover = useMutation({
    mutationFn: () => generateCoverLetter(jd, tone),
    onSuccess: setLetter,
    onError: () => toast(ta.error, 'error'),
  })

  const addSkill = useMutation({
    mutationFn: (skill: string) => addSkills([skill]),
    onSuccess: (profile) => {
      qc.setQueryData(['profile'], profile)
      toast(ta.added)
    },
  })

  const tones: CoverLetterTone[] = ['professional', 'warm', 'direct']

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{ta.title}</h1>
      <p className="mt-1 text-navy-500">{ta.subtitle}</p>

      {/* Shared job description input */}
      <Card className="mt-6 p-6">
        <label className="text-sm font-semibold text-navy-900">{ta.jobDescription}</label>
        <TextArea
          rows={6}
          className="mt-2"
          placeholder={ta.jdPlaceholder}
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button loading={ats.isPending} disabled={!jd.trim()} onClick={() => ats.mutate()}>
            {ta.runAts}
          </Button>
          <Button
            variant="secondary"
            loading={cover.isPending}
            disabled={!jd.trim()}
            onClick={() => cover.mutate()}
          >
            {ta.genCover}
          </Button>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* ATS Simulator result */}
        <Card className="p-6">
          <h2 className="font-semibold text-navy-900">{ta.atsTitle}</h2>
          {!analysis ? (
            <p className="mt-4 text-sm text-navy-400">{ta.atsEmpty}</p>
          ) : (
            <div className="mt-4">
              <div className="flex items-center gap-5">
                <AtsRing score={analysis.matchScore} size={120} />
                <div>
                  <Badge
                    tone={
                      analysis.qualification === 'strong match'
                        ? 'success'
                        : analysis.qualification === 'overqualified'
                          ? 'info'
                          : 'warning'
                    }
                  >
                    {analysis.qualification}
                  </Badge>
                  <p className="mt-2 text-sm text-navy-500">{ta.matchedCount(analysis.matchedKeywords.length)}</p>
                </div>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-navy-300">{ta.coverageTitle}</p>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart
                  layout="vertical"
                  data={[
                    { name: ta.matched, count: analysis.matchedKeywords.length },
                    { name: ta.missing, count: analysis.missingKeywords.length },
                  ]}
                  margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
                >
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                    <Cell fill="#16a34a" />
                    <Cell fill="#f59e0b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-navy-300">{ta.matched}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analysis.matchedKeywords.map((k) => (
                  <Badge key={k} tone="success">{k}</Badge>
                ))}
              </div>

              {analysis.missingKeywords.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-navy-300">{ta.missing}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {analysis.missingKeywords.map((k) => (
                      <button
                        key={k}
                        onClick={() => addSkill.mutate(k)}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-200"
                        title={ta.addToProfile}
                      >
                        {k} <span className="text-amber-500">+</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-navy-300">{ta.recommendations}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-navy-600">
                {analysis.recommendations.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="text-electric-500">→</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Cover letter result */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy-900">{ta.coverTitle}</h2>
            <div className="flex gap-1">
              {tones.map((to) => (
                <button
                  key={to}
                  onClick={() => setTone(to)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    tone === to ? 'bg-electric-50 text-electric-700' : 'text-navy-400 hover:bg-navy-100'
                  }`}
                >
                  {ta.tones[to]}
                </button>
              ))}
            </div>
          </div>
          {!letter ? (
            <p className="mt-4 text-sm text-navy-400">{ta.coverEmpty}</p>
          ) : (
            <>
              <p className="mt-4 whitespace-pre-wrap rounded-lg bg-navy-50 p-4 text-sm text-navy-700">{letter}</p>
              <Button
                variant="ghost"
                className="mt-3"
                onClick={() => {
                  navigator.clipboard.writeText(letter)
                  toast(ta.copied)
                }}
              >
                {ta.copy}
              </Button>
            </>
          )}
        </Card>
      </div>
    </PageTransition>
  )
}
