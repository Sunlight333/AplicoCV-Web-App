import { useState } from 'react'
import type { Locale } from '@/i18n/dictionaries'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { Input, TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/Toast'
import { IconTile } from '@/components/ui/IconTile'
import type { IconName } from '@/components/ui/Icon'
import { useCopy } from './useCopy'

const SUPPORT = 'support@aplicocv.com'

interface ContactCopy {
  eyebrow: string; title: string; subtitle: string
  formTitle: string; name: string; email: string; message: string; send: string
  sentNote: string; toast: string; response: string
  channels: { icon: IconName; title: string; body: string; href: string }[]
}

const COPY: Record<Locale, ContactCopy> = {
  en: {
    eyebrow: 'Contact', title: 'Get in touch',
    subtitle: 'Questions, feedback, or partnership ideas — we read every message.',
    formTitle: 'Send us a message', name: 'Your name', email: 'Email', message: 'Message', send: 'Send message',
    sentNote: `Thanks! If your mail app didn’t open, email us at ${SUPPORT}.`,
    toast: 'Opening your email app — thanks for reaching out!',
    response: 'We typically reply within 1 business day. For account data requests, include the email on your account.',
    channels: [
      { icon: 'mail', title: 'Email support', body: SUPPORT, href: `mailto:${SUPPORT}` },
      { icon: 'chat', title: 'Help center', body: 'Browse common questions', href: '/help' },
      { icon: 'activity', title: 'Service status', body: 'Check live system status', href: '/status' },
    ],
  },
  es: {
    eyebrow: 'Contacto', title: 'Ponte en contacto',
    subtitle: 'Preguntas, comentarios o ideas de colaboración — leemos cada mensaje.',
    formTitle: 'Envíanos un mensaje', name: 'Tu nombre', email: 'Correo electrónico', message: 'Mensaje', send: 'Enviar mensaje',
    sentNote: `¡Gracias! Si no se abrió tu app de correo, escríbenos a ${SUPPORT}.`,
    toast: 'Abriendo tu app de correo — ¡gracias por escribir!',
    response: 'Normalmente respondemos en 1 día hábil. Para solicitudes sobre tus datos, incluye el correo de tu cuenta.',
    channels: [
      { icon: 'mail', title: 'Soporte por correo', body: SUPPORT, href: `mailto:${SUPPORT}` },
      { icon: 'chat', title: 'Centro de ayuda', body: 'Explora preguntas frecuentes', href: '/help' },
      { icon: 'activity', title: 'Estado del servicio', body: 'Mira el estado en vivo', href: '/status' },
    ],
  },
  'pt-BR': {
    eyebrow: 'Contato', title: 'Fale conosco',
    subtitle: 'Dúvidas, feedback ou ideias de parceria — lemos cada mensagem.',
    formTitle: 'Envie uma mensagem', name: 'Seu nome', email: 'E-mail', message: 'Mensagem', send: 'Enviar mensagem',
    sentNote: `Obrigado! Se seu app de e-mail não abriu, escreva para ${SUPPORT}.`,
    toast: 'Abrindo seu app de e-mail — obrigado por escrever!',
    response: 'Normalmente respondemos em 1 dia útil. Para solicitações sobre seus dados, inclua o e-mail da sua conta.',
    channels: [
      { icon: 'mail', title: 'Suporte por e-mail', body: SUPPORT, href: `mailto:${SUPPORT}` },
      { icon: 'chat', title: 'Central de ajuda', body: 'Veja as perguntas frequentes', href: '/help' },
      { icon: 'activity', title: 'Status do serviço', body: 'Veja o status ao vivo', href: '/status' },
    ],
  },
}

export default function ContactPage() {
  const { toast } = useToast()
  const c = useCopy(COPY)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Contact from ${form.name || 'a visitor'}`)
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`)
    window.location.href = `mailto:${SUPPORT}?subject=${subject}&body=${body}`
    setSent(true)
    toast(c.toast)
  }

  return (
    <MarketingShell eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} max="max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-navy-900">{c.formTitle}</h2>
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={c.name} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <Input label={c.email} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <TextArea label={c.message} rows={6} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
            <Button type="submit" className="rounded-full">{c.send}</Button>
            {sent && <p className="text-sm text-green-600">{c.sentNote}</p>}
          </form>
        </Card>

        <div className="space-y-4">
          {c.channels.map((ch) => (
            <a key={ch.title} href={ch.href} className="block">
              <Card className="flex items-center gap-4 p-5 transition-shadow hover:shadow-card-hover">
                <IconTile name={ch.icon} size="md" />
                <div>
                  <p className="font-semibold text-navy-900">{ch.title}</p>
                  <p className="text-sm text-navy-500">{ch.body}</p>
                </div>
              </Card>
            </a>
          ))}
          <Card className="p-5">
            <p className="text-sm text-navy-500">{c.response}</p>
          </Card>
        </div>
      </div>
    </MarketingShell>
  )
}
