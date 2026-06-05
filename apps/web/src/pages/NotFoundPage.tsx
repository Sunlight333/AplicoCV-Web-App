import { Link } from 'react-router-dom'
import type { Locale } from '@/i18n/dictionaries'
import { useCopy } from '@/i18n/useCopy'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'

const COPY: Record<Locale, { body: string; back: string }> = {
  en: { body: 'We couldn’t find that page. It may have moved or never existed.', back: 'Back home' },
  es: { body: 'No pudimos encontrar esa página. Puede que se haya movido o que nunca existiera.', back: 'Volver al inicio' },
  'pt-BR': { body: 'Não encontramos essa página. Ela pode ter sido movida ou nunca ter existido.', back: 'Voltar ao início' },
}

export default function NotFoundPage() {
  const c = useCopy(COPY)
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <p className="text-6xl font-extrabold text-navy-900">404</p>
      <p className="max-w-sm text-navy-500">{c.body}</p>
      <Link to="/">
        <Button>{c.back}</Button>
      </Link>
    </div>
  )
}
