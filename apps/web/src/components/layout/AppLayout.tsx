import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { getCredits } from '@/services/credits'
import { Logo } from '@/components/Logo'
import { Badge } from '@/components/ui/Badge'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { cn } from '@/lib/cn'
import { useToast } from '@/components/Toast'
import { useT } from '@/i18n/I18nProvider'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { TrialModal } from '@/components/TrialModal'

const navIcons = {
  dashboard: 'M3 12l9-9 9 9M5 10v10h14V10',
  profile: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0',
  applications: 'M4 6h16M4 12h16M4 18h10',
  aiTools: 'M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4zM5 17l.8 2 .8-2 2-.8-2-.8L5.8 14l-.8 2-2 .8z',
  rewards: 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 21l-4.9-2.8.9-5.5-4-3.9 5.5-.8z',
  faq: 'M12 18h.01M9.1 9a3 3 0 015.8 1c0 2-3 2-3 4M4 5h16v12H7l-3 3z',
  optimize: 'M5 19l7-7 3 3 6-6M14 6h5v5',
  documents: 'M7 3h7l5 5v13H7zM14 3v5h5',
  extension: 'M4 4h16v16H4zM9 9h6v6H9z',
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const t = useT()
  const [search, setSearch] = useState('')
  const credits = useQuery({ queryKey: ['credits'], queryFn: getCredits })

  // Global search routes to the applications board with a debounced ?search=.
  const runSearch = useDebouncedCallback((q: string) => {
    navigate(q.trim() ? `/applications?search=${encodeURIComponent(q.trim())}` : '/applications')
  }, 350)

  const navItems = [
    { to: '/dashboard', label: t.app.nav.dashboard, icon: navIcons.dashboard },
    { to: '/profile', label: t.app.nav.profile, icon: navIcons.profile },
    { to: '/applications', label: t.app.nav.applications, icon: navIcons.applications },
    { to: '/ai-tools', label: t.app.nav.aiTools, icon: navIcons.aiTools },
    { to: '/optimize', label: 'Optimize CV', icon: navIcons.optimize },
    { to: '/documents', label: 'Documents', icon: navIcons.documents },
    { to: '/rewards', label: 'Rewards', icon: navIcons.rewards },
    { to: '/faq', label: 'Questions', icon: navIcons.faq },
    { to: '/extension', label: t.app.nav.extension, icon: navIcons.extension },
  ]
  const settingsItems = [
    { to: '/settings/account', label: 'Account' },
    { to: '/settings/credentials', label: t.app.nav.credentials },
    { to: '/settings/billing', label: t.app.nav.billing },
  ]

  const handleLogout = async () => {
    await logout()
    toast(t.app.nav.signedOut)
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-electric-50 text-electric-700' : 'text-navy-500 hover:bg-navy-100 hover:text-navy-800',
    )

  return (
    <div className="flex min-h-screen bg-navy-50">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-navy-100 bg-white px-4 py-5 lg:flex">
        <NavLink to="/dashboard" className="px-2">
          <Logo />
        </NavLink>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              <NavIcon d={item.icon} />
              {item.label}
            </NavLink>
          ))}
          <p className="mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-navy-300">
            {t.app.nav.settings}
          </p>
          {settingsItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              <span className="w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-navy-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <NavIcon d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          {t.app.nav.signOut}
        </button>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-navy-100 bg-white/80 px-5 backdrop-blur">
          <div className="relative flex-1 max-w-md">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                runSearch(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch.flush(search)
              }}
              placeholder={t.app.nav.search}
              className="h-10 w-full rounded-lg border border-navy-200 bg-navy-50 pl-9 pr-3 text-sm placeholder:text-navy-300 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-400/40"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <NavLink
              to="/rewards"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105"
              title="Rewards & credits"
            >
              <span>✦</span>
              <span className="tabular-nums">{credits.data?.balance ?? '–'}</span>
            </NavLink>
            <LanguageSwitcher />
            <span className="hidden h-6 w-px bg-navy-100 sm:block" />
            <Badge tone={user?.premiumActive ? 'info' : 'neutral'}>
              {user?.plan === 'premium'
                ? t.app.nav.premium
                : user?.onTrial
                  ? 'Trial'
                  : t.app.nav.free}
            </Badge>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="hidden text-sm font-medium text-navy-700 sm:block">
                {user?.fullName}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
      <TrialModal />
    </div>
  )
}
