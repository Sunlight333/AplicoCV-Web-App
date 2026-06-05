import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthShell } from './AuthShell'
import { GoogleButton } from './GoogleButton'
import { loginSchema, type LoginForm } from './authSchemas'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/Toast'
import { ApiError } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { useT } from '@/i18n/I18nProvider'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const t = useT()
  const tl = t.auth.login
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), mode: 'onBlur' })

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null)
    try {
      const user = await login(data.email, data.password)
      toast(tl.welcomeBack(user.fullName.split(' ')[0]))
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? (user.onboarded ? '/dashboard' : '/onboarding'), { replace: true })
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : tl.error)
    }
  })

  return (
    <AuthShell title={tl.title} subtitle={tl.subtitle} bgImage="/backgrounds/auth-login-bg.png">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          id="email"
          type="email"
          label={tl.email}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="password"
          type="password"
          label={tl.password}
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-electric-600 hover:underline">
            {tl.forgotPassword}
          </Link>
        </div>
        {submitError && <p className="text-sm font-medium text-red-600">{submitError}</p>}
        <Button type="submit" className="w-full" loading={isSubmitting}>
          {tl.submit}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-medium text-navy-300">
        <span className="h-px flex-1 bg-navy-200" /> {tl.or} <span className="h-px flex-1 bg-navy-200" />
      </div>
      <GoogleButton label={tl.google} />

      <p className="mt-6 text-center text-sm text-navy-500">
        {tl.noAccount}{' '}
        <Link to="/register" className="font-semibold text-electric-600 hover:underline">
          {tl.createAccount}
        </Link>
      </p>
      {env.useMocks && (
        <p className="mt-2 text-center text-xs text-navy-300">{tl.demoNote}</p>
      )}
    </AuthShell>
  )
}
