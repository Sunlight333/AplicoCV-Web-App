import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { useT } from '@/i18n/I18nProvider'
import { useCopy } from '@/i18n/useCopy'
import type { Locale } from '@/i18n/dictionaries'

interface Step {
  title: string
  body: string
  to?: string
  cta?: string
}

// Step copy is localized so the whole "How to use" guide responds to the language
// switcher (client feedback: this page was entirely in English).
const STEPS: Record<Locale, Step[]> = {
  en: [
    { title: 'Import your CV', body: 'Upload a PDF or DOCX once. Our AI structures your experience, skills and education into a profile you can reuse everywhere.', to: '/profile', cta: 'Go to profile' },
    { title: 'Set your job preferences', body: 'Tell us your target roles, salary, modality and locations. These answers also let the autofill complete the tricky application fields for you.', to: '/preferences', cta: 'Set preferences' },
    { title: 'Complete your profile & earn credits', body: 'Add experience, skills and a few common answers. Each completed section grants credits you spend on the AI tools.', to: '/rewards', cta: 'See rewards' },
    { title: 'Optimize your CV for a role', body: 'Use Super-CV to rewrite your experience with the X-Y-Z formula and an ATS score, or generate a 100% personalized cover letter.', to: '/optimize', cta: 'Optimize CV' },
    { title: 'Practice with a mock interview', body: 'Get role-tailored questions and instant, specific feedback before the real thing.', to: '/interview', cta: 'Start interview' },
    { title: 'Install the browser extension', body: 'Add AplicoCV to Chrome to autofill applications across LinkedIn, Workday, Indeed and more — in one click.', to: '/extension', cta: 'Install' },
    { title: 'Track every application', body: 'The extension records each application automatically; manage them on your board from applied to offer.', to: '/applications', cta: 'Open board' },
  ],
  es: [
    { title: 'Importa tu CV', body: 'Sube un PDF o DOCX una sola vez. Nuestra IA estructura tu experiencia, habilidades y formación en un perfil que puedes reutilizar en todas partes.', to: '/profile', cta: 'Ir al perfil' },
    { title: 'Define tus preferencias de empleo', body: 'Indícanos tus puestos objetivo, salario, modalidad y ubicaciones. Estas respuestas también permiten que el autocompletado complete los campos difíciles por ti.', to: '/preferences', cta: 'Definir preferencias' },
    { title: 'Completa tu perfil y gana créditos', body: 'Agrega experiencia, habilidades y algunas respuestas comunes. Cada sección completada otorga créditos que usas en las herramientas de IA.', to: '/rewards', cta: 'Ver recompensas' },
    { title: 'Optimiza tu CV para un puesto', body: 'Usa el Súper CV para reescribir tu experiencia con la fórmula X-Y-Z y un puntaje ATS, o genera una carta de presentación 100% personalizada.', to: '/optimize', cta: 'Optimizar CV' },
    { title: 'Practica con una entrevista simulada', body: 'Recibe preguntas según el puesto y feedback inmediato y específico antes de la entrevista real.', to: '/interview', cta: 'Iniciar entrevista' },
    { title: 'Instala la extensión del navegador', body: 'Agrega AplicoCV a Chrome para autocompletar postulaciones en LinkedIn, Workday, Indeed y más — con un clic.', to: '/extension', cta: 'Instalar' },
    { title: 'Haz seguimiento de cada postulación', body: 'La extensión registra cada postulación automáticamente; gestiónalas en tu tablero, desde postulado hasta oferta.', to: '/applications', cta: 'Abrir tablero' },
  ],
  'pt-BR': [
    { title: 'Importe seu currículo', body: 'Envie um PDF ou DOCX uma única vez. Nossa IA estrutura sua experiência, habilidades e formação em um perfil que você reutiliza em qualquer lugar.', to: '/profile', cta: 'Ir para o perfil' },
    { title: 'Defina suas preferências de emprego', body: 'Diga seus cargos desejados, salário, modalidade e locais. Estas respostas também permitem que o preenchimento automático complete os campos difíceis por você.', to: '/preferences', cta: 'Definir preferências' },
    { title: 'Complete seu perfil e ganhe créditos', body: 'Adicione experiência, habilidades e algumas respostas comuns. Cada seção concluída concede créditos para usar nas ferramentas de IA.', to: '/rewards', cta: 'Ver recompensas' },
    { title: 'Otimize seu currículo para uma vaga', body: 'Use o Super CV para reescrever sua experiência com a fórmula X-Y-Z e uma pontuação ATS, ou gere uma carta de apresentação 100% personalizada.', to: '/optimize', cta: 'Otimizar currículo' },
    { title: 'Pratique com uma entrevista simulada', body: 'Receba perguntas conforme a vaga e feedback imediato e específico antes da entrevista real.', to: '/interview', cta: 'Iniciar entrevista' },
    { title: 'Instale a extensão do navegador', body: 'Adicione a AplicoCV ao Chrome para preencher candidaturas no LinkedIn, Workday, Indeed e mais — com um clique.', to: '/extension', cta: 'Instalar' },
    { title: 'Acompanhe cada candidatura', body: 'A extensão registra cada candidatura automaticamente; gerencie-as no seu quadro, de candidatado a oferta.', to: '/applications', cta: 'Abrir quadro' },
  ],
}

export default function GuidePage() {
  const t = useT()
  const tg = t.app.more.guide
  const steps = useCopy(STEPS)
  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{tg.title}</h1>
      <p className="mt-1 text-navy-500">{tg.subtitle}</p>

      <div className="mt-6 space-y-4">
        {steps.map((s, i) => (
          <Card key={i} className="flex items-start gap-4 p-5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
              {i + 1}
            </span>
            <div className="flex-1">
              <h2 className="font-semibold text-navy-900">{s.title}</h2>
              <p className="mt-1 text-sm text-navy-500">{s.body}</p>
              {s.to && s.cta && (
                <Link to={s.to} className="mt-2 inline-block text-sm font-medium text-electric-600 hover:underline">
                  {s.cta} →
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </PageTransition>
  )
}
