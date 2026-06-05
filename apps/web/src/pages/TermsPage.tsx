import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'

const EFFECTIVE_DATE = 'June 5, 2026'
const CONTACT_EMAIL = 'support@aplicocv.com'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-navy-900">{title}</h2>
      <div className="mt-3 space-y-3 text-navy-600">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-navy-50/40">
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <Link to="/" className="text-sm font-semibold text-electric-600 hover:underline">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-extrabold text-navy-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-navy-400">Last updated: {EFFECTIVE_DATE}</p>

        <p className="mt-6 text-navy-600">
          These Terms govern your use of the AplicoCV web application and browser extension (the
          &ldquo;Service&rdquo;). By creating an account or using the Service, you agree to them.
        </p>

        <Section title="The Service">
          <p>
            AplicoCV helps you structure a professional profile and autofill job-application forms.
            You are responsible for reviewing every field the Service fills or generates before you
            submit an application — the AI assists, it does not replace your judgment, and it must not
            be used to misrepresent your experience.
          </p>
        </Section>

        <Section title="Your account">
          <p>
            You must provide accurate information and keep your credentials secure. You are
            responsible for activity under your account. You must be at least 16 years old to use the
            Service.
          </p>
        </Section>

        <Section title="Acceptable use">
          <ul className="list-disc space-y-2 pl-6">
            <li>Do not submit false information or impersonate others.</li>
            <li>Do not abuse, scrape, or attempt to disrupt the Service or the job portals it supports.</li>
            <li>Do not use the Service for unlawful purposes or to violate any portal&rsquo;s terms.</li>
          </ul>
        </Section>

        <Section title="Credits, plans &amp; billing">
          <p>
            Some features consume credits or require a paid plan. Paid plans are billed on a recurring
            basis and may be cancelled at any time; cancellation stops future renewals. Credits and
            promotional bonuses have no cash value and may expire. Prices and features may change with
            notice.
          </p>
        </Section>

        <Section title="Your content">
          <p>
            You retain ownership of the CV, profile, and documents you provide or generate. You grant
            us a limited licence to process them solely to operate the Service (see our{' '}
            <Link className="text-electric-600 hover:underline" to="/privacy">
              Privacy Policy
            </Link>
            ).
          </p>
        </Section>

        <Section title="AI-generated output">
          <p>
            AI-generated CVs, cover letters, and answers may contain inaccuracies. You are responsible
            for reviewing and editing them before use. We make no guarantee of interviews, offers, or
            employment outcomes.
          </p>
        </Section>

        <Section title="Disclaimers &amp; liability">
          <p>
            The Service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum
            extent permitted by law, we are not liable for indirect or consequential damages, and our
            total liability is limited to the amount you paid in the prior 12 months.
          </p>
        </Section>

        <Section title="Termination">
          <p>
            You may stop using the Service at any time. We may suspend or terminate accounts that
            violate these Terms. You can request deletion of your account by contacting us.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update these Terms; we will revise the &ldquo;Last updated&rdquo; date and, for
            material changes, notify you through the Service.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these Terms?{' '}
            <a className="text-electric-600 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <div className="mt-12 border-t border-navy-100 pt-6">
          <Link to="/" className="text-sm font-semibold text-electric-600 hover:underline">
            &larr; Back to home
          </Link>
        </div>
      </main>
    </div>
  )
}
