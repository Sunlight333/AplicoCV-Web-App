import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
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

interface DocsCopy {
  title: string; subtitle: string; cvs: string; letters: string; open: string
  emptyCvs: string; emptyLetters: string; createCv: string; createLetter: string
  document: string; copy: string; download: string; copied: string
}

const COPY: Record<Locale, DocsCopy> = {
  en: {
    title: 'Generated CVs & letters', subtitle: 'Everything you’ve created with AI.',
    cvs: 'Optimized CVs', letters: 'Cover letters', open: 'Open →',
    emptyCvs: 'You haven’t generated any CVs yet.', emptyLetters: 'You haven’t generated any cover letters yet.',
    createCv: 'Create my first optimized CV', createLetter: 'Generate a cover letter',
    document: 'Document', copy: 'Copy', download: 'Download', copied: 'Copied to clipboard',
  },
  es: {
    title: 'CVs y cartas generados', subtitle: 'Todo lo que has creado con IA.',
    cvs: 'CVs optimizados', letters: 'Cartas de presentación', open: 'Abrir →',
    emptyCvs: 'Aún no has generado ningún CV.', emptyLetters: 'Aún no has generado ninguna carta.',
    createCv: 'Crear mi primer CV optimizado', createLetter: 'Generar una carta',
    document: 'Documento', copy: 'Copiar', download: 'Descargar', copied: 'Copiado al portapapeles',
  },
  'pt-BR': {
    title: 'Currículos e cartas gerados', subtitle: 'Tudo o que você criou com IA.',
    cvs: 'Currículos otimizados', letters: 'Cartas de apresentação', open: 'Abrir →',
    emptyCvs: 'Você ainda não gerou nenhum currículo.', emptyLetters: 'Você ainda não gerou nenhuma carta.',
    createCv: 'Criar meu primeiro currículo otimizado', createLetter: 'Gerar uma carta',
    document: 'Documento', copy: 'Copiar', download: 'Baixar', copied: 'Copiado para a área de transferência',
  },
}

function DocCard({ doc, onOpen, openLabel }: { doc: GeneratedDoc; onOpen: () => void; openLabel: string }) {
  return (
    <button onClick={onOpen} className="text-left">
      <Card className="h-full p-5 transition-shadow hover:shadow-elev-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium text-navy-900">{doc.title}</p>
          {doc.atsScore != null && <Badge tone="info">ATS {doc.atsScore}%</Badge>}
        </div>
        <p className="mt-1 text-xs text-navy-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
        <p className="mt-3 line-clamp-3 text-sm text-navy-500">{doc.preview}</p>
        <span className="mt-3 inline-block text-sm font-medium text-electric-600">{openLabel}</span>
      </Card>
    </button>
  )
}

export default function DocumentsPage() {
  const c = useCopy(COPY)
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
      <h1 className="text-2xl font-bold text-navy-900">{c.title}</h1>
      <p className="mt-1 text-navy-500">{c.subtitle}</p>

      <div className="mt-6 inline-flex rounded-full bg-navy-100 p-1">
        {([['cvs', c.cvs, data?.cvs.length], ['letters', c.letters, data?.letters.length]] as const).map(
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
            <p className="text-navy-500">{tab === 'cvs' ? c.emptyCvs : c.emptyLetters}</p>
            <Link to={tab === 'cvs' ? '/optimize' : '/ai-tools'}>
              <Button className="rounded-full">{tab === 'cvs' ? c.createCv : c.createLetter}</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((d) => (
              <DocCard key={d.id} doc={d} onOpen={() => setOpenId(d.id)} openLabel={c.open} />
            ))}
          </div>
        )}
      </div>

      <Modal open={!!openId} onClose={() => setOpenId(null)}>
        <div className="max-h-[80vh] overflow-hidden rounded-2xl bg-white p-6 shadow-elev-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-navy-900">{detail.data?.title ?? c.document}</h2>
            <button onClick={() => setOpenId(null)} className="text-navy-400 hover:text-navy-700" aria-label="Close">✕</button>
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
                  toast(c.copied)
                }
              }}
            >
              {c.copy}
            </Button>
            <Button variant="secondary" className="rounded-full" onClick={download}>{c.download}</Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  )
}
