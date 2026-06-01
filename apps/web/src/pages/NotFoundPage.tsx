import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-navy-50 px-6 text-center">
      <Logo />
      <p className="text-6xl font-extrabold text-navy-900">404</p>
      <p className="max-w-sm text-navy-500">
        We couldn’t find that page. It may have moved or never existed.
      </p>
      <Link to="/">
        <Button>Back home</Button>
      </Link>
    </div>
  )
}
