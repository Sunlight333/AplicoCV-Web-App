// Whole-unit currencies (no decimal cents). Keep in sync with the backend
// pricing module (app/pricing.py ZERO_DECIMAL).
export const ZERO_DECIMAL = new Set(['CLP', 'COP', 'ARS', 'PYG'])

/** Format a catalogue amount in its currency, respecting zero-decimal currencies. */
export function formatMoney(amount: number, currency: string, locale: string): string {
  const digits = ZERO_DECIMAL.has(currency) ? 0 : 2
  const intlLocale = locale === 'en' ? 'en-US' : locale === 'pt-BR' ? 'pt-BR' : 'es-CL'
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount)}`
  }
}
