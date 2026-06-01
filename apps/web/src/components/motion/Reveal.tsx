import type { ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

const offset: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 32 },
  down: { y: -32 },
  left: { x: 32 },
  right: { x: -32 },
  none: {},
}

/**
 * Scroll-driven entrance. Fades + slides in the first time it enters the
 * viewport. `delay` and `direction` let callers stagger groups of elements.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode
  direction?: Direction
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'span'
}) {
  const variants: Variants = {
    hidden: { opacity: 0, ...offset[direction] },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
    },
  }
  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-12% 0px' }}
    >
      {children}
    </MotionTag>
  )
}

/** Wrap a group to stagger its <Reveal> children automatically. */
export function RevealGroup({
  children,
  className,
  stagger = 0.1,
}: {
  children: ReactNode
  className?: string
  stagger?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-12% 0px' }}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}
