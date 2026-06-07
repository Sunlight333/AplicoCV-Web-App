import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthContext'
import { getCredits } from '@/services/credits'
import { Logo } from '@/components/Logo'
import { Badge } from '@/components/ui/Badge'
import { Icon, type IconName } from '@/components/ui/Icon'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { cn } from '@/lib/cn'
import { useToast } from '@/components/Toast'
import { useT } from '@/i18n/I18nProvider'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { TrialModal } from '@/components/TrialModal'

interface NavItem {
  to: string
  label: string
  icon: IconName
}

/** A sidebar row whose icon sits in a soft tile, promoted to a gradient tile when active. */
function NavRow({ to, label, icon }: NavItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-electric-50/80' : 'hover:bg-navy-100/60',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'relative flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-all',
              isActive
                ? 'sheen-top bg-brand-gradient text-white shadow-tile'
                : 'bg-navy-50 text-navy-400 group-hover:bg-navy-100 group-hover:text-navy-700',
            )}
          >
            <Icon name={icon} className="h-[18px] w-[18px]" strokeWidth={isActive ? 1.95 : 1.75} />
          </span>
          <span className={isActive ? 'text-navy-900' : 'text-navy-500 group-hover:text-navy-800'}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const t = useT()
  const [search, setSearch] = useState('')
  const credits = useQuery({ queryKey: ['credits'], queryFn: getCredits })

  const runSearch = useDebouncedCallback((q: string) => {
    navigate(q.trim() ? `/applications?search=${encodeURIComponent(q.trim())}` : '/applications')
  }, 350)

  const tm = t.app.more.nav
  const navItems: NavItem[] = [
    { to: '/dashboard', label: t.app.nav.dashboard, icon: 'dashboard' },
    { to: '/profile', label: t.app.nav.profile, icon: 'user' },
    { to: '/preferences', label: t.app.nav.preferences, icon: 'target' },
    { to: '/applications', label: t.app.nav.applications, icon: 'applications' },
    { to: '/ai-tools', label: t.app.nav.aiTools, icon: 'sparkles' },
    { to: '/optimize', label: tm.optimize, icon: 'optimize' },
    { to: '/interview', label: tm.interview, icon: 'interview' },
    { to: '/ats', label: tm.ats, icon: 'ats' },
    { to: '/analyze', label: 'Job analyzer', icon: 'target' },
    { to: '/market', label: 'Market', icon: 'trending' },
    { to: '/documents', label: tm.documents, icon: 'document' },
    { to: '/rewards', label: tm.rewards, icon: 'gift' },
    { to: '/referrals', label: tm.referrals, icon: 'referrals' },
    { to: '/faq', label: tm.questions, icon: 'help' },
    { to: '/extension', label: t.app.nav.extension, icon: 'extension' },
  ]
  const resourceItems: NavItem[] = [
    { to: '/guide', label: tm.guide, icon: 'book' },
    { to: '/portals', label: tm.portals, icon: 'grid' },
  ]
  const settingsItems: NavItem[] = [
    { to: '/settings/account', label: tm.account, icon: 'settings' },
    { to: '/settings/credentials', label: t.app.nav.credentials, icon: 'key' },
    { to: '/settings/billing', label: tm.plans, icon: 'card' },
  ]

  const handleLogout = async () => {
    await logout()
    toast(t.app.nav.signedOut)
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-navy-100/70 bg-white/80 px-4 py-5 backdrop-blur-xl lg:flex">
        <NavLink to="/dashboard" className="px-2">
          <Logo />
        </NavLink>
        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {navItems.map((item) => (
            <NavRow key={item.to} {...item} />
          ))}
          <p className="mb-1 mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-navy-300">
            {tm.guide}
          </p>
          {resourceItems.map((item) => (
            <NavRow key={item.to} {...item} />
          ))}
          <p className="mb-1 mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-navy-300">
            {t.app.nav.settings}
          </p>
          {settingsItems.map((item) => (
            <NavRow key={item.to} {...item} />
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="group mt-3 flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-navy-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-navy-50 text-navy-400 transition-colors group-hover:bg-red-100 group-hover:text-red-600">
            <Icon name="logout" className="h-[18px] w-[18px]" />
          </span>
          {t.app.nav.signOut}
        </button>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-nav sticky top-0 z-30 flex h-16 items-center gap-4 px-5">
          <div className="relative max-w-md flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
            />
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
              className="h-10 w-full rounded-xl border border-navy-200/70 bg-navy-50/60 pl-9 pr-3 text-sm shadow-[inset_0_1px_2px_rgba(11,20,38,0.05)] placeholder:text-navy-300 focus:border-electric-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-400/40"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <NavLink
              to="/rewards"
              className="sheen-top relative inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-3.5 py-2 text-sm font-semibold text-white shadow-tile transition-transform hover:-translate-y-0.5"
              title="Rewards & credits"
            >
              <Icon name="star" className="h-4 w-4" strokeWidth={2} />
              <span className="tabular-nums">{credits.data?.balance ?? '–'}</span>
            </NavLink>
            <NavLink
              to="/"
              title={t.app.nav.backToSite ?? 'Back to site'}
              className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-800 sm:flex"
            >
              <Icon name="globe" className="h-4 w-4" />
              {t.app.nav.backToSite ?? 'Back to site'}
            </NavLink>
            <LanguageSwitcher />
            <span className="hidden h-6 w-px bg-navy-100 sm:block" />
            <Badge tone={user?.premiumActive ? 'info' : 'neutral'}>
              {user?.plan === 'premium' ? t.app.nav.premium : user?.onTrial ? 'Trial' : t.app.nav.free}
            </Badge>
            <div className="flex items-center gap-2">
              <div className="sheen-top relative flex h-9 w-9 items-center justify-center rounded-full bg-btn-navy text-sm font-semibold text-white shadow-btn-dark">
                {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="hidden text-sm font-medium text-navy-700 sm:block">{user?.fullName}</span>
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
