import { useI18n } from '@/i18n/I18nProvider'
import type { Locale } from '@/i18n/dictionaries'

/**
 * Select localized copy for marketing/legal pages. Their prose is verbose and
 * doesn't belong in the strict UI dictionary, so each page holds its own
 * `Record<Locale, T>` and picks the active locale (falling back to English).
 */
export function useCopy<T>(map: Record<Locale, T>): T {
  const { locale } = useI18n()
  return map[locale] ?? map.en
}
