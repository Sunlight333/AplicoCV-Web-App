import type { Locale } from '@/i18n/dictionaries'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useCopy } from './useCopy'

const APPLY = 'mailto:careers@aplicocv.com?subject=Open%20application'

interface CareersCopy {
  eyebrow: string; title: string; subtitle: string
  openRoles: string; apply: string; noRoleTitle: string; noRoleBody: string; openApp: string
  perks: { icon: string; title: string; body: string }[]
  roles: { title: string; team: string; type: string }[]
}

const COPY: Record<Locale, CareersCopy> = {
  en: {
    eyebrow: 'Careers', title: 'Help millions apply with one click',
    subtitle: 'We’re a small, product-obsessed team building the fastest way to apply to jobs. Come build it with us.',
    openRoles: 'Open roles', apply: 'Apply', noRoleTitle: 'Don’t see your role?',
    noRoleBody: 'We’re always happy to meet talented people. Send us your CV and tell us how you’d make AplicoCV better.',
    openApp: 'Send an open application',
    perks: [
      { icon: '🌍', title: 'Remote-first', body: 'Work from anywhere across the Americas and Europe.' },
      { icon: '📈', title: 'Real ownership', body: 'Small team, big surface area — your work ships to users fast.' },
      { icon: '🧠', title: 'Learning budget', body: 'Courses, books and conferences to keep growing.' },
      { icon: '🌴', title: 'Flexible time off', body: 'Take the time you need to do your best work.' },
    ],
    roles: [
      { title: 'Senior Full-stack Engineer', team: 'Engineering', type: 'Remote · Full-time' },
      { title: 'Product Designer', team: 'Design', type: 'Remote · Full-time' },
      { title: 'Growth Marketer (LATAM)', team: 'Marketing', type: 'Remote · Contract' },
    ],
  },
  es: {
    eyebrow: 'Empleo', title: 'Ayuda a millones a postular con un clic',
    subtitle: 'Somos un equipo pequeño y obsesionado con el producto, construyendo la forma más rápida de postular a empleos. Constrúyela con nosotros.',
    openRoles: 'Vacantes abiertas', apply: 'Postular', noRoleTitle: '¿No ves tu puesto?',
    noRoleBody: 'Siempre nos alegra conocer gente talentosa. Envíanos tu CV y cuéntanos cómo mejorarías AplicoCV.',
    openApp: 'Enviar postulación abierta',
    perks: [
      { icon: '🌍', title: 'Remoto primero', body: 'Trabaja desde cualquier lugar de América y Europa.' },
      { icon: '📈', title: 'Responsabilidad real', body: 'Equipo pequeño, gran alcance — tu trabajo llega rápido a los usuarios.' },
      { icon: '🧠', title: 'Presupuesto de aprendizaje', body: 'Cursos, libros y conferencias para seguir creciendo.' },
      { icon: '🌴', title: 'Vacaciones flexibles', body: 'Tómate el tiempo que necesites para dar lo mejor.' },
    ],
    roles: [
      { title: 'Ingeniero/a Full-stack Senior', team: 'Ingeniería', type: 'Remoto · Tiempo completo' },
      { title: 'Diseñador/a de Producto', team: 'Diseño', type: 'Remoto · Tiempo completo' },
      { title: 'Growth Marketer (LATAM)', team: 'Marketing', type: 'Remoto · Por contrato' },
    ],
  },
  'pt-BR': {
    eyebrow: 'Carreiras', title: 'Ajude milhões a se candidatar com um clique',
    subtitle: 'Somos um time pequeno e obcecado por produto, construindo o jeito mais rápido de se candidatar a vagas. Venha construir com a gente.',
    openRoles: 'Vagas abertas', apply: 'Candidatar-se', noRoleTitle: 'Não viu sua vaga?',
    noRoleBody: 'Adoramos conhecer pessoas talentosas. Envie seu currículo e conte como você deixaria a AplicoCV melhor.',
    openApp: 'Enviar candidatura espontânea',
    perks: [
      { icon: '🌍', title: 'Remoto em primeiro lugar', body: 'Trabalhe de qualquer lugar das Américas e da Europa.' },
      { icon: '📈', title: 'Autonomia real', body: 'Time pequeno, grande alcance — seu trabalho chega rápido aos usuários.' },
      { icon: '🧠', title: 'Verba de aprendizado', body: 'Cursos, livros e conferências para você continuar crescendo.' },
      { icon: '🌴', title: 'Férias flexíveis', body: 'Tire o tempo que precisar para fazer seu melhor trabalho.' },
    ],
    roles: [
      { title: 'Engenheiro(a) Full-stack Sênior', team: 'Engenharia', type: 'Remoto · Tempo integral' },
      { title: 'Designer de Produto', team: 'Design', type: 'Remoto · Tempo integral' },
      { title: 'Growth Marketer (LATAM)', team: 'Marketing', type: 'Remoto · Contrato' },
    ],
  },
}

export default function CareersPage() {
  const c = useCopy(COPY)
  return (
    <MarketingShell eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {c.perks.map((p) => (
          <Card key={p.title} className="p-5">
            <div className="text-2xl">{p.icon}</div>
            <h3 className="mt-2 font-semibold text-navy-900">{p.title}</h3>
            <p className="mt-1 text-sm text-navy-500">{p.body}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-bold text-navy-900">{c.openRoles}</h2>
      <div className="mt-4 space-y-3">
        {c.roles.map((r) => (
          <Card key={r.title} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-semibold text-navy-900">{r.title}</p>
              <p className="text-sm text-navy-500">{r.team} · {r.type}</p>
            </div>
            <a href={`mailto:careers@aplicocv.com?subject=${encodeURIComponent(r.title)}`}>
              <Button variant="secondary" className="rounded-full">{c.apply}</Button>
            </a>
          </Card>
        ))}
      </div>

      <Card className="mt-8 flex flex-col items-center gap-2 p-8 text-center">
        <p className="font-semibold text-navy-900">{c.noRoleTitle}</p>
        <p className="max-w-md text-sm text-navy-500">{c.noRoleBody}</p>
        <a href={APPLY} className="mt-2">
          <Button className="rounded-full">{c.openApp}</Button>
        </a>
      </Card>
    </MarketingShell>
  )
}
