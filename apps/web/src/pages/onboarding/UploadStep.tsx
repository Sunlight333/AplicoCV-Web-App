import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { uploadCv, parseCv } from '@/services/documents'
import type { ParseProgressEvent, Profile } from '@/types'
import { cn } from '@/lib/cn'
import { useT } from '@/i18n/I18nProvider'

type Phase = 'idle' | 'uploading' | 'parsing' | 'done' | 'error'

export function UploadStep({ onParsed }: { onParsed: (profile: Profile) => void }) {
  const to = useT().app.onboarding
  const [phase, setPhase] = useState<Phase>('idle')
  const [fileName, setFileName] = useState('')
  const [uploadPct, setUploadPct] = useState(0)
  const [events, setEvents] = useState<ParseProgressEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name)
      setError(null)
      setEvents([])
      setPhase('uploading')
      try {
        const { documentId } = await uploadCv(file, setUploadPct)
        setPhase('parsing')
        let finalProfile: Profile | undefined
        for await (const ev of parseCv(documentId)) {
          setEvents((prev) => [...prev, ev])
          if (ev.done && ev.profile) finalProfile = ev.profile
        }
        if (!finalProfile) throw new Error('Parsing finished without a profile')
        setPhase('done')
        onParsed(finalProfile)
      } catch (e) {
        setError(e instanceof Error ? e.message : to.uploadError)
        setPhase('error')
      }
    },
    [onParsed, to.uploadError],
  )

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) void handleFile(accepted[0])
    },
    [handleFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: phase === 'uploading' || phase === 'parsing',
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-navy-900">{to.uploadTitle}</h2>
        <p className="mt-1 text-sm text-navy-500">{to.uploadSubtitle}</p>
      </div>

      {phase === 'idle' || phase === 'error' ? (
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
            isDragActive ? 'border-electric-500 bg-electric-50' : 'border-navy-200 hover:border-electric-400 hover:bg-navy-50',
          )}
        >
          <input {...getInputProps()} />
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-navy-300" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
          </svg>
          <p className="mt-3 font-medium text-navy-700">
            {isDragActive ? to.dropActive : to.dropIdle}
          </p>
          <p className="mt-1 text-xs text-navy-400">{to.maxFile}</p>
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="rounded-xl border border-navy-100 bg-white p-5">
          <p className="text-sm font-medium text-navy-700">{fileName}</p>

          {phase === 'uploading' && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-navy-400">
                <span>{to.uploading}</span>
                <span>{uploadPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-navy-100">
                <motion.div
                  className="h-full rounded-full bg-electric-500"
                  animate={{ width: `${uploadPct}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {(phase === 'parsing' || phase === 'done') && (
            <ul className="mt-4 space-y-2">
              <AnimatePresence initial={false}>
                {events.map((ev, i) => (
                  <motion.li
                    key={`${ev.stage}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-sm text-navy-600"
                  >
                    {ev.done ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs text-white">✓</span>
                    ) : (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-200 border-t-electric-500" />
                    )}
                    {ev.message}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          {phase === 'done' && (
            <p className="mt-4 text-sm font-medium text-green-600">{to.parsedOk}</p>
          )}
        </div>
      )}

      {phase === 'error' && (
        <Button variant="ghost" onClick={() => setPhase('idle')}>
          {to.tryAnother}
        </Button>
      )}
    </div>
  )
}
