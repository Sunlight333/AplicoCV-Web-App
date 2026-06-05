import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { AuthShell } from './AuthShell'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/auth/AuthContext'
import { resetPassword } from '@/services/auth'
import { ApiError } from '@/lib/apiClient'

interface ResetCopy {
  title: string; subtitle: string; missingLink: string; requestNew: string
  newPw: string; newPwPh: string; confirmPw: string; reset: string; backToSignIn: string
  errShort: string; errNumber: string; errMismatch: string; errGeneric: string
}

const COPY: Record<Locale, ResetCopy> = {
  en: {
    title: 'Choose a new password', subtitle: 'Set a new password for your account.',
    missingLink: 'This reset link is missing or broken. Request a new one to continue.', requestNew: 'Request a new link',
    newPw: 'New password', newPwPh: 'At least 8 characters, one number', confirmPw: 'Confirm new password', reset: 'Reset password', backToSignIn: 'Back to sign in',
    errShort: 'Password must be at least 8 characters', errNumber: 'Include at least one number', errMismatch: 'Passwords do not match', errGeneric: 'Could not reset your password',
  },
  es: {
    title: 'Elige una nueva contraseña', subtitle: 'Establece una nueva contraseña para tu cuenta.',
    missingLink: 'Este enlace de restablecimiento falta o está dañado. Solicita uno nuevo para continuar.', requestNew: 'Solicitar un nuevo enlace',
    newPw: 'Nueva contraseña', newPwPh: 'Al menos 8 caracteres, un número', confirmPw: 'Confirmar nueva contraseña', reset: 'Restablecer contraseña', backToSignIn: 'Volver a iniciar sesión',
    errShort: 'La contraseña debe tener al menos 8 caracteres', errNumber: 'Incluye al menos un número', errMismatch: 'Las contraseñas no coinciden', errGeneric: 'No se pudo restablecer tu contraseña',
  },
  'pt-BR': {
    title: 'Escolha uma nova senha', subtitle: 'Defina uma nova senha para sua conta.',
    missingLink: 'Este link de redefinição está ausente ou inválido. Solicite um novo para continuar.', requestNew: 'Solicitar um novo link',
    newPw: 'Nova senha', newPwPh: 'Pelo menos 8 caracteres, um número', confirmPw: 'Confirmar nova senha', reset: 'Redefinir senha', backToSignIn: 'Voltar para entrar',
    errShort: 'A senha deve ter pelo menos 8 caracteres', errNumber: 'Inclua pelo menos um número', errMismatch: 'As senhas não coincidem', errGeneric: 'Não foi possível redefinir sua senha',
  },
}

export default function ResetPasswordPage() {
  const c = useCopy(COPY)
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (next.length < 8) return setError(c.errShort)
    if (!/[0-9]/.test(next)) return setError(c.errNumber)
    if (next !== confirm) return setError(c.errMismatch)

    setSubmitting(true)
    try {
      const user = await resetPassword(token, next)
      setUser(user)
      navigate(user.onboarded ? '/dashboard' : '/onboarding', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : c.errGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title={c.title} subtitle={c.subtitle} bgImage="/backgrounds/auth-login-bg.png">
      {!token ? (
        <div className="space-y-5">
          <p className="text-sm text-red-600">{c.missingLink}</p>
          <Link to="/forgot-password">
            <Button variant="secondary" className="w-full rounded-full">{c.requestNew}</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input id="new-password" type="password" label={c.newPw} placeholder={c.newPwPh} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          <Input id="confirm-password" type="password" label={c.confirmPw} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <Button type="submit" className="w-full rounded-full" loading={submitting}>{c.reset}</Button>
          <p className="text-center text-sm text-navy-500">
            <Link to="/login" className="font-semibold text-electric-600 hover:underline">{c.backToSignIn}</Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
