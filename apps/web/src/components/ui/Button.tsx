import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

// Raised "elevated depth" buttons: a vertical light→dark gradient reads as an
// extruded surface, the inset top highlight (in shadow-btn*) is the sheen, and
// the button presses down (translate-y) on click.
const variants: Record<Variant, string> = {
  primary:
    'bg-btn-blue text-white shadow-btn hover:shadow-btn-hover active:translate-y-px disabled:bg-electric-300 disabled:bg-none disabled:shadow-none',
  secondary:
    'bg-btn-navy text-white shadow-btn-dark hover:shadow-elev-3 active:translate-y-px disabled:bg-navy-400 disabled:bg-none disabled:shadow-none',
  ghost:
    'bg-transparent text-navy-700 hover:bg-navy-100 disabled:text-navy-300',
  danger:
    'bg-btn-red text-white shadow-elev-2 hover:shadow-elev-3 active:translate-y-px disabled:bg-red-300 disabled:bg-none disabled:shadow-none',
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
        'relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[box-shadow,transform,background-color] duration-150',
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
