import { useState } from 'react'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { Input, TextArea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/Toast'

const SUPPORT = 'support@aplicocv.com'

const CHANNELS = [
  { icon: '✉️', title: 'Email support', body: SUPPORT, href: `mailto:${SUPPORT}` },
  { icon: '💬', title: 'Help center', body: 'Browse common questions', href: '/help' },
  { icon: '🟢', title: 'Service status', body: 'Check live system status', href: '/status' },
]

export default function ContactPage() {
  const { toast } = useToast()
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // No inbox integration yet — open the user's mail client pre-filled and confirm.
    const subject = encodeURIComponent(`Contact from ${form.name || 'a visitor'}`)
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`)
    window.location.href = `mailto:${SUPPORT}?subject=${subject}&body=${body}`
    setSent(true)
    toast('Opening your email app — thanks for reaching out!')
  }

  return (
    <MarketingShell
      eyebrow="Contact"
      title="Get in touch"
      subtitle="Questions, feedback, or partnership ideas — we read every message."
      max="max-w-5xl"
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-navy-900">Send us a message</h2>
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <TextArea label="Message" rows={6} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
            <Button type="submit" className="rounded-full">Send message</Button>
            {sent && <p className="text-sm text-green-600">Thanks! If your mail app didn’t open, email us at {SUPPORT}.</p>}
          </form>
        </Card>

        <div className="space-y-4">
          {CHANNELS.map((c) => (
            <a key={c.title} href={c.href} className="block">
              <Card className="flex items-center gap-4 p-5 transition-shadow hover:shadow-card-hover">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <p className="font-semibold text-navy-900">{c.title}</p>
                  <p className="text-sm text-navy-500">{c.body}</p>
                </div>
              </Card>
            </a>
          ))}
          <Card className="p-5">
            <p className="text-sm text-navy-500">
              We typically reply within <strong className="text-navy-800">1 business day</strong>. For account
              data requests, include the email on your account.
            </p>
          </Card>
        </div>
      </div>
    </MarketingShell>
  )
}
