"use client"

import {
  APP_LOCALE_COOKIE,
  LANGUAGE_PROMPT_STORAGE_KEY,
  isLocale,
  type Locale,
} from "@/lib/i18n/config"

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function readAppLocale(): Locale | null {
  if (typeof document === "undefined") return null
  try {
    const prefix = `${APP_LOCALE_COOKIE}=`
    const value = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(prefix))
      ?.slice(prefix.length)
    return isLocale(value) ? value : null
  } catch {
    return null
  }
}

export function setAppLocale(locale: Locale) {
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${APP_LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`
}

export function hasHandledLanguagePrompt() {
  if (typeof window === "undefined") return false
  try {
    return (
      window.localStorage.getItem(LANGUAGE_PROMPT_STORAGE_KEY) === "handled"
    )
  } catch {
    return false
  }
}

export function markLanguagePromptHandled() {
  try {
    window.localStorage.setItem(LANGUAGE_PROMPT_STORAGE_KEY, "handled")
  } catch {
    // The locale cookie still prevents repeat prompts when storage is blocked.
  }
}
