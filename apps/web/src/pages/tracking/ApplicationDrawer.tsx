import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Application } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { TextArea } from '@/components/ui/Field'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { statusMeta } from './statusMeta'
import { useT } from '@/i18n/I18nProvider'

export function ApplicationDrawer({
  app,
  onClose,
  onSaveNotes,
}: {
  app: Application | null
  onClose: () => void
  onSaveNotes: (id: string, notes: string) => void
}) {
  const t = useT()
  const tt = t.app.tracking
  const [notes, setNotes] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setNotes(app?.notes ?? '')
  }, [app])

  const persist = useDebouncedCallback((value: string) => {
    if (app) {
      onSaveNotes(app.id, value)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1500)
    }
  }, 800)

  return (
    <AnimatePresence>
      {app && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-navy-900/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-card-hover"
          >
            <div className="flex items-start justify-between border-b border-navy-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-navy-900">{app.jobTitle}</h2>
                <p className="text-sm text-navy-500">
                  {app.company} · {app.portal}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-700"
                aria-label={tt.close}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex items-center gap-3">
                <Badge tone={statusMeta(t, app.status).tone}>{statusMeta(t, app.status).label}</Badge>
                <span className="text-xs text-navy-400">
                  {tt.appliedOn(new Date(app.appliedAt).toLocaleDateString())}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">{tt.jobUrl}</p>
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-electric-600 hover:underline"
                >
                  {app.jobUrl}
                </a>
              </div>

              {app.cvVersionLabel && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">{tt.cvVersion}</p>
                  <p className="text-sm text-navy-700">{app.cvVersionLabel}</p>
                </div>
              )}

              {app.coverLetter && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">{tt.coverLetter}</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-navy-50 p-3 text-sm text-navy-600">
                    {app.coverLetter}
                  </p>
                </div>
              )}

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">{tt.notes}</p>
                  {savedFlash && <span className="text-xs text-green-600">{tt.saved}</span>}
                </div>
                <TextArea
                  rows={5}
                  value={notes}
                  placeholder={tt.notesPlaceholder}
                  onChange={(e) => {
                    setNotes(e.target.value)
                    persist(e.target.value)
                  }}
                />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
