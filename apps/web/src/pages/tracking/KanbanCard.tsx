import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Application } from '@/types'

export function KanbanCard({
  app,
  onOpen,
}: {
  app: Application
  onOpen: (app: Application) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className="rounded-lg border border-navy-100 bg-white p-3 shadow-card"
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 cursor-grab text-navy-300 hover:text-navy-500 active:cursor-grabbing"
          aria-label="Drag"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>
        <button onClick={() => onOpen(app)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-navy-900">{app.jobTitle}</p>
          <p className="truncate text-xs text-navy-400">{app.company}</p>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-navy-300">
            {app.portal}
          </p>
        </button>
      </div>
    </div>
  )
}
