import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Animated "aurora" mesh rendered to a canvas — soft, slow-drifting blobs of
 * electric blue / violet / cyan on a light backdrop. Replaces a video file with
 * a self-contained, lightweight effect. Honors prefers-reduced-motion by
 * painting a single static frame.
 */
const BLOBS = [
  { hue: 211, sat: 100, light: 62, r: 0.42, speed: 0.6, phase: 0 },
  { hue: 258, sat: 90, light: 68, r: 0.36, speed: 0.45, phase: 2.1 },
  { hue: 190, sat: 95, light: 64, r: 0.32, speed: 0.75, phase: 4.2 },
  { hue: 224, sat: 92, light: 60, r: 0.3, speed: 0.5, phase: 1.2 },
]

export function AuroraBackground({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      const time = t / 1000
      for (const b of BLOBS) {
        const cx = w * (0.5 + 0.32 * Math.cos(time * b.speed + b.phase))
        const cy = h * (0.5 + 0.3 * Math.sin(time * b.speed * 0.9 + b.phase * 1.3))
        const radius = Math.min(w, h) * b.r
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        g.addColorStop(0, `hsla(${b.hue}, ${b.sat}%, ${b.light}%, 0.55)`)
        g.addColorStop(1, `hsla(${b.hue}, ${b.sat}%, ${b.light}%, 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
      if (!reduced) raf = requestAnimationFrame(draw)
    }

    draw(0)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reduced])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  )
}
