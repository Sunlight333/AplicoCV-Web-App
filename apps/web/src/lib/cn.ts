type ClassValue = string | number | false | null | undefined

/** Tiny classnames joiner — no dependency needed for our usage. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
