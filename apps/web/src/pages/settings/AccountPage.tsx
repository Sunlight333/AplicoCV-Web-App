import { useState, type FormEvent } from 'react'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/auth/AuthContext'
import { setPassword } from '@/services/auth'
import { ApiError } from '@/lib/apiClient'

export default function AccountPage() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const hasPassword = user?.hasPassword ?? false

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (next.length < 8) return setError('New password must be at least 8 characters')
    if (!/[0-9]/.test(next)) return setError('Include at least one number')
    if (next !== confirm) return setError('Passwords do not match')

    setSaving(true)
    try {
      const updated = await setPassword(hasPassword ? current : null, next)
      setUser(updated)
      toast(hasPassword ? 'Password updated' : 'Password set — you can now sign in with email')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update your password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-navy-900">Account &amp; security</h1>
        <p className="mt-1 text-sm text-navy-500">Manage how you sign in to AplicoCV.</p>

        <Card className="mt-6 p-7">
          <h2 className="text-lg font-semibold text-navy-900">
            {hasPassword ? 'Change password' : 'Set a password'}
          </h2>
          <p className="mt-1 text-sm text-navy-500">
            {hasPassword
              ? 'Enter your current password and choose a new one.'
              : 'You signed in with Google, so your account has no password yet. Set one to also sign in with your email and to use password reset.'}
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
            {hasPassword && (
              <Input
                id="current-password"
                type="password"
                label="Current password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            )}
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
            <Button type="submit" loading={saving} className="rounded-full">
              {hasPassword ? 'Update password' : 'Set password'}
            </Button>
          </form>
        </Card>
      </div>
    </PageTransition>
  )
}
