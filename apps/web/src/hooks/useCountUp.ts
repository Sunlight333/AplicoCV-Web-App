import { useEffect, useRef, useState } from 'react'

/** Animate a number from 0 to `target` once on mount. */
export function useCountUp(target: number, durationMs = 1100) {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    let raf = 0
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now
      const progress = Math.min(1, (now - startRef.current) / durationMs)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}
