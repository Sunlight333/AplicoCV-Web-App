import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

// Embossed metal buttons: a SOLID fill (no gradient) that reads as an extruded
// key — a hairline highlight along the top edge, a dark cut along the bottom, and
// a cast shadow beneath. Pressing flips the cut to the top and collapses the cast
// shadow, so the key physically travels down into the surface.
const variants: Record<Variant, string> = {
  primary:
    'bg-electric-500 text-white shadow-emboss hover:shadow-emboss-hover hover:-translate-y-px active:translate-y-0.5 active:shadow-emboss-press disabled:bg-electric-300 disabled:shadow-none disabled:translate-y-0',
  secondary:
    'bg-navy-900 text-white shadow-emboss hover:shadow-emboss-hover hover:-translate-y-px active:translate-y-0.5 active:shadow-emboss-press disabled:bg-navy-400 disabled:shadow-none disabled:translate-y-0',
  ghost:
    'bg-transparent text-navy-700 hover:bg-navy-900/[0.06] disabled:text-navy-300',
  danger:
    'bg-red-600 text-white shadow-emboss hover:shadow-emboss-hover hover:-translate-y-px active:translate-y-0.5 active:shadow-emboss-press disabled:bg-red-300 disabled:shadow-none disabled:translate-y-0',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[box-shadow,transform,background-color] duration-150 will-change-transform',
        'focus-visible:ring-2 focus-visible:ring-electric-400 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:active:translate-y-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
