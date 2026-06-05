import { useI18n } from './I18nProvider'
import type { Locale } from './dictionaries'

/**
 * Select localized copy for a component. Verbose, page-specific prose lives in a
 * per-page `Record<Locale, T>` map and this hook picks the active locale (falling
 * back to English). Used across app pages and marketing/legal pages so every
 * screen responds to the language switcher.
 */
export function useCopy<T>(map: Record<Locale, T>): T {
  const { locale } = useI18n()
  return map[locale] ?? map.en
}
