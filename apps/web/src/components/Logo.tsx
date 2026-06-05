import { cn } from '@/lib/cn'

type Size = 'sm' | 'md' | 'lg'

const sizes: Record<Size, { box: string; text: string }> = {
  sm: { box: 'h-8 w-8', text: 'text-base' },
  md: { box: 'h-10 w-10', text: 'text-xl' },
  lg: { box: 'h-12 w-12', text: 'text-2xl' },
}

/**
 * Brand logo: the newly generated 3D glass mark (`/logo.png`, transparent PNG)
 * plus the AplicoCV wordmark. Pass `mark` for the icon only. The image works on
 * both light and dark surfaces, so callers only need to set the wordmark colour.
 */
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
        'inline-flex items-center gap-2 font-extrabold tracking-tight',
        s.text,
        className,
      )}
    >
      <img
        src="/logo.png"
        alt="AplicoCV"
        draggable={false}
        className={cn('flex-none select-none object-contain drop-shadow-sm', s.box)}
      />
      {!mark && (
        <span>
          Aplico<span className="text-gradient">CV</span>
        </span>
      )}
    </span>
  )
}
