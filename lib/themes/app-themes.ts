export const APP_THEMES = [
  {
    id: "default",
    label: "Default",
    tone: "light",
  },
  {
    id: "codex-dark",
    label: "Codex Dark",
    tone: "dark",
  },
] as const

export type AppThemeId = (typeof APP_THEMES)[number]["id"]

export const APP_THEME_IDS = APP_THEMES.map((theme) => theme.id)

export function isAppThemeId(theme: string | undefined): theme is AppThemeId {
  return APP_THEME_IDS.includes(theme as AppThemeId)
}

export function getNextAppTheme(theme: string | undefined): AppThemeId {
  const activeTheme = isAppThemeId(theme) ? theme : "default"
  const activeIndex = APP_THEMES.findIndex((item) => item.id === activeTheme)
  const nextIndex = (activeIndex + 1) % APP_THEMES.length

  return APP_THEMES[nextIndex]?.id ?? "default"
}

export function getAppThemeLabel(theme: string | undefined) {
  return APP_THEMES.find((item) => item.id === theme)?.label ?? "Default"
}
