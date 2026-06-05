import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/cn'

/**
 * 3D tilt-on-hover wrapper. The card rotates toward the cursor in perspective,
 * giving the "elevated depth" surfaces a tactile, three-dimensional feel.
 */
export function TiltCard({
  children,
  className,
  max = 7,
}: {
  children: ReactNode
  className?: string
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 220, damping: 18 })
  const rotateY = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 220, damping: 18 })

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  const reset = () => {
    mx.set(0.5)
    my.set(0.5)
  }

  return (
    <div className="perspective h-full" onMouseMove={onMove} onMouseLeave={reset}>
      <motion.div
        ref={ref}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileHover={{ y: -4 }}
        className={cn('h-full', className)}
      >
        {children}
      </motion.div>
    </div>
  )
}
