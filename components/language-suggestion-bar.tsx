"use client"

import { useState, useSyncExternalStore, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSuggestedLocale, type Locale } from "@/lib/i18n/config"
import {
  hasHandledLanguagePrompt,
  markLanguagePromptHandled,
  readAppLocale,
  setAppLocale,
} from "@/lib/i18n/client"

const SUGGESTION_COPY: Record<
  Locale,
  { message: string; accept: string; keep: string; label: string }
> = {
  en: {
    message: "Use Design.md Editor in English?",
    accept: "Switch to English",
    keep: "Keep 中文",
    label: "Language suggestion",
  },
  "zh-CN": {
    message: "浏览器偏好为简体中文，是否切换？",
    accept: "切换到简体中文",
    keep: "保留 English",
    label: "语言建议",
  },
  ja: {
    message: "Design.md Editor を日本語で使用しますか？",
    accept: "日本語に切り替える",
    keep: "English のまま",
    label: "言語の提案",
  },
}

function subscribeToBrowserLanguage(onStoreChange: () => void) {
  const id = window.setTimeout(onStoreChange, 0)
  return () => window.clearTimeout(id)
}

export function LanguageSuggestionBar() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  const [pending, startTransition] = useTransition()
  const browserSuggestion = useSyncExternalStore(
    subscribeToBrowserLanguage,
    () =>
      getSuggestedLocale({
        browserLanguages: navigator.languages,
        currentLocale: locale,
        hasExplicitLocale: readAppLocale() !== null,
        hasHandledPrompt: hasHandledLanguagePrompt(),
      }),
    () => null
  )
  const suggestedLocale = dismissed ? null : browserSuggestion

  if (!suggestedLocale) return null

  const copy = SUGGESTION_COPY[suggestedLocale]
  const dismiss = () => {
    markLanguagePromptHandled()
    setDismissed(true)
  }
  const accept = () => {
    setAppLocale(suggestedLocale)
    markLanguagePromptHandled()
    setDismissed(true)
    startTransition(() => router.refresh())
  }

  return (
    <div
      role="region"
      aria-label={copy.label}
      className="app-chrome flex min-h-11 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/60 bg-primary/[0.055] px-3 py-2 sm:px-5"
    >
      <Languages className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-xs font-medium text-foreground">
        {copy.message}
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button variant="ghost" size="xs" disabled={pending} onClick={dismiss}>
          {copy.keep}
        </Button>
        <Button size="xs" disabled={pending} onClick={accept}>
          {copy.accept}
        </Button>
      </div>
    </div>
  )
}
