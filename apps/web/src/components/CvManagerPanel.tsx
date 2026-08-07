import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import { currentLocale } from '@/lib/locale'
import {
  listSourceCvs,
  activateSourceCv,
  deleteSourceCv,
  uploadCv,
  parseCv,
  saveParsedProfile,
} from '@/services/documents'
import type { Profile } from '@/types'

// Client 24.07: "que le permita subir 2 o 3 CV diferentes, y … seleccionar con que CV
// vaya probando las funcionalidades de filtros ATS y demás funciones" — plus "que a la
// persona le salte una alarma por si cuando se subió el CV quedaron cosas incompletas".
// This panel does both: manage several source CVs (choose the active one) and warn when
// the parsed profile is missing the sections a CV needs.

const COPY = {
  en: {
    title: 'Your CVs',
    subtitle: 'Keep several CVs and choose which one every tool works from — ATS score, optimizer and job matching all use the active one.',
    add: 'Upload another CV',
    uploading: 'Uploading…',
    parsing: 'Reading your CV…',
    active: 'Active',
    use: 'Use this CV',
    switching: 'Switching…',
    remove: 'Remove',
    empty: 'No CV uploaded yet.',
    switched: 'Switched — your profile now comes from this CV.',
    added: 'CV uploaded and read.',
    failed: 'Could not process that file.',
    alarmTitle: 'Your CV imported, but some sections came out empty',
    alarmBody: 'These matter for job matching and for the CVs we generate. Add them below:',
    fix: 'Complete them now',
    mContact: 'Contact details', mExperience: 'Experience', mEducation: 'Education',
    mLanguages: 'Languages', mSkills: 'Skills', mSummary: 'Professional summary',
  },
  es: {
    title: 'Tus CVs',
    subtitle: 'Guardá varios CVs y elegí con cuál trabajan las herramientas — el puntaje ATS, el optimizador y las coincidencias usan el activo.',
    add: 'Subir otro CV',
    uploading: 'Subiendo…',
    parsing: 'Leyendo tu CV…',
    active: 'Activo',
    use: 'Usar este CV',
    switching: 'Cambiando…',
    remove: 'Eliminar',
    empty: 'Todavía no subiste ningún CV.',
    switched: 'Listo — tu perfil ahora se arma con este CV.',
    added: 'CV subido y leído.',
    failed: 'No se pudo procesar ese archivo.',
    alarmTitle: 'Tu CV se importó, pero algunas secciones quedaron vacías',
    alarmBody: 'Son importantes para las coincidencias y para los CV que generamos. Completalas abajo:',
    fix: 'Completar ahora',
    mContact: 'Datos de contacto', mExperience: 'Experiencia', mEducation: 'Educación',
    mLanguages: 'Idiomas', mSkills: 'Habilidades', mSummary: 'Resumen profesional',
  },
  'pt-BR': {
    title: 'Seus currículos',
    subtitle: 'Guarde vários currículos e escolha com qual as ferramentas trabalham — pontuação ATS, otimizador e vagas usam o ativo.',
    add: 'Enviar outro currículo',
    uploading: 'Enviando…',
    parsing: 'Lendo seu currículo…',
    active: 'Ativo',
    use: 'Usar este',
    switching: 'Trocando…',
    remove: 'Remover',
    empty: 'Nenhum currículo enviado ainda.',
    switched: 'Pronto — seu perfil agora vem deste currículo.',
    added: 'Currículo enviado e lido.',
    failed: 'Não foi possível processar esse arquivo.',
    alarmTitle: 'Seu currículo foi importado, mas algumas seções ficaram vazias',
    alarmBody: 'Elas importam para as combinações e para os currículos que geramos. Complete abaixo:',
    fix: 'Completar agora',
    mContact: 'Dados de contato', mExperience: 'Experiência', mEducation: 'Educação',
    mLanguages: 'Idiomas', mSkills: 'Habilidades', mSummary: 'Resumo profissional',
  },
} as const

