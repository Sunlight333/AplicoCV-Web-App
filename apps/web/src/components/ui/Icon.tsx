import type { ReactNode, SVGProps } from 'react'
import { cn } from '@/lib/cn'

export type IconName =
  | 'dashboard' | 'user' | 'applications' | 'sparkles' | 'optimize' | 'interview'
  | 'ats' | 'document' | 'gift' | 'referrals' | 'help' | 'extension' | 'book' | 'grid'
  | 'settings' | 'key' | 'card' | 'logout' | 'search' | 'target' | 'bolt' | 'lock'
  | 'globe' | 'mail' | 'chat' | 'activity' | 'rocket' | 'shield' | 'trending' | 'brain'
  | 'leaf' | 'pen' | 'folder' | 'star' | 'check' | 'download' | 'copy'

/* Clean, consistent line icons (24×24, single stroke). Lucide-flavoured. */
const paths: Record<IconName, ReactNode> = {
  dashboard: (<>
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" />
  </>),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  applications: (<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h4" /></>),
  sparkles: (<>
    <path d="M12 3l1.8 4.6L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.4z" />
    <path d="M5 16l.6 1.6L7.5 18.5l-1.9.6L5 21l-.6-1.9L2.5 18.5l1.9-.5z" />
  </>),
  optimize: (<><path d="M4 19h16" /><path d="M7 16l3.5-4 3 3L20 8" /><path d="M20 8h-3M20 8v3" /></>),
  interview: (<><path d="M21 11.5a8.5 8.5 0 0 1-9 8.5L3 21l1.1-3.3A8.5 8.5 0 1 1 21 11.5z" /><path d="M8.5 11h7M8.5 14h4" /></>),
  ats: (<>
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M8 12.5l2.5 2.5L16 9.5" />
  </>),
  document: (<><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /><path d="M9.5 13h5M9.5 16.5h5" /></>),
  gift: (<>
    <rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v9h14v-9" /><path d="M12 8v13" />
    <path d="M12 8C12 5 9.5 3.2 8 4.5 6.7 5.6 8.5 8 12 8zM12 8c0-3 2.5-4.8 4-3.5C17.3 5.6 15.5 8 12 8z" />
  </>),
  referrals: (<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16.5 7.6a3 3 0 0 1 0 5.8M20.5 20a5 5 0 0 0-3.4-4.7" /></>),
  help: (<><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.6 2.6 0 0 1 5 .7c0 1.8-2.6 2-2.6 3.5" /><path d="M12 17h.01" /></>),
  extension: (<><path d="M9 4.5a1.5 1.5 0 0 1 3 0V6h2.5A1.5 1.5 0 0 1 16 7.5V10h1.5a1.5 1.5 0 0 1 0 3H16v3.5a1.5 1.5 0 0 1-1.5 1.5H12v-1.5a1.5 1.5 0 0 0-3 0V18H6.5A1.5 1.5 0 0 1 5 16.5V13H3.5a1.5 1.5 0 0 1 0-3H5V7.5A1.5 1.5 0 0 1 6.5 6H9z" /></>),
  book: (<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3z" /></>),
  grid: (<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 13a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 1 1-4 0 1.6 1.6 0 0 0-2.7-1.1 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 4 13a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.1-2.7 2 2 0 1 1 2.8-2.8A1.6 1.6 0 0 0 10.6 4a2 2 0 1 1 2.8 0 1.6 1.6 0 0 0 2.7 1.1 2 2 0 1 1 2.8 2.8A1.6 1.6 0 0 0 20 9a2 2 0 1 1 0 4 1.6 1.6 0 0 0-.6 0z" /></>),
  key: (<><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2 20 3M16 7l3 3M14.5 8.5l3 3" /></>),
  card: (<><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 9.5h19M6.5 15h4" /></>),
  logout: (<><path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>),
  target: (<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></>),
  bolt: (<><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></>),
  lock: (<><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /><path d="M12 15v2" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></>),
  chat: (<><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" /></>),
  activity: (<><path d="M3 12h4l3 8 4-16 3 8h4" /></>),
  rocket: (<><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2" /><path d="M9 12a14 14 0 0 1 7-9c2.5 0 4 1.5 4 4a14 14 0 0 1-9 7" /><circle cx="14.5" cy="9.5" r="1.4" /><path d="M9 12l3 3" /></>),
  shield: (<><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>),
  trending: (<><path d="M3 17l6-6 4 4 8-8" /><path d="M21 7h-5M21 7v5" /></>),
  brain: (<><path d="M9.5 4A2.5 2.5 0 0 0 7 6.5 2.5 2.5 0 0 0 5 9a2.5 2.5 0 0 0 .8 4.4A2.5 2.5 0 0 0 7 18a2.5 2.5 0 0 0 2.5 2V4z" /><path d="M14.5 4A2.5 2.5 0 0 1 17 6.5 2.5 2.5 0 0 1 19 9a2.5 2.5 0 0 1-.8 4.4A2.5 2.5 0 0 1 17 18a2.5 2.5 0 0 1-2.5 2V4z" /></>),
  leaf: (<><path d="M11 20A7 7 0 0 1 4 13C4 8 8 4 20 4c0 8-4 12-9 12z" /><path d="M4 20c2-4.5 6-7.5 11-8.5" /></>),
  pen: (<><path d="M14 4l6 6M4 20l1.2-4.2L16 5l3 3L8.2 18.8z" /></>),
  folder: (<><path d="M3 7a2 2 0 0 1 2-2h3.5l2 2.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>),
  star: (<><path d="M12 3l2.6 5.6 6 .8-4.4 4.1 1.1 6L12 16.8 6.7 19.5l1.1-6L3.4 9.4l6-.8z" /></>),
  check: (<><path d="M5 12.5l4.5 4.5L19 7" /></>),
  download: (<><path d="M12 3v12M7 11l5 5 5-5M5 21h14" /></>),
  copy: (<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></>),
}

export function Icon({
  name,
  className,
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-5 w-5', className)}
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
