import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from './AuthShell'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { forgotPassword } from '@/services/auth'

export default function ForgotPasswordPage() {
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
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one."
      bgImage="/backgrounds/auth-login-bg.png"
    >
      {sent ? (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-navy-600">
            If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your
            inbox — and your spam folder just in case. The link expires in 30 minutes.
          </p>
          <Link to="/login">
            <Button variant="secondary" className="w-full rounded-full">
              Back to sign in
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full rounded-full" loading={submitting}>
            Send reset link
          </Button>
          <p className="text-center text-sm text-navy-500">
            <Link to="/login" className="font-semibold text-electric-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
