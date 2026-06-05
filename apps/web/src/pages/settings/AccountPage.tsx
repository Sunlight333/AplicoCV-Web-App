import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/auth/AuthContext'
import { setPassword, updateName, deleteAccount } from '@/services/auth'
import { ApiError } from '@/lib/apiClient'

interface AccountCopy {
  title: string; subtitle: string
  profile: string; profileSub: string; displayName: string; email: string; saveName: string
  nameUpdated: string; nameError: string
  changePw: string; setPw: string; changePwSub: string; setPwSub: string
  currentPw: string; newPw: string; newPwPh: string; confirmPw: string; updatePw: string; setPwBtn: string
  pwTooShort: string; pwNeedNumber: string; pwMismatch: string; pwError: string; pwUpdated: string; pwSet: string
  deleteTitle: string; deleteSub: string; deleteBtn: string; deleteError: string
  confirmTitle: string; confirmSub: string; cancel: string; confirmBtn: string
}

const COPY: Record<Locale, AccountCopy> = {
  en: {
    title: 'Account & security', subtitle: 'Manage your profile, sign-in and account.',
    profile: 'Profile', profileSub: 'Your display name and account email.', displayName: 'Display name', email: 'Email', saveName: 'Save name',
    nameUpdated: 'Name updated', nameError: 'Could not update your name',
    changePw: 'Change password', setPw: 'Set a password',
    changePwSub: 'Enter your current password and choose a new one.',
    setPwSub: 'You signed in with Google, so your account has no password yet. Set one to also sign in with your email and to use password reset.',
    currentPw: 'Current password', newPw: 'New password', newPwPh: 'At least 8 characters, one number', confirmPw: 'Confirm new password',
    updatePw: 'Update password', setPwBtn: 'Set password',
    pwTooShort: 'New password must be at least 8 characters', pwNeedNumber: 'Include at least one number',
    pwMismatch: 'Passwords do not match', pwError: 'Could not update your password',
    pwUpdated: 'Password updated', pwSet: 'Password set — you can now sign in with email',
    deleteTitle: 'Delete account', deleteSub: 'Permanently delete your account, profile, documents and all data. This can’t be undone.',
    deleteBtn: 'Delete my account', deleteError: 'Could not delete your account',
    confirmTitle: 'Delete your account?', confirmSub: 'This permanently removes your profile, CV, applications, documents and credits. There is no undo.',
    cancel: 'Cancel', confirmBtn: 'Yes, delete everything',
  },
  es: {
    title: 'Cuenta y seguridad', subtitle: 'Gestiona tu perfil, inicio de sesión y cuenta.',
    profile: 'Perfil', profileSub: 'Tu nombre visible y el correo de la cuenta.', displayName: 'Nombre visible', email: 'Correo electrónico', saveName: 'Guardar nombre',
    nameUpdated: 'Nombre actualizado', nameError: 'No se pudo actualizar tu nombre',
    changePw: 'Cambiar contraseña', setPw: 'Establecer una contraseña',
    changePwSub: 'Ingresa tu contraseña actual y elige una nueva.',
    setPwSub: 'Iniciaste sesión con Google, así que tu cuenta aún no tiene contraseña. Establece una para iniciar sesión también con tu correo y poder restablecerla.',
    currentPw: 'Contraseña actual', newPw: 'Nueva contraseña', newPwPh: 'Al menos 8 caracteres, un número', confirmPw: 'Confirmar nueva contraseña',
    updatePw: 'Actualizar contraseña', setPwBtn: 'Establecer contraseña',
    pwTooShort: 'La nueva contraseña debe tener al menos 8 caracteres', pwNeedNumber: 'Incluye al menos un número',
    pwMismatch: 'Las contraseñas no coinciden', pwError: 'No se pudo actualizar tu contraseña',
    pwUpdated: 'Contraseña actualizada', pwSet: 'Contraseña establecida — ahora puedes iniciar sesión con tu correo',
    deleteTitle: 'Eliminar cuenta', deleteSub: 'Elimina permanentemente tu cuenta, perfil, documentos y todos los datos. No se puede deshacer.',
    deleteBtn: 'Eliminar mi cuenta', deleteError: 'No se pudo eliminar tu cuenta',
    confirmTitle: '¿Eliminar tu cuenta?', confirmSub: 'Esto elimina permanentemente tu perfil, CV, postulaciones, documentos y créditos. No hay forma de deshacerlo.',
    cancel: 'Cancelar', confirmBtn: 'Sí, eliminar todo',
  },
  'pt-BR': {
    title: 'Conta e segurança', subtitle: 'Gerencie seu perfil, login e conta.',
    profile: 'Perfil', profileSub: 'Seu nome de exibição e o e-mail da conta.', displayName: 'Nome de exibição', email: 'E-mail', saveName: 'Salvar nome',
    nameUpdated: 'Nome atualizado', nameError: 'Não foi possível atualizar seu nome',
    changePw: 'Alterar senha', setPw: 'Definir uma senha',
    changePwSub: 'Digite sua senha atual e escolha uma nova.',
    setPwSub: 'Você entrou com o Google, então sua conta ainda não tem senha. Defina uma para entrar também com seu e-mail e poder redefini-la.',
    currentPw: 'Senha atual', newPw: 'Nova senha', newPwPh: 'Pelo menos 8 caracteres, um número', confirmPw: 'Confirmar nova senha',
    updatePw: 'Atualizar senha', setPwBtn: 'Definir senha',
    pwTooShort: 'A nova senha deve ter pelo menos 8 caracteres', pwNeedNumber: 'Inclua pelo menos um número',
    pwMismatch: 'As senhas não coincidem', pwError: 'Não foi possível atualizar sua senha',
    pwUpdated: 'Senha atualizada', pwSet: 'Senha definida — agora você pode entrar com seu e-mail',
    deleteTitle: 'Excluir conta', deleteSub: 'Exclua permanentemente sua conta, perfil, documentos e todos os dados. Isso não pode ser desfeito.',
    deleteBtn: 'Excluir minha conta', deleteError: 'Não foi possível excluir sua conta',
    confirmTitle: 'Excluir sua conta?', confirmSub: 'Isso remove permanentemente seu perfil, currículo, candidaturas, documentos e créditos. Não há como desfazer.',
    cancel: 'Cancelar', confirmBtn: 'Sim, excluir tudo',
  },
}

