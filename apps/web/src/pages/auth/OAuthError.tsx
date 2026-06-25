import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '@/i18n/I18nProvider'
import type { Locale } from '@/i18n/dictionaries'

// Friendly copy for the `?error=` codes the backend redirects to after a failed
// Google OAuth attempt (see apps/api/app/routers/auth.py `_login_error`). Without
// this the Google button silently bounced back to /login with no explanation.
const MESSAGES: Record<Locale, Record<string, string>> = {
  en: {
    oauth_disabled: 'Google sign-in isn’t available right now. Use your email and password instead.',
    oauth_state: 'Your Google sign-in session expired. Please try again.',
    oauth_token: 'We couldn’t complete Google sign-in. Please try again.',
    oauth_userinfo: 'We couldn’t read your Google profile. Please try again.',
    oauth_email: 'Your Google account didn’t share an email address, so we can’t sign you in that way.',
    _default: 'Sign-in with Google failed. Please try again or use your email.',
  },
  es: {
    oauth_disabled: 'El inicio con Google no está disponible ahora. Usa tu correo y contraseña.',
    oauth_state: 'Tu sesión de Google expiró. Inténtalo de nuevo.',
    oauth_token: 'No pudimos completar el inicio con Google. Inténtalo de nuevo.',
    oauth_userinfo: 'No pudimos leer tu perfil de Google. Inténtalo de nuevo.',
    oauth_email: 'Tu cuenta de Google no compartió un correo, así que no podemos iniciar sesión así.',
    _default: 'Falló el inicio con Google. Inténtalo de nuevo o usa tu correo.',
  },
  'pt-BR': {
    oauth_disabled: 'O login com Google não está disponível agora. Use seu e-mail e senha.',
    oauth_state: 'Sua sessão do Google expirou. Tente novamente.',
    oauth_token: 'Não foi possível concluir o login com Google. Tente novamente.',
    oauth_userinfo: 'Não foi possível ler seu perfil do Google. Tente novamente.',
    oauth_email: 'Sua conta do Google não compartilhou um e-mail, então não podemos entrar assim.',
    _default: 'O login com Google falhou. Tente novamente ou use seu e-mail.',
  },
}

/** Shows a localized banner when the URL carries an OAuth `?error=` code, then
 *  strips it from the URL so a refresh doesn't re-show it. */
export function OAuthError() {
  const { locale } = useI18n()
  const [params, setParams] = useSearchParams()
  const code = params.get('error')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return
    const dict = MESSAGES[locale] ?? MESSAGES.en
    setMessage(dict[code] ?? dict._default)
    const next = new URLSearchParams(params)
    next.delete('error')
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  if (!message) return null
  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      {message}
    </div>
  )
}
