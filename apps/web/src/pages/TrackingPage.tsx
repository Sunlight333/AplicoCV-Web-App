import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { PageTransition } from '@/components/PageTransition'
import { Skeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Field'
import { useToast } from '@/components/Toast'
import {
  listApplications,
  updateApplicationStatus,
  updateApplicationNotes,
  createApplication,
} from '@/services/applications'
import type { Application, ApplicationStatus } from '@/types'
import { statusOrder } from './tracking/statusMeta'
import { KanbanColumn } from './tracking/KanbanColumn'
import { ApplicationDrawer } from './tracking/ApplicationDrawer'
import { useT } from '@/i18n/I18nProvider'
import { useCopy } from '@/i18n/useCopy'
import type { Locale } from '@/i18n/dictionaries'

const EMPTY_COPY: Record<Locale, { title: string; body: string; install: string }> = {
  en: { title: 'No applications yet', body: 'When you apply on LinkedIn, Workday, Indeed and other portals with the AplicoCV extension, your applications show up here with their status.', install: 'Install the extension' },
  es: { title: 'Aún no hay postulaciones', body: 'Cuando postules en LinkedIn, Workday, Indeed y otros portales con la extensión de AplicoCV, tus postulaciones aparecerán aquí con su estado.', install: 'Instalar la extensión' },
  'pt-BR': { title: 'Nenhuma candidatura ainda', body: 'Quando você se candidatar no LinkedIn, Workday, Indeed e outros portais com a extensão da AplicoCV, suas candidaturas aparecerão aqui com o status.', install: 'Instalar a extensão' },
}

export default function TrackingPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const t = useT()
  const [active, setActive] = useState<Application | null>(null)
  const [portalFilter, setPortalFilter] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const ta = t.app.more.addApp
  const ec = useCopy(EMPTY_COPY)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ company: '', jobTitle: '', portal: '', jobUrl: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['applications', search],
    queryFn: () => listApplications(search ? { search } : {}),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      updateApplicationStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['applications'] })
      const prev = qc.getQueryData<Application[]>(['applications'])
      qc.setQueryData<Application[]>(['applications'], (old) =>
        old?.map((a) => (a.id === id ? { ...a, status } : a)),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['applications'], ctx.prev)
      toast(t.app.tracking.moveError, 'error')
    },
  })

  const notesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      updateApplicationNotes(id, notes),
    onSuccess: (updated) => {
      qc.setQueryData<Application[]>(['applications'], (old) =>
        old?.map((a) => (a.id === updated.id ? updated : a)),
      )
    },
  })

  const addMutation = useMutation({
    mutationFn: () =>
      createApplication({
        company: form.company.trim(),
        jobTitle: form.jobTitle.trim(),
        portal: form.portal.trim() || 'Manual',
        jobUrl: form.jobUrl.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      setShowAdd(false)
      setForm({ company: '', jobTitle: '', portal: '', jobUrl: '' })
      toast(ta.added)
    },
    onError: () => toast(t.app.aiTools.error, 'error'),
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const portals = useMemo(
    () => Array.from(new Set((data ?? []).map((a) => a.portal))),
    [data],
  )

  const filtered = useMemo(
    () => (data ?? []).filter((a) => (portalFilter ? a.portal === portalFilter : true)),
    [data, portalFilter],
  )

  const byStatus = useMemo(() => {
    const map: Record<ApplicationStatus, Application[]> = {
      applied: [], viewed: [], interview: [], offer: [], rejected: [],
    }
    for (const app of filtered) map[app.status].push(app)
    return map
  }, [filtered])

  const onDragEnd = (e: DragEndEvent) => {
    const id = e.active.id as string
    const target = e.over?.id as ApplicationStatus | undefined
    if (!target) return
    const app = data?.find((a) => a.id === id)
    if (app && app.status !== target) {
      statusMutation.mutate({ id, status: target })
    }
  }

  return (
    <PageTransition>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{t.app.tracking.title}</h1>
          <p className="mt-1 text-navy-500">{t.app.tracking.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
        {search && (
          <button
            onClick={() => setSearchParams({})}
            className="inline-flex items-center gap-1.5 rounded-lg bg-electric-50 px-3 py-2 text-sm font-medium text-electric-700 transition-colors hover:bg-electric-100"
          >
            “{search}” ✕
          </button>
        )}
        <select
          value={portalFilter}
          onChange={(e) => setPortalFilter(e.target.value)}
          className="h-10 rounded-lg border border-navy-200 bg-white px-3 text-sm text-navy-700 focus:outline-none focus:ring-2 focus:ring-electric-400"
        >
          <option value="">{t.app.tracking.allPortals}</option>
          {portals.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <Button className="rounded-lg" onClick={() => setShowAdd(true)}>+ {ta.title}</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 flex gap-4 overflow-x-auto">
          {statusOrder.map((s) => (
            <Card key={s} className="w-72 flex-none p-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-20 w-full" />
              <Skeleton className="mt-2 h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : data && data.length === 0 && !search ? (
        <Card className="mt-6 flex flex-col items-center gap-4 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-electric-50 text-2xl">🗂️</div>
          <div>
            <p className="font-semibold text-navy-900">{ec.title}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-navy-500">{ec.body}</p>
          </div>
          <Link to="/extension">
            <Button className="rounded-full">{ec.install}</Button>
          </Link>
        </Card>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
            {statusOrder.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                apps={byStatus[status]}
                onOpen={setActive}
              />
            ))}
          </div>
        </DndContext>
      )}

      <ApplicationDrawer
        app={active}
        onClose={() => setActive(null)}
        onSaveNotes={(id, notes) => notesMutation.mutate({ id, notes })}
      />

      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-navy-900">{ta.title}</h2>
          <div className="mt-4 space-y-3">
            <Input label={ta.company} value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
            <Input label={ta.role} value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} />
            <Input label={ta.portal} placeholder="LinkedIn, Indeed…" value={form.portal} onChange={(e) => setForm((f) => ({ ...f, portal: e.target.value }))} />
            <Input label={ta.url} value={form.jobUrl} onChange={(e) => setForm((f) => ({ ...f, jobUrl: e.target.value }))} />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>{t.app.tracking.close}</Button>
            <Button
              loading={addMutation.isPending}
              disabled={!form.company.trim() || !form.jobTitle.trim()}
              onClick={() => addMutation.mutate()}
            >
              {ta.add}
            </Button>
          </div>
        </Card>
      </Modal>
    </PageTransition>
  )
}
