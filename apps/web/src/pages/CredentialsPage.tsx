import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/Toast'
import {
  listCredentials,
  saveCredential,
  deleteCredential,
  type SaveCredentialInput,
} from '@/services/credentials'
import type { PortalCredential } from '@/types'
import { useT } from '@/i18n/I18nProvider'

const PORTALS = [
  'LinkedIn', 'Workday', 'Indeed', 'Get on Board', 'Computrabajo', 'Glassdoor',
  'Zonajobs', 'Bumeran', 'Laborum', 'Konzerta',
]

const syncTone: Record<PortalCredential['syncStatus'], 'success' | 'warning' | 'danger'> = {
  verified: 'success',
  unverified: 'warning',
  invalid: 'danger',
}

export default function CredentialsPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const t = useT()
  const tc = t.app.credentials
  const [form, setForm] = useState<SaveCredentialInput>({ portal: PORTALS[0], email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['credentials'], queryFn: listCredentials })

  const saveMutation = useMutation({
    mutationFn: saveCredential,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credentials'] })
      toast(tc.saved)
      setForm({ portal: PORTALS[0], email: '', password: '' })
    },
    onError: () => toast(tc.saveError, 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCredential,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credentials'] })
      toast(tc.removed)
    },
  })

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{tc.title}</h1>
      <p className="mt-1 max-w-2xl text-navy-500">{tc.intro}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Add / update form */}
        <Card className="p-6">
          <h2 className="font-semibold text-navy-900">{tc.addTitle}</h2>
          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-navy-700">{tc.portal}</label>
              <select
                value={form.portal}
                onChange={(e) => setForm((f) => ({ ...f, portal: e.target.value }))}
                className="h-11 rounded-lg border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-400"
              >
                {PORTALS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <Input
              label={tc.email}
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <div className="relative">
              <Input
                label={tc.password}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-9 text-xs font-medium text-electric-600"
              >
                {showPassword ? tc.hide : tc.show}
              </button>
            </div>
            <Button
              className="w-full"
              loading={saveMutation.isPending}
              disabled={!form.email || !form.password}
              onClick={() => saveMutation.mutate(form)}
            >
              {tc.save}
            </Button>
          </div>
        </Card>

        {/* List */}
        <Card className="p-6">
          <h2 className="font-semibold text-navy-900">{tc.savedTitle}</h2>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : data && data.length ? (
              data.map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-center justify-between rounded-lg border border-navy-100 p-3"
                >
                  <div>
                    <p className="font-medium text-navy-900">{cred.portal}</p>
                    <p className="text-sm text-navy-400">{cred.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={syncTone[cred.syncStatus]}>
                      {tc.sync[cred.syncStatus]}
                    </Badge>
                    <button
                      onClick={() => deleteMutation.mutate(cred.id)}
                      className="text-navy-300 hover:text-red-600"
                      aria-label={`${tc.removed} — ${cred.portal}`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-navy-400">{tc.none}</p>
            )}
          </div>
        </Card>
      </div>
    </PageTransition>
  )
}
