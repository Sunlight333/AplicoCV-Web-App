import { MarketingShell, MarketingSection } from '@/components/layout/MarketingShell'

const CONTACT = 'security@aplicocv.com'

export default function SecurityPage() {
  return (
    <MarketingShell
      eyebrow="Security"
      title="Security at AplicoCV"
      subtitle="How we protect your account, your CV, and the credentials you trust us with."
    >
      <MarketingSection title="Encryption everywhere">
        <ul className="list-disc space-y-2 pl-6">
          <li>All traffic between you and AplicoCV is encrypted in transit with HTTPS/TLS.</li>
          <li>Your AplicoCV account password is stored only as a salted hash — never in plain text.</li>
          <li>
            Saved job-portal passwords are encrypted at rest with authenticated encryption and decrypted only
            transiently, on our server, when you explicitly confirm an autofill.
          </li>
          <li>The extension stores your sign-in token encrypted on your own device (AES-256-GCM).</li>
        </ul>
      </MarketingSection>

      <MarketingSection title="Least-privilege extension">
        <p>
          The browser extension requests access only to the job-portal domains it supports, acts only on the
          page where you click “Autofill” or confirm a login, and contains no remote or dynamically loaded
          code — all logic ships inside the reviewed package.
        </p>
      </MarketingSection>

      <MarketingSection title="Data handling">
        <ul className="list-disc space-y-2 pl-6">
          <li>We never sell your personal data and never use it for advertising.</li>
          <li>Trusted sub-processors (hosting, storage, AI, payments, email) process data only to run the service.</li>
          <li>You can export or delete your account and all associated data at any time from your settings.</li>
        </ul>
      </MarketingSection>

      <MarketingSection title="Responsible disclosure">
        <p>
          We welcome reports from security researchers. If you believe you’ve found a vulnerability, please email{' '}
          <a className="text-electric-600 hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> with steps to
          reproduce. Please give us a reasonable window to remediate before any public disclosure, and avoid
          accessing or modifying other users’ data while testing.
        </p>
      </MarketingSection>

      <MarketingSection title="Questions">
        <p>
          For any security or privacy question, reach us at{' '}
          <a className="text-electric-600 hover:underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </MarketingSection>
    </MarketingShell>
  )
}
