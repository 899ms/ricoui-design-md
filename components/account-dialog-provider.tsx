"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"
import {
  getBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/sync/supabase"
import {
  getAccountDisplayName,
  validateDisplayName,
} from "@/lib/account-profile"
interface AccountContextValue {
  configured: boolean
  user: User | null
  displayName: string
  authReady: boolean
  accountOpen: boolean
  openAccount: () => void
  closeAccount: () => void
  signOut: (localOnly?: boolean) => Promise<void>
  updateDisplayName: (name: string) => Promise<void>
}

const AccountContext = createContext<AccountContextValue | null>(null)

export function AccountDialogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const configured = isSupabaseConfigured()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(!configured)

  useEffect(() => {
    const client = getBrowserSupabaseClient()
    if (!client) return

    const restoreSession = async () => {
      try {
        // This state only selects the browser workspace; authorization still
        // happens server-side and through RLS. Reading the cached session here
        // avoids blocking every app start on a network getUser request and
        // prevents a late network failure from overwriting INITIAL_SESSION.
        const { data } = await client.auth.getSession()
        setUser(data.session?.user ?? null)
      } finally {
        setAuthReady(true)
      }
    }
    void restoreSession()
    const { data } = client.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
        setAuthReady(true)
      }
    )
    return () => data.subscription.unsubscribe()
  }, [])

  const openAccount = useCallback(() => {
    if (configured) setOpen(true)
  }, [configured])
  const closeAccount = useCallback(() => setOpen(false), [])
  const signOut = useCallback(async (localOnly = false) => {
    const client = getBrowserSupabaseClient()
    if (!client) return
    const { error } = await client.auth.signOut({
      scope: localOnly ? "local" : "global",
    })
    if (error) throw error
  }, [])
  const updateDisplayName = useCallback(async (name: string) => {
    const client = getBrowserSupabaseClient()
    if (!client) throw new Error("Supabase is not configured")
    const validation = validateDisplayName(name)
    if (!validation.valid) throw new Error("DISPLAY_NAME_TOO_LONG")
    const { data, error } = await client.auth.updateUser({
      data: { display_name: validation.value || null },
    })
    if (error) throw error
    setUser(data.user)
  }, [])
  const displayName = getAccountDisplayName(user)
  const value = useMemo(
    () => ({
      configured,
      user,
      displayName,
      authReady,
      accountOpen: open,
      openAccount,
      closeAccount,
      signOut,
      updateDisplayName,
    }),
    [
      authReady,
      closeAccount,
      configured,
      displayName,
      open,
      openAccount,
      signOut,
      updateDisplayName,
      user,
    ]
  )

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  )
}

export function useAccountDialog() {
  const value = useContext(AccountContext)
  if (!value)
    throw new Error(
      "useAccountDialog must be used within AccountDialogProvider"
    )
  return value
}
