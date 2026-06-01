import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'

/**
 * Cycles through a list of words with a type/erase effect. To prevent any layout
 * shift ("shaking"), an invisible sizer renders the longest phrase and the live
 * text is stacked on top of it in the SAME CSS grid cell. Both stay in normal
 * flow (no absolute positioning) so an ancestor's gradient `background-clip: text`
 * still clips to the visible glyphs — otherwise the text renders invisible.
 */
export function Typewriter({
  words,
  className,
  typeMs = 70,
  eraseMs = 40,
  holdMs = 1400,
}: {
  words: string[]
  className?: string
  typeMs?: number
  eraseMs?: number
  holdMs?: number
}) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'typing' | 'erasing'>('typing')

  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), '')

  useEffect(() => {
    if (reduced) {
      setText(words[0])
      return
    }
    const current = words[index % words.length]
    let timer: ReturnType<typeof setTimeout>

    if (phase === 'typing') {
      if (text.length < current.length) {
        timer = setTimeout(() => setText(current.slice(0, text.length + 1)), typeMs)
      } else {
        timer = setTimeout(() => setPhase('erasing'), holdMs)
      }
    } else if (text.length > 0) {
      timer = setTimeout(() => setText(current.slice(0, text.length - 1)), eraseMs)
    } else {
      setIndex((i) => i + 1)
      setPhase('typing')
    }
    return () => clearTimeout(timer)
  }, [text, phase, index, words, reduced, typeMs, eraseMs, holdMs])

  return (
    <span className={cn('grid text-left', className)}>
      {/* Sizer: reserves space for the longest phrase so the box never resizes. */}
      <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-pre-wrap">
        {longest}
      </span>
      {/* Live text: same grid cell, in normal flow → inherits gradient clip. */}
      <span className="col-start-1 row-start-1 whitespace-pre-wrap">
        {text}
        <span
          className="ml-0.5 inline-block w-[3px] animate-pulse bg-electric-500 align-middle"
          style={{ height: '0.85em' }}
        />
      </span>
    </span>
  )
}
