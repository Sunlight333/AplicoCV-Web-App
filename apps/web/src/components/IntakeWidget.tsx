import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AtsRing } from '@/components/AtsRing'
import { Button } from '@/components/ui/Button'
import { getTeaser, type Teaser } from '@/services/public'
import { currentLocale } from '@/lib/locale'

// The AIApply-style "carrot": the first thing a visitor does. Paste a CV, get an
// instant ATS score + real matching-role count, then a single CTA to subscribe.
const COPY = {
  en: {
    label: 'Paste your CV to see your instant ATS score',
    placeholder: 'Paste your CV text here…',
    role: 'Target role (optional)',
    rolePh: 'e.g. Commercial Manager',
    analyze: 'Analyze my CV — free',
    analyzing: 'Analyzing…',
    scoreLabel: 'ATS readiness',
    matches: (n: number) => `We found ${n}+ matching roles for you`,
    matchesGeneric: 'Matching roles across LinkedIn, Indeed and more',
    quickWins: 'Quick wins',
    cta: 'Create my account →',
    disclaimer: 'Instant preview. Subscribe to tailor your CV to each job and apply.',
    wins: {
      quantify: 'Add measurable achievements (numbers, %, $)',
      add_linkedin: 'Add your LinkedIn URL',
      more_detail: 'Add more detail to your experience',
      add_contact: 'Complete your contact details',
      tailor: 'Tailor your CV to each job’s keywords',
    } as Record<string, string>,
  },
  es: {
    label: 'Pega tu CV y mira tu puntaje ATS al instante',
    placeholder: 'Pega el texto de tu CV aquí…',
    role: 'Puesto objetivo (opcional)',
    rolePh: 'ej. Gerente Comercial',
    analyze: 'Analizar mi CV — gratis',
    analyzing: 'Analizando…',
    scoreLabel: 'Preparación ATS',
    matches: (n: number) => `Encontramos ${n}+ puestos compatibles para ti`,
    matchesGeneric: 'Puestos compatibles en LinkedIn, Indeed y más',
    quickWins: 'Mejoras rápidas',
    cta: 'Crear mi cuenta →',
    disclaimer: 'Vista previa instantánea. Suscríbete para adaptar tu CV a cada puesto y postular.',
    wins: {
      quantify: 'Agrega logros medibles (números, %, $)',
      add_linkedin: 'Agrega tu URL de LinkedIn',
      more_detail: 'Agrega más detalle a tu experiencia',
      add_contact: 'Completa tus datos de contacto',
      tailor: 'Adapta tu CV a las palabras clave de cada puesto',
    } as Record<string, string>,
  },
  'pt-BR': {
    label: 'Cole seu currículo e veja seu score ATS na hora',
    placeholder: 'Cole o texto do seu currículo aqui…',
    role: 'Cargo desejado (opcional)',
    rolePh: 'ex. Gerente Comercial',
    analyze: 'Analisar meu currículo — grátis',
    analyzing: 'Analisando…',
    scoreLabel: 'Prontidão ATS',
    matches: (n: number) => `Encontramos ${n}+ vagas compatíveis para você`,
    matchesGeneric: 'Vagas compatíveis no LinkedIn, Indeed e mais',
    quickWins: 'Melhorias rápidas',
    cta: 'Criar minha conta →',
    disclaimer: 'Prévia instantânea. Assine para adaptar seu currículo a cada vaga e se candidatar.',
    wins: {
      quantify: 'Adicione conquistas mensuráveis (números, %, $)',
      add_linkedin: 'Adicione a URL do seu LinkedIn',
      more_detail: 'Detalhe melhor sua experiência',
      add_contact: 'Complete seus dados de contato',
      tailor: 'Adapte seu currículo às palavras‑chave de cada vaga',
    } as Record<string, string>,
  },
} as const

export function IntakeWidget() {
  const c = COPY[(currentLocale() as keyof typeof COPY)] ?? COPY.en
  const [cv, setCv] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Teaser | null>(null)

  const analyze = async () => {
    if (!cv.trim() && !role.trim()) return
    setLoading(true)
    try {
      setResult(await getTeaser(cv, role))
    } catch {
      /* keep the form; a failed teaser shouldn't block the CTA below */
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-navy-100 bg-white/90 p-6 shadow-elev-2 backdrop-blur">
      {!result ? (
        <>
          <label className="text-sm font-semibold text-navy-900">{c.label}</label>
          <textarea
            rows={5}
            value={cv}
            onChange={(e) => setCv(e.target.value)}
            placeholder={c.placeholder}
            className="mt-2 w-full resize-none rounded-xl border border-navy-200 bg-navy-50/50 p-3 text-sm outline-none placeholder:text-navy-300 focus:border-electric-400 focus:bg-white focus:ring-2 focus:ring-electric-400/30"
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={c.rolePh}
            aria-label={c.role}
            className="mt-3 w-full rounded-xl border border-navy-200 bg-navy-50/50 px-3 py-2.5 text-sm outline-none placeholder:text-navy-300 focus:border-electric-400 focus:bg-white focus:ring-2 focus:ring-electric-400/30"
          />
          <Button className="mt-4 w-full rounded-full" loading={loading} disabled={!cv.trim() && !role.trim()} onClick={analyze}>
            {loading ? c.analyzing : c.analyze}
          </Button>
        </>
      ) : (
        <div>
          <div className="flex items-center gap-5">
            <AtsRing score={result.atsScore} size={104} stroke={10} />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-navy-400">{c.scoreLabel}</p>
              <p className="text-3xl font-extrabold text-navy-900">{result.atsScore}<span className="text-lg text-navy-300">/100</span></p>
              <p className="mt-1 text-sm font-medium text-electric-600">
                {result.matchCount > 0 ? c.matches(result.matchCount) : c.matchesGeneric}
              </p>
            </div>
          </div>

          {result.wins.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{c.quickWins}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-navy-600">
                {result.wins.map((w) => (
                  <li key={w} className="flex gap-2"><span className="text-amber-500">→</span>{c.wins[w] ?? w}</li>
                ))}
              </ul>
            </div>
          )}

          <Link to="/register" className="mt-6 block">
            <Button className="w-full rounded-full">{c.cta}</Button>
          </Link>
          <p className="mt-2 text-center text-xs text-navy-400">{c.disclaimer}</p>
        </div>
      )}
    </div>
  )
}
