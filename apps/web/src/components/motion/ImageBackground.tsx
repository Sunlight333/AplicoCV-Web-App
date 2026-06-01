import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Full-bleed image background with an optional slow parallax drift tied to scroll
 * and a configurable overlay so foreground text stays readable. One downloaded
 * image is assigned per section (see /public/backgrounds). Honors
 * prefers-reduced-motion by disabling the parallax transform.
 */
export function ImageBackground({
  src,
  className = '',
  overlay = 'bg-white/55',
  parallax = 60,
  blur = false,
}: {
  src: string
  className?: string
  /** Tailwind classes for the readability overlay layered over the image. */
  overlay?: string
  /** Vertical parallax travel in px across the element's scroll range. */
  parallax?: number
  blur?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [-parallax, parallax])

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt=""
        loading="lazy"
        style={{ y: reduced ? 0 : y }}
        className={`absolute inset-0 h-[120%] w-full object-cover ${blur ? 'blur-2xl scale-110' : ''}`}
      />
      <div className={`absolute inset-0 ${overlay}`} />
    </div>
  )
}
