import { Link } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCopy } from './useCopy'

const CHROME_STORE_URL = (import.meta.env.VITE_CHROME_STORE_URL as string | undefined) || ''
const STORE_READY = Boolean(CHROME_STORE_URL)

interface ExtCopy {
  eyebrow: string; title: string; subtitle: string
  addToChrome: string; comingSoon: string; download: string
  howTitle: string; ctaTitle: string; ctaBtn: string; ctaNote: string
  perks: { icon: string; t: string; d: string }[]
  steps: { t: string; d: string }[]
}

const COPY: Record<Locale, ExtCopy> = {
  en: {
    eyebrow: 'Chrome extension', title: 'The extension that applies for you',
    subtitle: 'AplicoCV for Chrome autofills job applications across every major portal — tailored to each role, in one click.',
    addToChrome: 'Add to Chrome', comingSoon: 'Coming soon to the Chrome Web Store',
    download: 'Download the package for manual install →', howTitle: 'How it works',
    ctaTitle: 'Ready to apply in one click?', ctaBtn: 'Create your free account', ctaNote: 'Works on Google Chrome · Free to start',
    perks: [
      { icon: '⚡', t: 'One-click autofill', d: 'Fill long forms instantly across 14+ portals.' },
      { icon: '🎯', t: 'Tailored on the fly', d: 'Toggle a CV tailored to the exact posting.' },
      { icon: '✍️', t: 'Cover letters inline', d: 'Generate and insert a focused letter without leaving the page.' },
      { icon: '🗂️', t: 'Auto-tracking', d: 'Every application is logged to your board automatically.' },
    ],
    steps: [
      { t: 'Open a job posting', d: 'Go to any application on a supported portal — LinkedIn, Workday, Indeed and more.' },
      { t: 'Click the AplicoCV icon', d: 'The popup detects the form and connects to your profile automatically.' },
      { t: 'Autofill & apply', d: 'Every field fills in seconds — optionally with a CV tailored to the role and a cover letter.' },
    ],
  },
  es: {
    eyebrow: 'Extensión de Chrome', title: 'La extensión que postula por ti',
    subtitle: 'AplicoCV para Chrome autocompleta postulaciones en todos los portales principales — adaptadas a cada puesto, en un clic.',
    addToChrome: 'Agregar a Chrome', comingSoon: 'Próximamente en la Chrome Web Store',
    download: 'Descargar el paquete para instalación manual →', howTitle: 'Cómo funciona',
    ctaTitle: '¿Listo para postular en un clic?', ctaBtn: 'Crea tu cuenta gratis', ctaNote: 'Funciona en Google Chrome · Gratis para empezar',
    perks: [
      { icon: '⚡', t: 'Autocompletado en un clic', d: 'Llena formularios largos al instante en más de 14 portales.' },
      { icon: '🎯', t: 'Adaptado al momento', d: 'Activa un CV adaptado a la oferta exacta.' },
      { icon: '✍️', t: 'Cartas integradas', d: 'Genera e inserta una carta enfocada sin salir de la página.' },
      { icon: '🗂️', t: 'Seguimiento automático', d: 'Cada postulación se registra en tu tablero automáticamente.' },
    ],
    steps: [
      { t: 'Abre una oferta de empleo', d: 'Entra a cualquier postulación en un portal compatible — LinkedIn, Workday, Indeed y más.' },
      { t: 'Haz clic en el icono de AplicoCV', d: 'El popup detecta el formulario y se conecta a tu perfil automáticamente.' },
      { t: 'Autocompleta y postula', d: 'Cada campo se llena en segundos — opcionalmente con un CV adaptado al puesto y una carta.' },
    ],
  },
  'pt-BR': {
    eyebrow: 'Extensão do Chrome', title: 'A extensão que se candidata por você',
    subtitle: 'A AplicoCV para Chrome preenche candidaturas em todos os portais principais — adaptadas a cada vaga, em um clique.',
    addToChrome: 'Adicionar ao Chrome', comingSoon: 'Em breve na Chrome Web Store',
    download: 'Baixar o pacote para instalação manual →', howTitle: 'Como funciona',
    ctaTitle: 'Pronto para se candidatar em um clique?', ctaBtn: 'Crie sua conta grátis', ctaNote: 'Funciona no Google Chrome · Grátis para começar',
    perks: [
      { icon: '⚡', t: 'Preenchimento em um clique', d: 'Preencha formulários longos na hora em mais de 14 portais.' },
      { icon: '🎯', t: 'Adaptado na hora', d: 'Ative um currículo adaptado à vaga exata.' },
      { icon: '✍️', t: 'Cartas integradas', d: 'Gere e insira uma carta focada sem sair da página.' },
      { icon: '🗂️', t: 'Rastreio automático', d: 'Cada candidatura é registrada no seu quadro automaticamente.' },
    ],
    steps: [
      { t: 'Abra uma vaga', d: 'Vá a qualquer candidatura em um portal compatível — LinkedIn, Workday, Indeed e mais.' },
      { t: 'Clique no ícone da AplicoCV', d: 'O popup detecta o formulário e se conecta ao seu perfil automaticamente.' },
      { t: 'Preencha e candidate-se', d: 'Cada campo é preenchido em segundos — opcionalmente com um currículo adaptado e uma carta.' },
    ],
  },
}

export default function ChromeExtensionPage() {
  const c = useCopy(COPY)
  return (
    <MarketingShell eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} max="max-w-5xl">
      <div className="flex flex-col items-center gap-3">
        {STORE_READY ? (
          <a href={CHROME_STORE_URL} target="_blank" rel="noreferrer">
            <Button size="lg" className="rounded-full">{c.addToChrome}</Button>
          </a>
        ) : (
          <>
            <Button size="lg" className="rounded-full" disabled>{c.addToChrome}</Button>
            <Badge tone="neutral">{c.comingSoon}</Badge>
            <a href="/aplicocv-extension.zip" download className="text-sm font-semibold text-electric-600 hover:underline">
              {c.download}
            </a>
          </>
        )}
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {c.perks.map((p) => (
          <Card key={p.t} className="p-5">
            <div className="text-2xl">{p.icon}</div>
            <h3 className="mt-2 font-semibold text-navy-900">{p.t}</h3>
            <p className="mt-1 text-sm text-navy-500">{p.d}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-14 text-center text-2xl font-bold text-navy-900">{c.howTitle}</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {c.steps.map((s, i) => (
          <Card key={s.t} className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient font-bold text-white">
              {i + 1}
            </div>
            <h3 className="mt-4 font-semibold text-navy-900">{s.t}</h3>
            <p className="mt-1.5 text-sm text-navy-500">{s.d}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-12 flex flex-col items-center gap-3 p-8 text-center">
        <p className="font-semibold text-navy-900">{c.ctaTitle}</p>
        <Link to="/register">
          <Button className="rounded-full">{c.ctaBtn}</Button>
        </Link>
        <p className="text-xs text-navy-400">{c.ctaNote}</p>
      </Card>
    </MarketingShell>
  )
}
