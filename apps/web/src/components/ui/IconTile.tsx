import { Icon, type IconName } from './Icon'
import { cn } from '@/lib/cn'

type Size = 'sm' | 'md' | 'lg'
// A restrained multi-hue set — deliberately NO purple. Each tone is a solid,
// embossed metal chip; hues let a grid of tiles read as distinct at a glance.
type Tone = 'brand' | 'soft' | 'navy' | 'teal' | 'emerald' | 'amber' | 'rose'

const tile: Record<Size, string> = {
  sm: 'h-9 w-9 rounded-lg',
  md: 'h-11 w-11 rounded-xl',
  lg: 'h-14 w-14 rounded-2xl',
}
const glyph: Record<Size, string> = {
  sm: 'h-[18px] w-[18px]',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
}
// Solid, embossed tiles — depth from light (top highlight + bottom cut + cast
// shadow), never a gradient fill. One light source, shared with the buttons.
const tones: Record<Tone, string> = {
  brand: 'bg-electric-500 text-white shadow-emboss',
  navy: 'bg-navy-900 text-white shadow-emboss',
  teal: 'bg-cyan-500 text-white shadow-emboss',
  emerald: 'bg-emerald-600 text-white shadow-emboss',
  amber: 'bg-amber-500 text-white shadow-emboss',
  rose: 'bg-rose-500 text-white shadow-emboss',
  soft: 'bg-white text-electric-600 ring-1 ring-inset ring-navy-900/[0.06] shadow-emboss-card',
}

/** A clean line icon inside an embossed metal tile — the app's icon language. */
export function IconTile({
  name,
  size = 'md',
  tone = 'brand',
  className,
}: {
  name: IconName
  size?: Size
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'relative inline-flex flex-none items-center justify-center',
        tile[size],
        tones[tone],
        className,
      )}
    >
      <Icon name={name} className={glyph[size]} strokeWidth={tone === 'soft' ? 1.75 : 1.9} />
    </span>
  )
}
