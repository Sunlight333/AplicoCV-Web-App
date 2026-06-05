import { Link } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { IconTile } from '@/components/ui/IconTile'
import type { IconName } from '@/components/ui/Icon'
import { useCopy } from './useCopy'

interface AboutCopy {
  eyebrow: string
  title: string
  subtitle: string
  p1: string
  p2: string
  values: { icon: IconName; title: string; body: string }[]
  stats: { v: string; l: string }[]
  cta: string
}

const COPY: Record<Locale, AboutCopy> = {
  en: {
    eyebrow: 'About us',
    title: 'We make applying to jobs take minutes, not hours',
    subtitle: 'AplicoCV turns one CV into tailored applications across every portal — with AI that stays truthful to who you are.',
    p1: 'Job hunting means filling the same form over and over: name, email, work history, “why do you want this role?” — on portal after portal. We started AplicoCV because that work is repetitive, slow, and completely automatable.',
    p2: 'Today AplicoCV structures your CV once, then autofills applications across LinkedIn, Workday, Indeed and a dozen more — tailoring your profile and generating cover letters per role, scoring your ATS fit before you apply, and even running mock interviews so you walk in prepared.',
    values: [
      { icon: 'target', title: 'Honest by default', body: 'Our AI reframes your real experience — it never invents employers, titles or achievements.' },
      { icon: 'bolt', title: 'Less busywork', body: 'Apply once, autofill everywhere. We remove the copy-paste so you can focus on the right roles.' },
      { icon: 'lock', title: 'Your data, your control', body: 'Profiles are encrypted, portal passwords never reach the browser, and you can delete everything anytime.' },
      { icon: 'globe', title: 'Built for LATAM and beyond', body: 'Spanish, Portuguese and English, with first-class support for the portals people actually use.' },
    ],
    stats: [
      { v: '14+', l: 'Portals supported' },
      { v: '300+', l: 'Fields auto-mapped' },
      { v: '21h', l: 'Saved per search' },
      { v: '95%', l: 'Parse accuracy' },
    ],
    cta: 'Start applying in one click',
  },
  es: {
    eyebrow: 'Sobre nosotros',
    title: 'Postularte a empleos toma minutos, no horas',
    subtitle: 'AplicoCV convierte un solo CV en postulaciones adaptadas en todos los portales — con una IA que es fiel a quién eres.',
    p1: 'Buscar empleo significa llenar el mismo formulario una y otra vez: nombre, correo, experiencia, “¿por qué quieres este puesto?” — en portal tras portal. Creamos AplicoCV porque ese trabajo es repetitivo, lento y totalmente automatizable.',
    p2: 'Hoy AplicoCV estructura tu CV una vez y luego autocompleta postulaciones en LinkedIn, Workday, Indeed y una docena más — adaptando tu perfil y generando cartas por puesto, evaluando tu compatibilidad ATS antes de postular, e incluso simulando entrevistas para que llegues preparado.',
    values: [
      { icon: 'target', title: 'Honestidad por defecto', body: 'Nuestra IA reformula tu experiencia real — nunca inventa empleadores, cargos ni logros.' },
      { icon: 'bolt', title: 'Menos trabajo repetitivo', body: 'Postula una vez, autocompleta en todas partes. Quitamos el copiar y pegar para que te enfoques en los puestos correctos.' },
      { icon: 'lock', title: 'Tus datos, tu control', body: 'Los perfiles están cifrados, las contraseñas de portales nunca llegan al navegador y puedes borrarlo todo cuando quieras.' },
      { icon: 'globe', title: 'Hecho para LATAM y más allá', body: 'Español, portugués e inglés, con soporte de primera para los portales que la gente realmente usa.' },
    ],
    stats: [
      { v: '14+', l: 'Portales compatibles' },
      { v: '300+', l: 'Campos mapeados' },
      { v: '21h', l: 'Ahorradas por búsqueda' },
      { v: '95%', l: 'Precisión de análisis' },
    ],
    cta: 'Empieza a postular en un clic',
  },
  'pt-BR': {
    eyebrow: 'Sobre nós',
    title: 'Candidatar-se a vagas leva minutos, não horas',
    subtitle: 'A AplicoCV transforma um único currículo em candidaturas adaptadas em todos os portais — com uma IA fiel a quem você é.',
    p1: 'Procurar emprego significa preencher o mesmo formulário repetidamente: nome, e-mail, experiência, “por que você quer esta vaga?” — em portal após portal. Criamos a AplicoCV porque esse trabalho é repetitivo, lento e totalmente automatizável.',
    p2: 'Hoje a AplicoCV estrutura seu currículo uma vez e preenche candidaturas no LinkedIn, Workday, Indeed e mais uma dezena — adaptando seu perfil e gerando cartas por vaga, avaliando sua compatibilidade ATS antes de se candidatar e até simulando entrevistas para você chegar preparado.',
    values: [
      { icon: 'target', title: 'Honestidade por padrão', body: 'Nossa IA reformula sua experiência real — nunca inventa empregadores, cargos ou conquistas.' },
      { icon: 'bolt', title: 'Menos trabalho repetitivo', body: 'Candidate-se uma vez, preencha em todo lugar. Tiramos o copiar e colar para você focar nas vagas certas.' },
      { icon: 'lock', title: 'Seus dados, seu controle', body: 'Os perfis são criptografados, as senhas dos portais nunca chegam ao navegador e você pode apagar tudo quando quiser.' },
      { icon: 'globe', title: 'Feito para a América Latina e além', body: 'Espanhol, português e inglês, com suporte de primeira aos portais que as pessoas realmente usam.' },
    ],
    stats: [
      { v: '14+', l: 'Portais compatíveis' },
      { v: '300+', l: 'Campos mapeados' },
      { v: '21h', l: 'Economizadas por busca' },
      { v: '95%', l: 'Precisão da análise' },
    ],
    cta: 'Comece a se candidatar em um clique',
  },
}

export default function AboutPage() {
  const c = useCopy(COPY)
  return (
    <MarketingShell eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <div className="space-y-4 text-navy-600">
        <p>{c.p1}</p>
        <p>{c.p2}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {c.values.map((v) => (
          <Card key={v.title} className="p-6">
            <IconTile name={v.icon} size="md" />
            <h3 className="mt-3 font-semibold text-navy-900">{v.title}</h3>
            <p className="mt-1.5 text-sm text-navy-500">{v.body}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 rounded-2xl bg-navy-900 p-8 sm:grid-cols-4">
        {c.stats.map((s) => (
          <div key={s.l} className="text-center">
            <p className="text-3xl font-extrabold text-white">{s.v}</p>
            <p className="mt-1 text-xs text-navy-300">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link to="/register">
          <Button size="lg" className="rounded-full">{c.cta}</Button>
        </Link>
      </div>
    </MarketingShell>
  )
}
