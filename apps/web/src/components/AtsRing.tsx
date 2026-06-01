import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * SVG circular progress ring that fills on mount via stroke-dashoffset.
 * Colour classification: red < 50, yellow 50–70, green > 70.
 */
export function AtsRing({
  score,
  size = 140,
  stroke = 12,
}: {
  score: number
  size?: number
  stroke?: number
}) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 80)
    return () => clearTimeout(t)
  }, [score])

  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animated / 100) * circumference
  const color = score > 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e8ecf6"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-extrabold tabular-nums')} style={{ color }}>
          {Math.round(animated)}
        </span>
        <span className="text-xs font-medium text-navy-400">match</span>
      </div>
    </div>
  )
}
