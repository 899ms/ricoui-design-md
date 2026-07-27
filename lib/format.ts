import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"

/** Shared locale-aware relative-time formatting for application chrome. */
export function formatRelativeTime(
  timestamp: number,
  options?: { justNowLabel?: string; locale?: Locale }
): string {
  const locale = options?.locale ?? DEFAULT_LOCALE
  const justNowLabel =
    options?.justNowLabel ??
    (locale === "ja" ? "たった今" : locale === "en" ? "Just now" : "刚刚")
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "always" })
  const diffMs = Math.max(0, Date.now() - timestamp)
  const diffMinutes = Math.round(diffMs / (1000 * 60))
  if (diffMinutes < 1) return justNowLabel
  if (diffMinutes < 60) return relative.format(-diffMinutes, "minute")

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return relative.format(-diffHours, "hour")

  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return relative.format(-diffDays, "day")

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: diffDays > 365 ? "numeric" : undefined,
  }).format(timestamp)
}
