import { useEffect, useState } from 'react'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { useT } from '@/i18n/I18nProvider'

// Key-ready: set VITE_CHROME_STORE_URL once the listing is published; until then
// the button routes users to register/onboarding rather than a dead store URL.
const CHROME_STORE_URL = (import.meta.env.VITE_CHROME_STORE_URL as string | undefined) || ''
const STORE_READY = Boolean(CHROME_STORE_URL)

function isChrome() {
  const ua = navigator.userAgent
  return /Chrome/.test(ua) && !/Edg|OPR/.test(ua)
}

export default function ExtensionPage() {
  const t = useT()
  const te = t.app.extension
  const ti = t.app.more.install
  const chrome = isChrome()
  const [installed, setInstalled] = useState(false)

  // The extension announces installation to the page via postMessage; we mark
  // the final step complete in real time when that arrives.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.source === 'aplicocv-extension' && e.data?.type === 'installed') {
        setInstalled(true)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold text-navy-900">{te.title}</h1>
      <p className="mt-1 text-navy-500">{te.subtitle}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col items-start p-6">
          {chrome ? (
            <>
              <Badge tone="success">{te.chromeDetected}</Badge>
              <p className="mt-4 text-navy-600">{te.chromeBlurb}</p>
              {STORE_READY ? (
                <a href={CHROME_STORE_URL} target="_blank" rel="noreferrer" className="mt-5 inline-block">
                  <Button size="lg">{te.addToChrome}</Button>
                </a>
              ) : (
                <div className="mt-5">
                  <Button size="lg" disabled>
                    {te.addToChrome}
                  </Button>
                  <p className="mt-2 text-sm text-navy-400">Coming soon to the Chrome Web Store.</p>
                </div>
              )}
            </>
          ) : (
            <>
              <Badge tone="warning">{te.notSupported}</Badge>
              <p className="mt-4 text-navy-600">{te.notSupportedBlurb}</p>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-navy-900">{te.setupSteps}</h2>
          <ol className="mt-4 space-y-3">
            {te.steps.map((step, i) => {
              const done = installed && i === te.steps.length - 1
              return (
                <li key={step} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold',
                      done ? 'bg-green-500 text-white' : 'bg-navy-100 text-navy-500',
                    )}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className="text-sm text-navy-600">{step}</span>
                </li>
              )
            })}
          </ol>
          {installed && (
            <p className="mt-4 text-sm font-medium text-green-600">{te.connected}</p>
          )}
        </Card>
      </div>

      {/* Manual install (developer mode) — works today, before the store listing */}
      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-navy-900">{ti.manual}</h2>
          <a href="/aplicocv-extension.zip" download>
            <Button variant="secondary" size="sm">{ti.download}</Button>
          </a>
        </div>
        <ol className="mt-4 space-y-3">
          {[
            'Download and unzip the AplicoCV package above.',
            'Open chrome://extensions and turn on “Developer mode” (top-right).',
            'Click “Load unpacked” and select the unzipped folder.',
            'Pin AplicoCV, open it, and it connects to this account automatically.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-500">
                {i + 1}
              </span>
              <span className="text-sm text-navy-600">{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* CSS-animated three-frame walkthrough */}
      <Card className="mt-6 overflow-hidden p-6">
        <h2 className="font-semibold text-navy-900">{te.howTitle}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {te.frames.map(
            (frame, i) => (
              <div
                key={frame}
                className="rounded-xl border border-navy-100 bg-navy-50 p-5 text-center"
                style={{ animation: `pulse 2.4s ease-in-out ${i * 0.6}s infinite` }}
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-electric-500 text-lg font-bold text-white">
                  {i + 1}
                </div>
                <p className="mt-3 text-sm font-medium text-navy-700">{frame}</p>
              </div>
            ),
          )}
        </div>
      </Card>
    </PageTransition>
  )
}
