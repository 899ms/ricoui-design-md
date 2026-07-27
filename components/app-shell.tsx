"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useLocale } from "next-intl"
import { AppRail } from "@/components/app-rail"
import { MobileBottomNav, MobileTopBar } from "@/components/mobile-nav"
import { GlobalSearchDialog } from "@/components/search/global-search-dialog"
import { Toaster } from "@/components/ui/toaster"
import { AiSettingsDialogProvider } from "@/components/ai-settings-dialog-provider"
import { AccountDialogProvider } from "@/components/account-dialog-provider"
import { useAccountDialog } from "@/components/account-dialog-provider"
import { AccountDialog } from "@/components/account-dialog"
import {
  CloudSyncProvider,
  useCloudSync,
} from "@/components/cloud-sync-provider"
import { LocalToCloudCopyDialog } from "@/components/local-to-cloud-copy-dialog"
import { FirstVisitExperience } from "@/components/first-visit-experience"
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"
import { WorkspaceTransitionScreen } from "@/components/workspace-transition-screen"
import { useUiPreferences } from "@/lib/store/ui-preferences"
import { shouldOpenGlobalSearch } from "@/lib/search/global-search-shortcut"
import { preloadMessages } from "@/lib/i18n/messages"
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config"

function AccountDialogLayer() {
  const { configured, accountOpen, closeAccount, user } = useAccountDialog()
  const { workspaceInteractive } = useCloudSync()
  if (!configured) return null
  // Keying on the user id remounts the dialog on sign-in / sign-out so the
  // per-account local-copy "hidden" flag is re-read from storage for the new
  // account instead of carrying the previous account's value forward.
  return (
    <AccountDialog
      key={user?.id ?? "anonymous"}
      open={accountOpen && workspaceInteractive}
      onClose={closeAccount}
    />
  )
}

function WorkspaceContentLayer({ children }: { children: ReactNode }) {
  const { user } = useAccountDialog()
  const {
    workspaceInteractive,
    workspacePhase,
    workspaceError,
    retryWorkspaceTransition,
    signOut,
  } = useCloudSync()

  if (workspaceInteractive) return children
  if (workspacePhase !== "cloud-error") return <PageLoadingSkeleton />

  return (
    <WorkspaceTransitionScreen
      phase={workspacePhase}
      error={workspaceError}
      onRetry={retryWorkspaceTransition}
      onRestoreLocal={() => void signOut(true)}
      canRestoreLocal={Boolean(user)}
    />
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const locale = useLocale() as Locale
  const [searchOpen, setSearchOpen] = useState(false)
  const searchTriggerRef = useRef<HTMLElement | null>(null)

  const openSearch = useCallback(() => {
    searchTriggerRef.current = document.activeElement as HTMLElement | null
    setSearchOpen(true)
  }, [])

  const setSearchOpenWithFocusRestore = useCallback((open: boolean) => {
    setSearchOpen(open)
    if (!open) {
      window.requestAnimationFrame(() => searchTriggerRef.current?.focus())
    }
  }, [])

  // Rehydrate layout prefs on the client only, so the first client render
  // matches the SSR defaults and avoids hydration mismatches.
  useEffect(() => {
    useUiPreferences.persist.rehydrate()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void Promise.all(
        SUPPORTED_LOCALES.filter((item) => item !== locale).map((item) =>
          preloadMessages(item)
        )
      )
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [locale])

  useEffect(() => {
    const handleGlobalSearchShortcut = (event: KeyboardEvent) => {
      if (!shouldOpenGlobalSearch(event)) return

      event.preventDefault()
      if (!searchOpen) openSearch()
    }
    window.addEventListener("keydown", handleGlobalSearchShortcut)
    return () =>
      window.removeEventListener("keydown", handleGlobalSearchShortcut)
  }, [openSearch, searchOpen])

  return (
    <AccountDialogProvider>
      <AiSettingsDialogProvider>
        <CloudSyncProvider>
          <AccountDialogLayer />
          <LocalToCloudCopyDialog />
          <div className="app-bg flex h-svh bg-background">
            {/* Desktop: left global navigation rail */}
            <div className="hidden md:flex">
              <AppRail onOpenSearch={openSearch} />
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <FirstVisitExperience />

              {/* Mobile: slim top bar */}
              <div className="md:hidden">
                <MobileTopBar onOpenSearch={openSearch} />
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <WorkspaceContentLayer>{children}</WorkspaceContentLayer>
              </div>

              {/* Mobile: bottom tab navigation */}
              <div className="md:hidden">
                <MobileBottomNav />
              </div>
            </div>

            <GlobalSearchDialog
              open={searchOpen}
              onOpenChange={setSearchOpenWithFocusRestore}
            />
            <Toaster />
          </div>
        </CloudSyncProvider>
      </AiSettingsDialogProvider>
    </AccountDialogProvider>
  )
}
