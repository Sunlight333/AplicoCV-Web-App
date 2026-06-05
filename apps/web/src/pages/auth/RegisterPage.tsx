import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthShell } from './AuthShell'
import { GoogleButton } from './GoogleButton'
import { registerSchema, type RegisterForm } from './authSchemas'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/Toast'
import { ApiError } from '@/lib/apiClient'
import { useT } from '@/i18n/I18nProvider'

export default function RegisterPage() {
  const { register: signup } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const t = useT()
  const tr = t.auth.register
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), mode: 'onBlur' })

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null)
    try {
      await signup(data.fullName, data.email, data.password)
      toast(tr.created)
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : tr.error)
    }
  })

  return (
    <AuthShell title={tr.title} subtitle={tr.subtitle} bgImage="/backgrounds/auth-register-bg.png">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          id="fullName"
          label={tr.fullName}
          placeholder="Alex Morgan"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          id="email"
          type="email"
          label={tr.email}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="password"
          type="password"
          label={tr.password}
          placeholder={tr.passwordHint}
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          id="confirm"
          type="password"
          label={tr.confirm}
          placeholder={tr.confirmHint}
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        {submitError && <p className="text-sm font-medium text-red-600">{submitError}</p>}
        <Button type="submit" className="w-full" loading={isSubmitting}>
          {tr.submit}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-medium text-navy-300">
        <span className="h-px flex-1 bg-navy-200" /> {tr.or} <span className="h-px flex-1 bg-navy-200" />
      </div>
      <GoogleButton label={tr.google} />

      <p className="mt-6 text-center text-sm text-navy-500">
        {tr.haveAccount}{' '}
        <Link to="/login" className="font-semibold text-electric-600 hover:underline">
          {tr.signIn}
        </Link>
      </p>
    </AuthShell>
  )
}
