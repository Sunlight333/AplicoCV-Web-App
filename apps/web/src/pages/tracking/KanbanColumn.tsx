import { useDroppable } from '@dnd-kit/core'
import type { Application, ApplicationStatus } from '@/types'
import { statusMeta } from './statusMeta'
import { KanbanCard } from './KanbanCard'
import { cn } from '@/lib/cn'
import { useT } from '@/i18n/I18nProvider'

export function KanbanColumn({
  status,
  apps,
  onOpen,
}: {
  status: ApplicationStatus
  apps: Application[]
  onOpen: (app: Application) => void
}) {
  const t = useT()
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = statusMeta(t, status)

  return (
    <div className="flex w-72 flex-none flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-navy-700">{meta.label}</span>
        <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-500">
          {apps.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[60vh] flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors',
          isOver ? 'border-electric-400 bg-electric-50' : 'border-navy-100 bg-navy-50/60',
        )}
      >
        {apps.map((app) => (
          <KanbanCard key={app.id} app={app} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}
