import { cn } from '@/lib/cn'

type Size = 'sm' | 'md' | 'lg'

const sizes: Record<Size, { box: string; text: string }> = {
  sm: { box: 'h-7 w-7', text: 'text-base' },
  md: { box: 'h-9 w-9', text: 'text-xl' },
  lg: { box: 'h-11 w-11', text: 'text-2xl' },
}

export function Logo({
  className,
  mark = false,
  size = 'sm',
}: {
  className?: string
  mark?: boolean
  size?: Size
}) {
  const s = sizes[size]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 font-extrabold tracking-tight',
        s.text,
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className={cn('flex-none', s.box)}>
        <defs>
          <linearGradient id="aplico-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3392ff" />
            <stop offset="0.5" stopColor="#8f6cff" />
            <stop offset="1" stopColor="#1fbef0" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#aplico-mark)" />
        <path
          d="M9 22 L16 9 L23 22"
          fill="none"
          stroke="white"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="22" r="1.8" fill="white" />
      </svg>
      {!mark && (
        <span>
          Aplico<span className="text-gradient">CV</span>
        </span>
      )}
    </span>
  )
}
