"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Bot, BookOpen, Compass, Languages, ShieldCheck, X } from "lucide-react"
import { useAccountDialog } from "@/components/account-dialog-provider"
import { useAiSettingsDialog } from "@/components/ai-settings-dialog-provider"
import { LanguageSuggestionBar } from "@/components/language-suggestion-bar"
import { Button } from "@/components/ui/button"
import { AI_PROVIDERS } from "@/lib/ai/providers"
import { markLanguagePromptHandled, setAppLocale } from "@/lib/i18n/client"
import { LOCALE_LABELS, type Locale } from "@/lib/i18n/config"
import {
  hasCompletedFirstVisitWelcome,
  isFirstVisitWelcomeForced,
  markFirstVisitExperienceCompleted,
  shouldShowFirstVisitWelcome,
} from "@/lib/onboarding/first-visit"
import { useDesignStore } from "@/lib/store/design-store"
import { cn } from "@/lib/utils"

function subscribeToFirstVisitStorage(onStoreChange: () => void) {
  const timeout = window.setTimeout(onStoreChange, 0)
  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea === window.localStorage) onStoreChange()
  }
  window.addEventListener("storage", handleStorage)
  return () => {
    window.clearTimeout(timeout)
    window.removeEventListener("storage", handleStorage)
  }
}

export function FirstVisitExperience() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, authReady } = useAccountDialog()
  const workspaceReady = useDesignStore((state) => state.hasHydrated)
  const documentCount = useDesignStore((state) => state.documents.length)
  const libraryCount = useDesignStore((state) => state.libraryEntries.length)
  const completed = useSyncExternalStore(
    subscribeToFirstVisitStorage,
    hasCompletedFirstVisitWelcome,
    () => true
  )
  const [dismissed, setDismissed] = useState(false)
  const wasVisible = useRef(false)
  const forceWelcome = isFirstVisitWelcomeForced(searchParams.get("welcome"))

  const showWelcome =
    !dismissed &&
    (forceWelcome ||
      shouldShowFirstVisitWelcome({
        pathname,
        accountReady: authReady,
        workspaceReady,
        signedIn: Boolean(user),
        documentCount,
        libraryCount,
        completed,
      }))

  const complete = useCallback(() => {
    markFirstVisitExperienceCompleted()
    setDismissed(true)
  }, [])

  useEffect(() => {
    if (wasVisible.current && !showWelcome) {
      markFirstVisitExperienceCompleted()
    }
    wasVisible.current = showWelcome
  }, [showWelcome])

  if (!authReady || !workspaceReady) return null

  return (
    <>
      {showWelcome ? (
        <FirstVisitWelcomeCard onComplete={complete} />
      ) : (
        <LanguageSuggestionBar />
      )}
    </>
  )
}

function FirstVisitWelcomeCard({ onComplete }: { onComplete: () => void }) {
  const t = useTranslations("FirstVisit")
  const locale = useLocale() as Locale
  const router = useRouter()
  const openAiSettings = useAiSettingsDialog()
  const [pending, startTransition] = useTransition()
  const providerLabels = useMemo(
    () =>
      AI_PROVIDERS.filter((provider) => provider.id !== "custom")
        .map((provider) => provider.label)
        .join(" · "),
    []
  )

  const selectLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return
    setAppLocale(nextLocale)
    markLanguagePromptHandled()
    startTransition(() => router.refresh())
  }

  const configureAi = () => {
    onComplete()
    openAiSettings("ai")
  }

  const openGuide = () => {
    onComplete()
    router.push("/guide#tutorials")
  }

  return (
    <aside
      role="region"
      aria-label={t("regionLabel")}
      className="app-chrome fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[70] w-[calc(100vw-2rem)] max-w-[390px] rounded-xl border border-border/75 bg-popover/96 p-4 text-popover-foreground shadow-[var(--shadow-lg)] backdrop-blur-xl md:right-5 md:bottom-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Compass className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight">
            {t("title")}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onComplete}
          aria-label={t("dismiss")}
          title={t("dismiss")}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <p className="mt-3 text-[13px] leading-5 text-muted-foreground">
        {t("description")}
      </p>

      <div className="mt-3 rounded-lg border border-border/60 bg-muted/35 p-3">
        <p className="flex items-center gap-2 text-xs font-medium">
          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          {t("localFirst")}
        </p>
        <p className="mt-2 flex items-start gap-2 text-[11px] leading-4 text-muted-foreground">
          <Bot className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>{t("providers", { providers: providerLabels })}</span>
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button size="sm" onClick={configureAi}>
          <Bot className="size-3.5" />
          {t("configureAi")}
        </Button>
        <Button variant="outline" size="sm" onClick={openGuide}>
          <BookOpen className="size-3.5" />
          {t("openGuide")}
        </Button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Languages className="size-3.5" />
          {t("language")}
        </span>
        <div className="flex items-center rounded-md border border-border/70 bg-background/60 p-0.5">
          {(["zh-CN", "en", "ja"] as const).map((item) => (
            <button
              key={item}
              type="button"
              disabled={pending}
              onClick={() => selectLocale(item)}
              className={cn(
                "rounded-sm px-2 py-1 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:outline-none disabled:opacity-50",
                item === locale
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={item === locale}
            >
              {LOCALE_LABELS[item]}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
