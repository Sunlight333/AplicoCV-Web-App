import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input, TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/Toast'
import { useT } from '@/i18n/I18nProvider'
import {
  generateSuperCv,
  generatePersonalizedLetter,
  type SuperCvResult,
  type CoverLetterTone,
} from '@/services/ai'
import { downloadTextPdf } from '@/lib/pdf'
import { ApiError } from '@/lib/apiClient'

const SUPER_CV_COST = 50
const LETTER_COST = 40
const TONES: CoverLetterTone[] = ['professional', 'warm', 'direct']

export default function OptimizePage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const t = useT()
  const [targetRole, setTargetRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [source, setSource] = useState<'system' | 'paste'>('system')
  const [cvText, setCvText] = useState('')
  const [result, setResult] = useState<SuperCvResult | null>(null)

  // Carta 100% Personalizada (from-scratch letter)
  const [company, setCompany] = useState('')
  const [letterRole, setLetterRole] = useState('')
  const [highlights, setHighlights] = useState('')
  const [letterJd, setLetterJd] = useState('')
  const [tone, setTone] = useState<CoverLetterTone>('professional')
  const [letter, setLetter] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      generateSuperCv({
        targetRole: targetRole.trim(),
        jobDescription: jobDescription.trim() || undefined,
        cvText: source === 'paste' ? cvText.trim() || undefined : undefined,
      }),
    onSuccess: (r) => {
      setResult(r)
      qc.invalidateQueries({ queryKey: ['credits'] })
      qc.invalidateQueries({ queryKey: ['library'] })
      toast('Super CV generated 🎉')
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Could not generate', 'error'),
  })

  const letterM = useMutation({
    mutationFn: () =>
      generatePersonalizedLetter({
        jobDescription: letterJd.trim(),
        company: company.trim() || undefined,
        role: letterRole.trim() || undefined,
        highlights: highlights.trim() || undefined,
        tone,
      }),
    onSuccess: (text) => {
      setLetter(text)
      qc.invalidateQueries({ queryKey: ['credits'] })
      qc.invalidateQueries({ queryKey: ['library'] })
      toast('Cover letter ready 🎉')
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : 'Could not generate', 'error'),
  })

  return (
    <PageTransition>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Optimize CV &amp; cover letter</h1>
          <p className="mt-1 text-navy-500">Advanced recruiter-grade tools to multiply your interviews.</p>
        </div>
        <Link to="/documents" className="text-sm font-medium text-electric-600 hover:underline">
          View generated documents →
        </Link>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Super CV (ATS)</h2>
            <p className="mt-1 text-sm text-navy-500">
              A senior recruiter rewrites your experience with the <strong>X-Y-Z formula</strong>,
              with gap analysis and ATS optimization.
            </p>
          </div>
          <Badge tone="info">{SUPER_CV_COST} credits</Badge>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-navy-700">Which CV?</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {(['system', 'paste'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    source === s ? 'border-electric-500 bg-electric-50' : 'border-navy-200 hover:border-electric-300'
                  }`}
                >
                  <span className="font-medium text-navy-900">
                    {s === 'system' ? 'Use my saved profile' : 'Paste another CV'}
                  </span>
                  <span className="mt-0.5 block text-xs text-navy-400">
                    {s === 'system' ? 'Your profile from “Profile”' : 'For this application only'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {source === 'paste' && (
            <TextArea
              label="Paste CV text"
              rows={5}
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
            />
          )}

          <Input
            label="Target role *"
            placeholder="e.g. Senior Frontend Engineer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
          <TextArea
            label="Job description (optional, recommended)"
            rows={5}
            placeholder="Paste the posting's requirements and responsibilities…"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            ⚠️ The AI uses only the facts in your CV — it will not invent roles or companies.
          </div>

          <Button
            className="rounded-full"
            loading={mutation.isPending}
            disabled={!targetRole.trim()}
            onClick={() => mutation.mutate()}
          >
            ✦ Generate Super CV ({SUPER_CV_COST} credits)
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-navy-900">Your optimized CV</h2>
            <div className="flex items-center gap-2">
              <Badge tone={result.atsScore >= 80 ? 'success' : 'info'}>ATS {result.atsScore}%</Badge>
            </div>
          </div>
          {result.gaps.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-navy-500">Missing keywords:</span>
              {result.gaps.map((g) => (
                <Badge key={g} tone="warning">{g}</Badge>
              ))}
            </div>
          )}
          <pre className="mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg border border-navy-100 bg-navy-50/40 p-4 text-sm text-navy-700">
            {result.cvText}
          </pre>
          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => {
                navigator.clipboard.writeText(result.cvText)
                toast('Copied to clipboard')
              }}
            >
              Copy
            </Button>
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => downloadTextPdf(`Super CV — ${targetRole}`, result.cvText)}
            >
              Download PDF
            </Button>
          </div>
        </Card>
      )}

      {/* Carta 100% Personalizada */}
      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">100% personalized cover letter</h2>
            <p className="mt-1 text-sm text-navy-500">
              Written from scratch for one specific posting — references the company, the role and
              what you want to emphasize.
            </p>
          </div>
          <Badge tone="info">{LETTER_COST} credits</Badge>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Company" placeholder="e.g. Acme Inc." value={company} onChange={(e) => setCompany(e.target.value)} />
          <Input label="Role" placeholder="e.g. Product Manager" value={letterRole} onChange={(e) => setLetterRole(e.target.value)} />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-navy-700">Tone</p>
          <div className="flex flex-wrap gap-2">
            {TONES.map((tn) => (
              <button
                key={tn}
                onClick={() => setTone(tn)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  tone === tn ? 'border-electric-500 bg-electric-50 text-electric-700' : 'border-navy-200 text-navy-500 hover:border-electric-300'
                }`}
              >
                {t.app.aiTools.tones[tn]}
              </button>
            ))}
          </div>
        </div>
        <TextArea className="mt-4" label="What should it emphasize? (optional)" rows={2} value={highlights} onChange={(e) => setHighlights(e.target.value)} />
        <TextArea className="mt-4" label="Job description *" rows={5} value={letterJd} onChange={(e) => setLetterJd(e.target.value)} />
        <Button
          className="mt-4 rounded-full"
          loading={letterM.isPending}
          disabled={!letterJd.trim()}
          onClick={() => letterM.mutate()}
        >
          ✦ Write my letter ({LETTER_COST} credits)
        </Button>

        {letter && (
          <div className="mt-5">
            <pre className="max-h-[24rem] overflow-auto whitespace-pre-wrap rounded-lg border border-navy-100 bg-navy-50/40 p-4 text-sm text-navy-700">
              {letter}
            </pre>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" className="rounded-full" onClick={() => { navigator.clipboard.writeText(letter); toast('Copied to clipboard') }}>
                Copy
              </Button>
              <Button variant="secondary" className="rounded-full" onClick={() => downloadTextPdf(`Cover letter — ${company || letterRole || 'role'}`, letter)}>
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageTransition>
  )
}
