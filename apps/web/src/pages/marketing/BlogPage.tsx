import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const POSTS: { tag: string; date: string; title: string; excerpt: string; body: string[] }[] = [
  {
    tag: 'ATS', date: 'May 2026',
    title: 'How applicant tracking systems really read your CV',
    excerpt: 'Most CVs are filtered by software before a human sees them. Here’s how to get past it — honestly.',
    body: [
      'An ATS parses your CV into fields and scores it against the job description’s keywords. If the words a recruiter searches for aren’t on your CV, you can be filtered out before anyone reads it.',
      'The fix isn’t keyword stuffing — it’s mirroring the language of the posting where it’s genuinely true of you. Use the exact role title in your headline, and make sure the skills the job lists appear naturally in your experience.',
      'AplicoCV’s ATS Simulator shows your match score, which keywords you already cover, and which you’re missing — so every application is targeted, not generic.',
    ],
  },
  {
    tag: 'CV', date: 'May 2026',
    title: 'The X-Y-Z formula for achievement bullets',
    excerpt: 'Turn flat job duties into measurable accomplishments recruiters actually notice.',
    body: [
      'Google’s famous advice: write bullets as “Accomplished X, as measured by Y, by doing Z.” It forces a result and a number into every line.',
      'Instead of “Responsible for the checkout page,” write “Increased checkout conversion 14% by rebuilding the payment flow in React.” Same work — far more credible.',
      'Super-CV rewrites your experience with this formula automatically, using only the facts already in your CV.',
    ],
  },
  {
    tag: 'Cover letters', date: 'Apr 2026',
    title: 'Cover letters that don’t sound like everyone else’s',
    excerpt: 'A focused 250-word letter beats a generic page every time. Here’s the structure.',
    body: [
      'Open with the specific role and one concrete reason you’re a fit — not “I am writing to express my interest.” Middle: one proof point with a result. Close: a confident, brief call to action.',
      'Keep it to 250–350 words and match the company’s tone. A warm startup and a formal bank want different letters.',
      'AplicoCV generates a 100% personalized letter per posting, referencing the company, the role, and the points you want to emphasize.',
    ],
  },
  {
    tag: 'Interviews', date: 'Apr 2026',
    title: 'Use the STAR method to ace behavioral questions',
    excerpt: 'Situation, Task, Action, Result — the simple structure that makes answers land.',
    body: [
      'Behavioral questions (“tell me about a time…”) reward structure. STAR keeps you concrete: set the Situation and Task briefly, spend most of your answer on the Action you personally took, and always end with a measurable Result.',
      'Practice out loud. The gap between knowing a story and telling it well is bigger than people expect.',
      'AplicoCV’s AI mock interview asks role-specific questions and scores your answers with specific feedback so you improve before the real thing.',
    ],
  },
]

function Post({ post }: { post: (typeof POSTS)[number] }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 text-xs text-navy-400">
        <Badge tone="info">{post.tag}</Badge>
        <span>{post.date}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-navy-900">{post.title}</h3>
      <p className="mt-1.5 text-sm text-navy-500">{post.excerpt}</p>
      {open && (
        <div className="mt-4 space-y-3 border-t border-navy-100 pt-4 text-sm leading-relaxed text-navy-600">
          {post.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} className="mt-3 text-sm font-semibold text-electric-600 hover:underline">
        {open ? 'Show less' : 'Read more →'}
      </button>
    </Card>
  )
}

export default function BlogPage() {
  return (
    <MarketingShell
      eyebrow="Blog & guides"
      title="Land more interviews"
      subtitle="Practical, no-fluff advice on CVs, ATS, cover letters and interviews — written by the team behind AplicoCV."
      max="max-w-5xl"
    >
      <div className="grid gap-5 md:grid-cols-2">
        {POSTS.map((p) => (
          <Post key={p.title} post={p} />
        ))}
      </div>

      <Card className="mt-8 flex flex-col items-center gap-2 p-8 text-center">
        <p className="font-semibold text-navy-900">Put these tips to work</p>
        <p className="max-w-md text-sm text-navy-500">
          Score your ATS fit, rewrite your CV, and practice interviews — all in one place.
        </p>
        <Link to="/register" className="mt-2 text-sm font-semibold text-electric-600 hover:underline">
          Get started free →
        </Link>
      </Card>
    </MarketingShell>
  )
}
