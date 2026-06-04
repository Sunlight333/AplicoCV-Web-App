import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'

const EFFECTIVE_DATE = 'June 4, 2026'
const CONTACT_EMAIL = 'support@aplicocv.com'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-navy-900">{title}</h2>
      <div className="mt-3 space-y-3 text-navy-600">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-extrabold text-navy-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-navy-400">Last updated: {EFFECTIVE_DATE}</p>

        <p className="mt-6 text-navy-600">
          This Privacy Policy explains how AplicoCV (&ldquo;AplicoCV&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;)
          collects, uses, stores, and protects your information when you use the AplicoCV web application
          and the AplicoCV browser extension (together, the &ldquo;Service&rdquo;). By creating an account or
          installing the extension, you agree to the practices described here.
        </p>

        <Section title="Information we collect">
          <p>We collect only the information needed to autofill job applications on your behalf:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Account details.</strong> Your name and email address, and a securely hashed password
              (or a Google sign-in identifier if you use Google to sign in).
            </li>
            <li>
              <strong>Professional profile.</strong> The information you provide or that we extract from a CV
              you upload &mdash; such as work history, education, skills, and contact details &mdash; which is
              structured into a reusable profile.
            </li>
            <li>
              <strong>Job-portal credentials (optional).</strong> If you choose to save sign-in credentials
              for a job portal, the password is encrypted before storage and is only decrypted on our server,
              on demand, and only after you explicitly confirm an autofill.
            </li>
            <li>
              <strong>Application activity.</strong> Records of applications you track, such as job title,
              company, portal, and status.
            </li>
          </ul>
        </Section>

        <Section title="How the browser extension uses your data">
          <p>
            The extension fills out job-application forms for you. When you trigger autofill on a supported
            job portal, it reads the form fields on that page and populates them with data from your AplicoCV
            profile. The extension:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>only acts on the page where you click &ldquo;Autofill&rdquo; or confirm a login;</li>
            <li>
              stores your sign-in token <strong>encrypted on your own device</strong> (AES-256-GCM) and never
              exposes it to the pages you visit;
            </li>
            <li>
              requests access only to the job-portal domains it supports, in order to fill those portals&rsquo;
              forms;
            </li>
            <li>contains no remote or dynamically loaded code &mdash; all logic ships inside the package.</li>
          </ul>
        </Section>

        <Section title="How we use your information">
          <p>We use your information solely to provide the Service, specifically to:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>structure your CV into a professional profile;</li>
            <li>autofill application and login forms when you ask the extension to;</li>
            <li>generate documents such as tailored CVs and cover letters at your request;</li>
            <li>track the applications you submit;</li>
            <li>operate, secure, and improve the Service.</li>
          </ul>
          <p>
            <strong>We do not sell your personal data, and we do not use it for advertising.</strong>
          </p>
        </Section>

        <Section title="How your data is protected">
          <ul className="list-disc space-y-2 pl-6">
            <li>Passwords for your AplicoCV account are stored only as salted hashes.</li>
            <li>
              Saved job-portal passwords are encrypted at rest with authenticated encryption and decrypted
              only transiently on the server when you confirm an autofill.
            </li>
            <li>Your extension sign-in token is encrypted on your device.</li>
            <li>All communication between the Service and our servers uses HTTPS.</li>
          </ul>
        </Section>

        <Section title="Third-party services">
          <p>
            To deliver the Service, your data may be processed by infrastructure and service providers acting
            on our behalf, including a cloud hosting provider, an object-storage provider for uploaded
            documents, an AI provider used to structure profiles and generate documents, a payment processor
            for subscriptions, and an email provider for transactional messages. These providers process data
            only to perform their function for us and are not permitted to use it for their own purposes.
          </p>
        </Section>

        <Section title="Data retention and deletion">
          <p>
            We keep your information for as long as your account is active. You can request deletion of your
            account and associated data at any time by contacting us at{' '}
            <a className="text-electric-600 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            . You may also remove saved portal credentials yourself from within the app at any time.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Depending on your location, you may have the right to access, correct, export, or delete your
            personal data, and to withdraw consent. To exercise any of these rights, contact us at{' '}
            <a className="text-electric-600 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="Children">
          <p>
            The Service is not directed to children under 16, and we do not knowingly collect personal data
            from them.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the
            &ldquo;Last updated&rdquo; date above. Significant changes will be communicated through the Service.
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            If you have questions about this Privacy Policy or how your data is handled, contact us at{' '}
            <a className="text-electric-600 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
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
