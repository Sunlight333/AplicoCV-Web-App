import type { ReactNode } from 'react'

/**
 * Seamless infinite marquee. Renders its children twice and translates -50% so
 * the loop is continuous. Pauses on hover.
 */
export function Marquee({
  children,
  durationSec = 32,
  className,
}: {
  children: ReactNode
  durationSec?: number
  className?: string
}) {
  return (
    <div
      className={`group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] ${className ?? ''}`}
    >
      <div
        className="flex w-max gap-4 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ animation: `marquee-scroll ${durationSec}s linear infinite` }}
      >
        <div className="flex shrink-0 gap-4">{children}</div>
        <div className="flex shrink-0 gap-4" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}
