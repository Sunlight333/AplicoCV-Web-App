import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/auth/AuthContext'
import { setPassword, updateName, deleteAccount } from '@/services/auth'
import { ApiError } from '@/lib/apiClient'

export default function AccountPage() {
  const { user, setUser, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const hasPassword = user?.hasPassword ?? false

  const [name, setName] = useState(user?.fullName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const saveName = async () => {
    if (!name.trim() || name.trim() === user?.fullName) return
    setSavingName(true)
    try {
      const updated = await updateName(name.trim())
      setUser(updated)
      toast('Name updated')
    } catch {
      toast('Could not update your name', 'error')
    } finally {
      setSavingName(false)
    }
  }

  const doDelete = async () => {
    setDeleting(true)
    try {
      await deleteAccount()
      await logout()
      navigate('/', { replace: true })
    } catch {
      toast('Could not delete your account', 'error')
      setDeleting(false)
    }
  }

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
        <p className="mt-1 text-sm text-navy-500">Manage your profile, sign-in and account.</p>

        <Card className="mt-6 p-7">
          <h2 className="text-lg font-semibold text-navy-900">Profile</h2>
          <p className="mt-1 text-sm text-navy-500">Your display name and account email.</p>
          <div className="mt-5 space-y-4">
            <Input
              label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input label="Email" value={user?.email ?? ''} disabled readOnly />
            <Button
              className="rounded-full"
              loading={savingName}
              disabled={!name.trim() || name.trim() === user?.fullName}
              onClick={saveName}
            >
              Save name
            </Button>
          </div>
        </Card>

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

        <Card className="mt-6 border-red-100 p-7">
          <h2 className="text-lg font-semibold text-red-600">Delete account</h2>
          <p className="mt-1 text-sm text-navy-500">
            Permanently delete your account, profile, documents and all data. This can’t be undone.
          </p>
          <Button variant="danger" className="mt-5 rounded-full" onClick={() => setConfirmDelete(true)}>
            Delete my account
          </Button>
        </Card>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <div className="rounded-2xl bg-white p-7 shadow-card-hover">
          <h2 className="text-lg font-semibold text-navy-900">Delete your account?</h2>
          <p className="mt-2 text-sm text-navy-500">
            This permanently removes your profile, CV, applications, documents and credits. There is
            no undo.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" className="rounded-full" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="rounded-full" loading={deleting} onClick={doDelete}>
              Yes, delete everything
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  )
}
