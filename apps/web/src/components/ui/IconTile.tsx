import { Icon, type IconName } from './Icon'
import { cn } from '@/lib/cn'

type Size = 'sm' | 'md' | 'lg'
type Tone = 'brand' | 'soft' | 'navy'

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
const tones: Record<Tone, string> = {
  brand: 'bg-brand-gradient text-white shadow-tile',
  navy: 'bg-btn-navy text-white shadow-btn-dark',
  soft: 'bg-tile-soft text-electric-600 ring-1 ring-inset ring-white/70 shadow-elev-1',
}

/** A clean line icon inside a gradient tile with depth — the app's icon language. */
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
        'sheen-top relative inline-flex flex-none items-center justify-center',
        tile[size],
        tones[tone],
        className,
      )}
    >
      <Icon name={name} className={glyph[size]} strokeWidth={tone === 'soft' ? 1.75 : 1.9} />
    </span>
  )
}
