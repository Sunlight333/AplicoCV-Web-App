import type { HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-navy-100/70 bg-white shadow-elev-2',
        className,
      )}
      {...props}
    />
  )
}

/** Card variant that lifts on hover — used for interactive lists/grids. */
export function HoverCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'rounded-2xl border border-navy-100/70 bg-white shadow-elev-2 transition-shadow hover:shadow-elev-4',
        className,
      )}
      {...(props as object)}
    />
  )
}
