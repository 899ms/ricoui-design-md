export const SUPPORTED_LOCALES = ["zh-CN", "en", "ja"] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-CN": "简体中文",
  en: "English",
  ja: "日本語",
}

// Chinese browsers use Simplified Chinese, Japanese browsers use Japanese,
// and every other browser language uses English. Keeping this fallback English
// also makes requests without an Accept-Language header predictable.
export const DEFAULT_LOCALE: Locale = "en"
export const APP_LOCALE_COOKIE = "design-md-locale"
export const LANGUAGE_PROMPT_STORAGE_KEY = "design-md-language-prompt-v1"

export function isLocale(value: unknown): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export function getAppLocale(value?: string | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export function detectSupportedBrowserLocale(
  languages: readonly string[] = []
): Locale {
  const language = languages[0]?.trim().toLowerCase()
  if (language === "zh" || language?.startsWith("zh-")) return "zh-CN"
  if (language === "ja" || language?.startsWith("ja-")) return "ja"
  return "en"
}

export function getLocaleFromAcceptLanguage(
  acceptLanguage?: string | null
): Locale {
  const preferredLanguage = acceptLanguage
    ?.split(",")
    .map((entry, index) => {
      const [language, ...parameters] = entry.trim().split(";")
      const quality = parameters.find((parameter) =>
        parameter.trim().startsWith("q=")
      )
      const parsedQuality = quality
        ? Number.parseFloat(quality.trim().slice(2))
        : 1

      return {
        language,
        index,
        quality: Number.isFinite(parsedQuality) ? parsedQuality : 0,
      }
    })
    .filter((entry) => entry.language && entry.quality > 0)
    .sort(
      (left, right) => right.quality - left.quality || left.index - right.index
    )
    .at(0)?.language

  return detectSupportedBrowserLocale(
    preferredLanguage ? [preferredLanguage] : []
  )
}

export function getSuggestedLocale(input: {
  browserLanguages: readonly string[]
  currentLocale: Locale
  hasExplicitLocale: boolean
  hasHandledPrompt: boolean
}): Locale | null {
  if (input.hasExplicitLocale || input.hasHandledPrompt) return null
  const detected = detectSupportedBrowserLocale(input.browserLanguages)
  return detected && detected !== input.currentLocale ? detected : null
}
