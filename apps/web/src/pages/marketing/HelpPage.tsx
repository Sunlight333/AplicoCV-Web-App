import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import type { IconName } from '@/components/ui/Icon'
import { useCopy } from './useCopy'

interface HelpCopy {
  eyebrow: string; title: string; subtitle: string
  faqTitle: string; stillTitle: string; stillBody: string; contact: string
  categories: { icon: IconName; title: string; body: string }[]
  faqs: { q: string; a: string }[]
}

const COPY: Record<Locale, HelpCopy> = {
  en: {
    eyebrow: 'Help center', title: 'How can we help?',
    subtitle: 'Answers to the most common questions — and a way to reach us when you need a human.',
    faqTitle: 'Frequently asked questions', stillTitle: 'Still need help?',
    stillBody: 'Our team usually replies within one business day.', contact: 'Contact support →',
    categories: [
      { icon: 'rocket', title: 'Getting started', body: 'Import your CV, complete your profile, install the extension.' },
      { icon: 'extension', title: 'The extension', body: 'Autofill, tailored CVs, cover letters, and auto-tracking.' },
      { icon: 'sparkles', title: 'Plans & billing', body: 'Upgrade, manage your subscription, and billing.' },
      { icon: 'shield', title: 'Account & privacy', body: 'Passwords, data export, deleting your account.' },
    ],
    faqs: [
      { q: 'How does AplicoCV fill out application forms?', a: 'Upload your CV once and our AI structures your data. The Chrome extension then detects form fields on job portals and fills them automatically — matching each field to the right data, even on dynamic sites like LinkedIn and Workday.' },
      { q: 'Which job portals are supported?', a: 'We ship built-in support for 20+ major portals including LinkedIn, Workday, Indeed, Glassdoor, Get on Board, Computrabajo, Bumeran, ZipRecruiter, USAJobs, Upwork and Fiverr. For any unlisted site, a smart fallback detects and fills standard fields.' },
      { q: 'How does billing work?', a: 'AplicoCV is a subscription — a Weekly or Monthly plan unlocks full access to every AI feature (optimized CV, cover letters, mock interviews, ATS simulator and more). Manage or cancel anytime from the Plans page.' },
      { q: 'How do mock interviews work?', a: 'Pick a role and interview type; the AI generates tailored questions, you answer in your own words, and you get a score plus specific, actionable feedback per answer.' },
      { q: 'Is my data secure?', a: 'Your CV and profile are encrypted, portal passwords are stored with strong encryption and never exposed to the browser, and login autofill always asks for your confirmation. You can delete your account and all data anytime.' },
      { q: 'How do I install the extension?', a: 'From the Chrome Web Store (coming soon) or via manual “developer mode” install using the package we provide. The in-app Install page walks you through both.' },
    ],
  },
  es: {
    eyebrow: 'Centro de ayuda', title: '¿Cómo podemos ayudarte?',
    subtitle: 'Respuestas a las preguntas más comunes — y una forma de contactarnos cuando necesitas a una persona.',
    faqTitle: 'Preguntas frecuentes', stillTitle: '¿Aún necesitas ayuda?',
    stillBody: 'Nuestro equipo suele responder en un día hábil.', contact: 'Contactar a soporte →',
    categories: [
      { icon: 'rocket', title: 'Primeros pasos', body: 'Importa tu CV, completa tu perfil, instala la extensión.' },
      { icon: 'extension', title: 'La extensión', body: 'Autocompletado, CVs adaptados, cartas y seguimiento automático.' },
      { icon: 'sparkles', title: 'Planes y facturación', body: 'Mejora tu plan, gestiona tu suscripción y la facturación.' },
      { icon: 'shield', title: 'Cuenta y privacidad', body: 'Contraseñas, exportar datos, eliminar tu cuenta.' },
    ],
    faqs: [
      { q: '¿Cómo completa AplicoCV los formularios de postulación?', a: 'Sube tu CV una vez y nuestra IA estructura tus datos. La extensión de Chrome detecta los campos en los portales y los completa automáticamente — asignando cada campo al dato correcto, incluso en sitios dinámicos como LinkedIn y Workday.' },
      { q: '¿Qué portales de empleo son compatibles?', a: 'Incluimos soporte para más de 20 portales principales como LinkedIn, Workday, Indeed, Glassdoor, Get on Board, Computrabajo, Bumeran, ZipRecruiter, USAJobs, Upwork y Fiverr. Para cualquier sitio no listado, un respaldo inteligente detecta y completa los campos estándar.' },
      { q: '¿Cómo funciona la facturación?', a: 'AplicoCV es una suscripción — un plan Semanal o Mensual desbloquea el acceso completo a todas las funciones de IA (CV optimizado, cartas, entrevistas simuladas, simulador ATS y más). Gestiona o cancela cuando quieras desde la página de Planes.' },
      { q: '¿Cómo funcionan las entrevistas simuladas?', a: 'Elige un puesto y un tipo de entrevista; la IA genera preguntas adaptadas, respondes con tus propias palabras y recibes un puntaje más feedback específico y accionable por respuesta.' },
      { q: '¿Mis datos están seguros?', a: 'Tu CV y perfil están cifrados, las contraseñas de portales se guardan con cifrado fuerte y nunca se exponen al navegador, y el autocompletado de inicio de sesión siempre pide tu confirmación. Puedes eliminar tu cuenta y todos los datos cuando quieras.' },
      { q: '¿Cómo instalo la extensión?', a: 'Desde la Chrome Web Store (próximamente) o con una instalación manual en “modo desarrollador” usando el paquete que ofrecemos. La página de Instalación dentro de la app te guía en ambos casos.' },
    ],
  },
  'pt-BR': {
    eyebrow: 'Central de ajuda', title: 'Como podemos ajudar?',
    subtitle: 'Respostas às perguntas mais comuns — e um jeito de falar conosco quando você precisa de uma pessoa.',
    faqTitle: 'Perguntas frequentes', stillTitle: 'Ainda precisa de ajuda?',
    stillBody: 'Nossa equipe costuma responder em um dia útil.', contact: 'Falar com o suporte →',
    categories: [
      { icon: 'rocket', title: 'Primeiros passos', body: 'Importe seu currículo, complete seu perfil, instale a extensão.' },
      { icon: 'extension', title: 'A extensão', body: 'Preenchimento, currículos adaptados, cartas e rastreio automático.' },
      { icon: 'sparkles', title: 'Planos e faturamento', body: 'Faça upgrade, gerencie sua assinatura e o faturamento.' },
      { icon: 'shield', title: 'Conta e privacidade', body: 'Senhas, exportar dados, excluir sua conta.' },
    ],
    faqs: [
      { q: 'Como a AplicoCV preenche os formulários de candidatura?', a: 'Envie seu currículo uma vez e nossa IA estrutura seus dados. A extensão do Chrome detecta os campos nos portais e os preenche automaticamente — associando cada campo ao dado certo, mesmo em sites dinâmicos como LinkedIn e Workday.' },
      { q: 'Quais portais de emprego são compatíveis?', a: 'Já incluímos suporte a mais de 20 portais principais, como LinkedIn, Workday, Indeed, Glassdoor, Get on Board, Computrabajo, Bumeran, ZipRecruiter, USAJobs, Upwork e Fiverr. Para qualquer site não listado, um recurso inteligente detecta e preenche os campos padrão.' },
      { q: 'Como funciona o faturamento?', a: 'A AplicoCV é uma assinatura — um plano Semanal ou Mensal desbloqueia o acesso completo a todos os recursos de IA (currículo otimizado, cartas, entrevistas simuladas, simulador ATS e mais). Gerencie ou cancele quando quiser na página de Planos.' },
      { q: 'Como funcionam as entrevistas simuladas?', a: 'Escolha um cargo e um tipo de entrevista; a IA gera perguntas adaptadas, você responde com suas palavras e recebe uma pontuação mais feedback específico e prático por resposta.' },
      { q: 'Meus dados estão seguros?', a: 'Seu currículo e perfil são criptografados, as senhas dos portais são guardadas com criptografia forte e nunca expostas ao navegador, e o preenchimento de login sempre pede sua confirmação. Você pode excluir sua conta e todos os dados quando quiser.' },
      { q: 'Como instalo a extensão?', a: 'Pela Chrome Web Store (em breve) ou por instalação manual em “modo desenvolvedor” usando o pacote que fornecemos. A página de Instalação no app orienta nos dois casos.' },
    ],
  },
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button onClick={() => setOpen((o) => !o)} className="w-full border-b border-navy-100 py-4 text-left last:border-0">
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-navy-900">{q}</span>
        <span className="flex-none text-navy-300">{open ? '–' : '+'}</span>
      </div>
      {open && <p className="mt-2 text-sm text-navy-500">{a}</p>}
    </button>
  )
}

export default function HelpPage() {
  const c = useCopy(COPY)
  return (
    <MarketingShell heroImage="/pages/help-center.png" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {c.categories.map((cat) => (
          <Card key={cat.title} className="p-5">
            <IconTile name={cat.icon} size="md" />
            <h3 className="mt-2 font-semibold text-navy-900">{cat.title}</h3>
            <p className="mt-1 text-sm text-navy-500">{cat.body}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-lg font-semibold text-navy-900">{c.faqTitle}</h2>
        <div className="mt-2">
          {c.faqs.map((f) => (
            <FaqRow key={f.q} {...f} />
          ))}
        </div>
      </Card>

      <Card className="mt-6 flex flex-col items-center gap-2 p-8 text-center">
        <p className="font-semibold text-navy-900">{c.stillTitle}</p>
        <p className="text-sm text-navy-500">{c.stillBody}</p>
        <Link to="/contact" className="mt-2 text-sm font-semibold text-electric-600 hover:underline">
          {c.contact}
        </Link>
      </Card>
    </MarketingShell>
  )
}
