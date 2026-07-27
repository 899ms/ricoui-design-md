"use client"

import * as React from "react"
import { MonitorCog, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  APP_THEMES,
  getAppThemeLabel,
  getNextAppTheme,
  isAppThemeId,
} from "@/lib/themes/app-themes"

function subscribeToMounted(onStoreChange: () => void) {
  const id = window.setTimeout(onStoreChange, 0)

  return () => {
    window.clearTimeout(id)
  }
}

function useMounted() {
  return React.useSyncExternalStore(
    subscribeToMounted,
    () => true,
    () => false
  )
}

export function ThemeSwitcher() {
  const t = useTranslations("ThemeSwitcher")
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()
  const activeTheme = mounted && isAppThemeId(theme) ? theme : "default"
  const activeMeta =
    APP_THEMES.find((item) => item.id === activeTheme) ?? APP_THEMES[0]
  const nextTheme = getNextAppTheme(activeTheme)
  const nextLabel = getAppThemeLabel(nextTheme)
  const Icon = mounted ? (activeMeta.tone === "dark" ? Moon : Sun) : MonitorCog

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("switchTo", { theme: nextLabel })}
            onClick={() => setTheme(nextTheme)}
          />
        }
      >
        <Icon className="h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent>{t("switchTo", { theme: nextLabel })}</TooltipContent>
    </Tooltip>
  )
}
