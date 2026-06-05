import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'

const FAQS: { q: string; a: string }[] = [
  { q: 'How does AplicoCV fill out application forms?', a: 'Upload your CV once and our AI structures your data. The Chrome extension then detects form fields on job portals and fills them automatically — matching each field to the right data, even on dynamic sites like LinkedIn and Workday.' },
  { q: 'Which job portals are supported?', a: 'We ship built-in support for 14 major portals including LinkedIn, Workday, Indeed, Glassdoor, Get on Board, Computrabajo and Bumeran. For any unlisted site, a smart fallback detects and fills standard fields.' },
  { q: 'What are credits and how do I earn them?', a: 'Credits power AI actions (Super-CV, cover letters, mock interviews). You get a welcome bonus, daily check-in rewards, one-time grants for completing your profile, and referral bonuses — or top up any time on the Plans page.' },
  { q: 'How do mock interviews work?', a: 'Pick a role and interview type; the AI generates tailored questions, you answer in your own words, and you get a score plus specific, actionable feedback per answer.' },
  { q: 'Is my data secure?', a: 'Your CV and profile are encrypted, portal passwords are stored with strong encryption and never exposed to the browser, and login autofill always asks for your confirmation. You can delete your account and all data anytime.' },
  { q: 'How do I install the extension?', a: 'From the Chrome Web Store (coming soon) or via manual “developer mode” install using the package we provide. The in-app Install page walks you through both.' },
]

const CATEGORIES = [
  { icon: '🚀', title: 'Getting started', body: 'Import your CV, complete your profile, install the extension.' },
  { icon: '🧩', title: 'The extension', body: 'Autofill, tailored CVs, cover letters, and auto-tracking.' },
  { icon: '✦', title: 'Credits & billing', body: 'Earn credits, buy packs, manage your subscription.' },
  { icon: '🔐', title: 'Account & privacy', body: 'Passwords, data export, deleting your account.' },
]

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
  return (
    <MarketingShell
      eyebrow="Help center"
      title="How can we help?"
      subtitle="Answers to the most common questions — and a way to reach us when you need a human."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Card key={c.title} className="p-5">
            <div className="text-2xl">{c.icon}</div>
            <h3 className="mt-2 font-semibold text-navy-900">{c.title}</h3>
            <p className="mt-1 text-sm text-navy-500">{c.body}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-lg font-semibold text-navy-900">Frequently asked questions</h2>
        <div className="mt-2">
          {FAQS.map((f) => (
            <FaqRow key={f.q} {...f} />
          ))}
        </div>
      </Card>

      <Card className="mt-6 flex flex-col items-center gap-2 p-8 text-center">
        <p className="font-semibold text-navy-900">Still need help?</p>
        <p className="text-sm text-navy-500">Our team usually replies within one business day.</p>
        <Link to="/contact" className="mt-2 text-sm font-semibold text-electric-600 hover:underline">
          Contact support →
        </Link>
      </Card>
    </MarketingShell>
  )
}
