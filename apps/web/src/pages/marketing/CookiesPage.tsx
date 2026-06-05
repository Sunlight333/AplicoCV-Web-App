import { Link } from 'react-router-dom'
import { MarketingShell, MarketingSection } from '@/components/layout/MarketingShell'

const EFFECTIVE_DATE = 'June 5, 2026'

export default function CookiesPage() {
  return (
    <MarketingShell
      eyebrow="Legal"
      title="Cookie Policy"
      subtitle={`Last updated: ${EFFECTIVE_DATE}`}
    >
      <MarketingSection title="What we use">
        <p>
          AplicoCV uses a minimal set of cookies and similar local-storage technologies to run the service. We
          do <strong>not</strong> use advertising or cross-site tracking cookies.
        </p>
      </MarketingSection>

      <MarketingSection title="Categories">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Strictly necessary.</strong> Keep you signed in and protect against cross-site request
            forgery. The service cannot function without these.
          </li>
          <li>
            <strong>Preferences.</strong> Remember choices such as your language so the app loads the way you
            left it. These live in your browser’s local storage.
          </li>
          <li>
            <strong>Aggregate analytics (optional).</strong> If enabled, privacy-respecting, aggregated usage
            metrics help us understand which features to improve. They do not identify you personally.
          </li>
        </ul>
      </MarketingSection>

      <MarketingSection title="The browser extension">
        <p>
          The extension stores your encrypted sign-in token and your preferences locally on your device using
          the browser’s extension storage. It does not set tracking cookies on the sites you visit.
        </p>
      </MarketingSection>

      <MarketingSection title="Managing cookies">
        <p>
          You can clear or block cookies in your browser settings at any time; note that blocking strictly
          necessary cookies will sign you out and prevent the app from working. You can also sign out from
          within AplicoCV to clear your session.
        </p>
      </MarketingSection>

      <MarketingSection title="More information">
        <p>
          For how we handle your data overall, see our{' '}
          <Link className="text-electric-600 hover:underline" to="/privacy">Privacy Policy</Link>. Questions?
          Email <a className="text-electric-600 hover:underline" href="mailto:support@aplicocv.com">support@aplicocv.com</a>.
        </p>
      </MarketingSection>
    </MarketingShell>
  )
}
