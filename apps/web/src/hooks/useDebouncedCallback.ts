import { useEffect, useMemo, useRef } from 'react'

/**
 * Returns a stable debounced version of `callback`. Used by the profile page to
 * batch inline edits into a single PATCH after 800ms of inactivity.
 */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay = 800,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return useMemo(() => {
    const debounced = (...args: A) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => callbackRef.current(...args), delay)
    }
    debounced.flush = (...args: A) => {
      if (timer.current) clearTimeout(timer.current)
      callbackRef.current(...args)
    }
    return debounced
  }, [delay])
}
