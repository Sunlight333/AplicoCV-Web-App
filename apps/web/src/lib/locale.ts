// The active UI locale, read from where I18nProvider persists it. Plain service
// functions (outside React) use this to tell the backend which language the AI
// should answer in, so AI output matches the language the user is viewing.
const STORAGE_KEY = 'aplicocv.locale'

export function currentLocale(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || document.documentElement.lang || 'en'
  } catch {
    return 'en'
  }
}
