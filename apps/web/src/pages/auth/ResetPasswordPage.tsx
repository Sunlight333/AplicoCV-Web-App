import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthShell } from './AuthShell'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/auth/AuthContext'
import { resetPassword } from '@/services/auth'
import { ApiError } from '@/lib/apiClient'

export default function ResetPasswordPage() {
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
    if (next.length < 8) return setError('Password must be at least 8 characters')
    if (!/[0-9]/.test(next)) return setError('Include at least one number')
    if (next !== confirm) return setError('Passwords do not match')

    setSubmitting(true)
    try {
      const user = await resetPassword(token, next)
      setUser(user)
      navigate(user.onboarded ? '/dashboard' : '/onboarding', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset your password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Set a new password for your account."
      bgImage="/backgrounds/auth-login-bg.png"
    >
      {!token ? (
        <div className="space-y-5">
          <p className="text-sm text-red-600">
            This reset link is missing or broken. Request a new one to continue.
          </p>
          <Link to="/forgot-password">
            <Button variant="secondary" className="w-full rounded-full">
              Request a new link
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input
            id="new-password"
            type="password"
            label="New password"
            placeholder="At least 8 characters, one number"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <Input
            id="confirm-password"
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <Button type="submit" className="w-full rounded-full" loading={submitting}>
            Reset password
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