/** Sections a usable CV needs — drives the "incomplete import" alarm. */
export function missingProfileSections(
  p: Profile | undefined,
  c: (typeof COPY)[keyof typeof COPY],
): string[] {
  if (!p) return []
  const out: string[] = []
  if (!p.personal?.email && !p.personal?.phone) out.push(c.mContact)
  if (!p.personal?.summary) out.push(c.mSummary)
  if (!p.experience?.length) out.push(c.mExperience)
  if (!p.education?.length) out.push(c.mEducation)
  if (!p.languages?.length) out.push(c.mLanguages)
  if (!p.skills?.length) out.push(c.mSkills)
  return out
}

export function CvManagerPanel({ profile }: { profile?: Profile }) {
  const c = COPY[(currentLocale() as keyof typeof COPY)] ?? COPY.en
  const qc = useQueryClient()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'' | 'uploading' | 'parsing'>('')

  const cvs = useQuery({ queryKey: ['source-cvs'], queryFn: listSourceCvs })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['source-cvs'] })
    qc.invalidateQueries({ queryKey: ['profile'] })
  }

  const activate = useMutation({
    mutationFn: activateSourceCv,
    onSuccess: () => { refresh(); toast(c.switched) },
    onError: () => toast(c.failed, 'error'),
  })

  const remove = useMutation({
    mutationFn: deleteSourceCv,
    onSuccess: refresh,
    onError: () => toast(c.failed, 'error'),
  })

  const onPick = async (file?: File) => {
    if (!file) return
    setBusy('uploading')
    try {
      const { documentId } = await uploadCv(file, () => {})
      setBusy('parsing')
      let parsed
      for await (const ev of parseCv(documentId)) if (ev.done && ev.profile) parsed = ev.profile
      if (parsed) await saveParsedProfile(parsed)
      refresh()
      toast(c.added)
    } catch {
      toast(c.failed, 'error')
    } finally {
      setBusy('')
    }
  }

  const missing = missingProfileSections(profile, c)

  return (
    <>
      {/* Incomplete-import alarm */}
      {profile && missing.length > 0 && (
        <Card className="mb-4 border-l-4 border-l-amber-400 p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none">⚠️</span>
            <div className="min-w-0">
              <p className="font-semibold text-navy-900">{c.alarmTitle}</p>
              <p className="mt-1 text-sm text-navy-500">{c.alarmBody}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {missing.map((m) => (
                  <Badge key={m} tone="warning">{m}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-navy-900">{c.title}</h2>
            <p className="mt-1 max-w-xl text-sm text-navy-500">{c.subtitle}</p>
          </div>
          <Button
            variant="secondary"
            className="rounded-full"
            loading={!!busy}
            disabled={!!busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy === 'uploading' ? c.uploading : busy === 'parsing' ? c.parsing : `+ ${c.add}`}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => { void onPick(e.target.files?.[0]); e.target.value = '' }}
          />
        </div>

        <div className="mt-4 divide-y divide-navy-100">
          {cvs.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : !cvs.data?.length ? (
            <p className="py-3 text-sm text-navy-400">{c.empty}</p>
          ) : (
            cvs.data.map((cv) => (
              <div key={cv.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="text-lg">📄</span>
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm', cv.active ? 'font-semibold text-navy-900' : 'text-navy-700')}>
                    {cv.filename}
                  </p>
                  <p className="text-xs text-navy-400">
                    {new Date(cv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {cv.active ? (
                  <Badge tone="success">{c.active}</Badge>
                ) : (
                  <button
                    onClick={() => activate.mutate(cv.id)}
                    disabled={activate.isPending}
                    className="text-sm font-medium text-electric-600 hover:underline disabled:opacity-60"
                  >
                    {activate.isPending && activate.variables === cv.id ? c.switching : c.use}
                  </button>
                )}
                {!cv.active && (
                  <button
                    onClick={() => remove.mutate(cv.id)}
                    disabled={remove.isPending}
                    className="text-sm font-medium text-navy-400 hover:text-red-500"
                  >
                    {c.remove}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  )
}
