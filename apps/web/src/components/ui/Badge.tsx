import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'success' | 'warning' | 'info' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-navy-100 text-navy-600 ring-1 ring-inset ring-navy-200/60',
  success: 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-200/70',
  warning: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200/70',
  info: 'bg-electric-100 text-electric-700 ring-1 ring-inset ring-electric-200/70',
  danger: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200/70',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
