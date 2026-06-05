import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/Toast'
import { useT } from '@/i18n/I18nProvider'
import { scoreAts } from '@/services/dashboard'
import type { AtsAnalysis } from '@/types'

export default function AtsSimulatorPage() {
  const { toast } = useToast()
  const t = useT()
  const ta = t.app.more.ats
  const [jd, setJd] = useState('')
  const [result, setResult] = useState<AtsAnalysis | null>(null)

  const m = useMutation({
    mutationFn: () => scoreAts(jd.trim()),
    onSuccess: setResult,
    onError: () => toast(t.app.aiTools.error, 'error'),
  })

  const total = result ? result.matchedKeywords.length + result.missingKeywords.length : 0
  const coverage = total ? Math.round((result!.matchedKeywords.length / total) * 100) : 0

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{ta.title}</h1>
      <p className="mt-1 text-navy-500">{ta.subtitle}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <TextArea
            label={ta.jd}
            rows={14}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder={t.app.aiTools.jdPlaceholder}
          />
          <Button className="mt-4 rounded-full" loading={m.isPending} disabled={!jd.trim()} onClick={() => m.mutate()}>
            {ta.run}
          </Button>
        </Card>

        <Card className="p-6">
          {!result ? (
            <div className="flex h-full min-h-[18rem] items-center justify-center text-center text-sm text-navy-400">
              {ta.empty}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-navy-400">{ta.coverage}</p>
                  <p className="text-3xl font-bold text-navy-900">{result.matchScore}%</p>
                </div>
                <Badge tone={result.qualification === 'strong match' ? 'success' : 'warning'}>
                  {result.qualification}
                </Badge>
              </div>

              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-navy-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-electric-400 to-violet-500"
                  style={{ width: `${coverage}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-navy-400">
                {result.matchedKeywords.length}/{total} keywords matched
              </p>

              <div className="mt-5">
                <p className="text-sm font-semibold text-navy-700">{ta.matched}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.matchedKeywords.length ? (
                    result.matchedKeywords.map((k) => <Badge key={k} tone="success">{k}</Badge>)
                  ) : (
                    <span className="text-xs text-navy-400">—</span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-navy-700">{ta.missing}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.missingKeywords.length ? (
                    result.missingKeywords.map((k) => <Badge key={k} tone="warning">{k}</Badge>)
                  ) : (
                    <span className="text-xs text-navy-400">—</span>
                  )}
                </div>
              </div>

              {result.recommendations.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-navy-700">{ta.tips}</p>
                  <ul className="mt-2 space-y-1.5">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-navy-600">
                        <span className="text-electric-500">→</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  )
}
