import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@/types'
import * as authService from '@/services/auth'

interface AuthContextValue {
  user: User | null
  /** True while the initial silent-refresh bootstrap is in flight. */
  initializing: boolean
  login: (email: string, password: string) => Promise<User>
  register: (fullName: string, email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  /** Replace the cached user after a profile/preferences/onboarding change. */
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  // Silent session restore on mount: the access token lives in memory, so a
  // reload always starts here before any protected route renders.
  useEffect(() => {
    let cancelled = false
    authService
      .bootstrapSession()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      login: async (email, password) => {
        const u = await authService.login({ email, password })
        setUser(u)
        return u
      },
      register: async (fullName, email, password) => {
        const u = await authService.register({ fullName, email, password })
        setUser(u)
        return u
      },
      logout: async () => {
        await authService.logout()
        setUser(null)
      },
      setUser,
    }),
    [user, initializing],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
