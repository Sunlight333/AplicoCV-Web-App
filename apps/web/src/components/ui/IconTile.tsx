import { type IconName } from './Icon'
import { cn } from '@/lib/cn'

type Size = 'sm' | 'md' | 'lg'
// `tone` is kept only for backward-compat with existing call sites. The icons are
// now full 3D-rendered objects (`/icons/3d/<name>.png`) that carry their own colour,
// material and lighting, so there is no coloured chip to tint — the prop is ignored.
type Tone = 'brand' | 'soft' | 'navy' | 'teal' | 'emerald' | 'amber' | 'rose'

// Sized to show the 3D icon as large as possible. No tile background, no ring, no
// padding — the object fills the box edge-to-edge (it already carries ~8% of internal
// breathing room), so it reads big and borderless.
const box: Record<Size, string> = {
  sm: 'h-12 w-12', // 48px
  md: 'h-16 w-16', // 64px
  lg: 'h-20 w-20', // 80px
}

/** A single 3D-rendered icon, shown large and borderless. `name` maps 1:1 to a PNG
 *  in `public/icons/3d/`. */
export function IconTile({
  name,
  size = 'md',
  className,
}: {
  name: IconName
  size?: Size
  tone?: Tone // accepted but unused — see note above
  className?: string
}) {
  return (
    <span className={cn('inline-flex flex-none items-center justify-center', box[size], className)}>
      <img
        src={`/icons/3d/${name}.png`}
        alt=""
        draggable={false}
        loading="lazy"
        className="h-full w-full select-none object-contain"
      />
    </span>
  )
}
