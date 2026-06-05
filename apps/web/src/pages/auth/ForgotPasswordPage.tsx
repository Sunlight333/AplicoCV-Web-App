import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { AuthShell } from './AuthShell'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { forgotPassword } from '@/services/auth'

interface ForgotCopy {
  title: string; subtitle: string
  sentBefore: string; sentAfter: string
  backToSignIn: string; email: string; emailPh: string; send: string
}

const COPY: Record<Locale, ForgotCopy> = {
  en: {
    title: 'Reset your password', subtitle: 'We’ll email you a link to choose a new one.',
    sentBefore: 'If an account exists for ', sentAfter: ', a reset link is on its way. Check your inbox — and your spam folder just in case. The link expires in 30 minutes.',
    backToSignIn: 'Back to sign in', email: 'Email', emailPh: 'you@example.com', send: 'Send reset link',
  },
  es: {
    title: 'Restablece tu contraseña', subtitle: 'Te enviaremos un enlace por correo para elegir una nueva.',
    sentBefore: 'Si existe una cuenta para ', sentAfter: ', el enlace de restablecimiento va en camino. Revisa tu bandeja de entrada — y la carpeta de spam por si acaso. El enlace caduca en 30 minutos.',
    backToSignIn: 'Volver a iniciar sesión', email: 'Correo electrónico', emailPh: 'tu@ejemplo.com', send: 'Enviar enlace',
  },
  'pt-BR': {
    title: 'Redefina sua senha', subtitle: 'Enviaremos um link por e-mail para escolher uma nova.',
    sentBefore: 'Se existir uma conta para ', sentAfter: ', o link de redefinição está a caminho. Verifique sua caixa de entrada — e a pasta de spam, por via das dúvidas. O link expira em 30 minutos.',
    backToSignIn: 'Voltar para entrar', email: 'E-mail', emailPh: 'voce@exemplo.com', send: 'Enviar link',
  },
}

export default function ForgotPasswordPage() {
  const c = useCopy(COPY)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await forgotPassword(email)
    } finally {
      setSubmitting(false)
      setSent(true)
    }
  }

  return (
    <AuthShell title={c.title} subtitle={c.subtitle} bgImage="/backgrounds/auth-login-bg.png">
      {sent ? (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-navy-600">
            {c.sentBefore}<strong>{email}</strong>{c.sentAfter}
          </p>
          <Link to="/login">
            <Button variant="secondary" className="w-full rounded-full">{c.backToSignIn}</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input id="email" type="email" label={c.email} placeholder={c.emailPh} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" className="w-full rounded-full" loading={submitting}>{c.send}</Button>
          <p className="text-center text-sm text-navy-500">
            <Link to="/login" className="font-semibold text-electric-600 hover:underline">{c.backToSignIn}</Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