export default function AccountPage() {
  const { user, setUser, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const c = useCopy(COPY)
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
      toast(c.nameUpdated)
    } catch {
      toast(c.nameError, 'error')
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
      toast(c.deleteError, 'error')
      setDeleting(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (next.length < 8) return setError(c.pwTooShort)
    if (!/[0-9]/.test(next)) return setError(c.pwNeedNumber)
    if (next !== confirm) return setError(c.pwMismatch)

    setSaving(true)
    try {
      const updated = await setPassword(hasPassword ? current : null, next)
      setUser(updated)
      toast(hasPassword ? c.pwUpdated : c.pwSet)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : c.pwError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-navy-900">{c.title}</h1>
        <p className="mt-1 text-sm text-navy-500">{c.subtitle}</p>

        <Card className="mt-6 p-7">
          <h2 className="text-lg font-semibold text-navy-900">{c.profile}</h2>
          <p className="mt-1 text-sm text-navy-500">{c.profileSub}</p>
          <div className="mt-5 space-y-4">
            <Input label={c.displayName} value={name} onChange={(e) => setName(e.target.value)} />
            <Input label={c.email} value={user?.email ?? ''} disabled readOnly />
            <Button className="rounded-full" loading={savingName} disabled={!name.trim() || name.trim() === user?.fullName} onClick={saveName}>
              {c.saveName}
            </Button>
          </div>
        </Card>

        <Card className="mt-6 p-7">
          <h2 className="text-lg font-semibold text-navy-900">{hasPassword ? c.changePw : c.setPw}</h2>
          <p className="mt-1 text-sm text-navy-500">{hasPassword ? c.changePwSub : c.setPwSub}</p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
            {hasPassword && (
              <Input id="current-password" type="password" label={c.currentPw} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            )}
            <Input id="new-password" type="password" label={c.newPw} placeholder={c.newPwPh} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            <Input id="confirm-password" type="password" label={c.confirmPw} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <Button type="submit" loading={saving} className="rounded-full">{hasPassword ? c.updatePw : c.setPwBtn}</Button>
          </form>
        </Card>

        <Card className="mt-6 border-red-100 p-7">
          <h2 className="text-lg font-semibold text-red-600">{c.deleteTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{c.deleteSub}</p>
          <Button variant="danger" className="mt-5 rounded-full" onClick={() => setConfirmDelete(true)}>{c.deleteBtn}</Button>
        </Card>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <div className="rounded-2xl bg-white p-7 shadow-elev-4">
          <h2 className="text-lg font-semibold text-navy-900">{c.confirmTitle}</h2>
          <p className="mt-2 text-sm text-navy-500">{c.confirmSub}</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" className="rounded-full" onClick={() => setConfirmDelete(false)}>{c.cancel}</Button>
            <Button variant="danger" className="rounded-full" loading={deleting} onClick={doDelete}>{c.confirmBtn}</Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  )
}
