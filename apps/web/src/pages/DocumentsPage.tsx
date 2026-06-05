import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/Toast'
import { getLibrary, getGeneratedDoc, type GeneratedDoc } from '@/services/documents'
import { downloadTextPdf } from '@/lib/pdf'
import { cn } from '@/lib/cn'

function DocCard({ doc, onOpen }: { doc: GeneratedDoc; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="text-left">
      <Card className="h-full p-5 transition-shadow hover:shadow-card-hover">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium text-navy-900">{doc.title}</p>
          {doc.atsScore != null && <Badge tone="info">ATS {doc.atsScore}%</Badge>}
        </div>
        <p className="mt-1 text-xs text-navy-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
        <p className="mt-3 line-clamp-3 text-sm text-navy-500">{doc.preview}</p>
        <span className="mt-3 inline-block text-sm font-medium text-electric-600">Open →</span>
      </Card>
    </button>
  )
}

export default function DocumentsPage() {
  const [tab, setTab] = useState<'cvs' | 'letters'>('cvs')
  const [openId, setOpenId] = useState<string | null>(null)
  const { toast } = useToast()
  const { data, isLoading } = useQuery({ queryKey: ['library'], queryFn: getLibrary })
  const detail = useQuery({
    queryKey: ['document', openId],
    queryFn: () => getGeneratedDoc(openId as string),
    enabled: !!openId,
  })

  const download = () => {
    if (detail.data) downloadTextPdf(detail.data.title, detail.data.text)
  }

  const items = data ? (tab === 'cvs' ? data.cvs : data.letters) : []

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">Generated CVs &amp; letters</h1>
      <p className="mt-1 text-navy-500">Everything you’ve created with AI.</p>

      <div className="mt-6 inline-flex rounded-full bg-navy-100 p-1">
        {([['cvs', 'Optimized CVs', data?.cvs.length], ['letters', 'Cover letters', data?.letters.length]] as const).map(
          ([key, label, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                tab === key ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500',
              )}
            >
              {label} ({count ?? 0})
            </button>
          ),
        )}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Card className="p-6"><Skeleton className="h-20 w-full" /></Card>
        ) : items.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 p-10 text-center">
            <p className="text-navy-500">You haven’t generated any {tab === 'cvs' ? 'CVs' : 'cover letters'} yet.</p>
            <Link to={tab === 'cvs' ? '/optimize' : '/ai-tools'}>
              <Button className="rounded-full">
                {tab === 'cvs' ? 'Create my first optimized CV' : 'Generate a cover letter'}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((d) => (
              <DocCard key={d.id} doc={d} onOpen={() => setOpenId(d.id)} />
            ))}
          </div>
        )}
      </div>

      <Modal open={!!openId} onClose={() => setOpenId(null)}>
        <div className="max-h-[80vh] overflow-hidden rounded-2xl bg-white p-6 shadow-card-hover">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-navy-900">{detail.data?.title ?? 'Document'}</h2>
            <button onClick={() => setOpenId(null)} className="text-navy-400 hover:text-navy-700" aria-label="Close">
              ✕
            </button>
          </div>
          {detail.isLoading ? (
            <Skeleton className="mt-4 h-40 w-full" />
          ) : (
            <pre className="mt-4 max-h-[52vh] overflow-auto whitespace-pre-wrap rounded-lg border border-navy-100 bg-navy-50/40 p-4 text-sm text-navy-700">
              {detail.data?.text}
            </pre>
          )}
          <div className="mt-4 flex gap-2">
            <Button
              className="rounded-full"
              onClick={() => {
                if (detail.data) {
                  navigator.clipboard.writeText(detail.data.text)
                  toast('Copied to clipboard')
                }
              }}
            >
              Copy
            </Button>
            <Button variant="secondary" className="rounded-full" onClick={download}>
              Download
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  )
}
