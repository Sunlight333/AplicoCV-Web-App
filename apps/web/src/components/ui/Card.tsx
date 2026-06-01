import type { HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-navy-100 bg-white shadow-card', className)}
      {...props}
    />
  )
}

/** Card variant that lifts on hover — used for interactive lists/grids. */
export function HoverCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'rounded-xl border border-navy-100 bg-white shadow-card transition-shadow hover:shadow-card-hover',
        className,
      )}
      {...(props as object)}
    />
  )
}
