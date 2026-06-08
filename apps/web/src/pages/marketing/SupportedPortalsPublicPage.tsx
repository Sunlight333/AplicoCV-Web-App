import { Link } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useCopy } from './useCopy'

const FULL = [
  'LinkedIn', 'Workday', 'Indeed', 'Glassdoor', 'Greenhouse', 'Lever',
  'Get on Board', 'Computrabajo', 'Bumeran', 'Zonajobs', 'Laborum', 'Elempleo',
  'Trabajando.com', 'InfoJobs', 'RemoteOK', 'We Work Remotely',
]

interface PortalsCopy {
  eyebrow: string; title: string; subtitle: string
  full: string; count: string; fallback: string; fallbackBody: string; cta: string
}

const COPY: Record<Locale, PortalsCopy> = {
  en: {
    eyebrow: 'Supported portals', title: 'Autofill works where you apply',
    subtitle: 'Built-in support for the major job portals — plus a smart fallback that fills standard fields everywhere else.',
    full: 'Full support', count: `${FULL.length} portals`, fallback: 'Smart fallback',
    fallbackBody: 'On any site not listed above, AplicoCV detects standard form fields — name, email, phone, experience, work authorization and more — and fills them automatically, so you’re covered on company career pages and niche boards too.',
    cta: 'Try it on your next application',
  },
  es: {
    eyebrow: 'Portales compatibles', title: 'El autocompletado funciona donde postulas',
    subtitle: 'Soporte integrado para los principales portales de empleo — y un respaldo inteligente que completa los campos estándar en el resto.',
    full: 'Soporte completo', count: `${FULL.length} portales`, fallback: 'Respaldo inteligente',
    fallbackBody: 'En cualquier sitio no listado arriba, AplicoCV detecta los campos estándar — nombre, correo, teléfono, experiencia, autorización de trabajo y más — y los completa automáticamente, para que también estés cubierto en páginas de empleo de empresas y portales de nicho.',
    cta: 'Pruébalo en tu próxima postulación',
  },
  'pt-BR': {
    eyebrow: 'Portais compatíveis', title: 'O preenchimento funciona onde você se candidata',
    subtitle: 'Suporte integrado aos principais portais de emprego — e um recurso inteligente que preenche campos padrão em todos os outros.',
    full: 'Suporte completo', count: `${FULL.length} portais`, fallback: 'Recurso inteligente',
    fallbackBody: 'Em qualquer site não listado acima, a AplicoCV detecta os campos padrão — nome, e-mail, telefone, experiência, autorização de trabalho e mais — e os preenche automaticamente, então você também fica coberto em páginas de carreira de empresas e portais de nicho.',
    cta: 'Teste na sua próxima candidatura',
  },
}

export default function SupportedPortalsPublicPage() {
  const c = useCopy(COPY)
  return (
    <MarketingShell heroImage="/pages/portals-network.png" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} max="max-w-5xl">
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Badge tone="success">{c.full}</Badge>
          <span className="text-sm text-navy-400">{c.count}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {FULL.map((p) => (
            <div key={p} className="flex items-center gap-2.5 rounded-xl border border-navy-100 bg-white px-4 py-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white">
                {p[0]}
              </span>
              <span className="truncate text-sm font-medium text-navy-800">{p}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 flex items-start gap-3 p-6">
        <Badge tone="info">{c.fallback}</Badge>
        <p className="text-sm text-navy-600">{c.fallbackBody}</p>
      </Card>

      <div className="mt-10 text-center">
        <Link to="/register">
          <Button size="lg" className="rounded-full">{c.cta}</Button>
        </Link>
      </div>
    </MarketingShell>
  )
}
