import type { ParseStatus } from "@/lib/types/tokens"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"

export interface ParseStatusBadge {
  label: string
  className: string
}

/**
 * Shared parse-status badge meta, unified from three divergent copies.
 * `plain` = bordered text badge (sidebar / document card);
 * `tinted` = filled badge with longer labels (dashboard).
 * Returns null for "valid" — a healthy document shows no badge.
 */
export function getParseStatusBadge(
  status: ParseStatus,
  variant: "plain" | "tinted" = "plain",
  locale: Locale = DEFAULT_LOCALE
): ParseStatusBadge | null {
  if (status === "valid") return null

  if (variant === "tinted") {
    switch (status) {
      case "degraded":
        return {
          label:
            locale === "ja"
              ? "プレビューを簡易表示中"
              : locale === "en"
                ? "Preview fallback"
                : "预览降级",
          className: "border-amber-200 bg-amber-50 text-amber-700",
        }
      case "invalid":
        return {
          label:
            locale === "ja"
              ? "要確認"
              : locale === "en"
                ? "Needs attention"
                : "有问题",
          className: "border-rose-200 bg-rose-50 text-rose-700",
        }
      default:
        return {
          label: locale === "ja" ? "待機中" : locale === "en" ? "Idle" : "空闲",
          className: "border-border bg-muted/30 text-muted-foreground",
        }
    }
  }

  switch (status) {
    case "degraded":
      return {
        label:
          locale === "ja" ? "簡易表示" : locale === "en" ? "Fallback" : "降级",
        className: "border-amber-200 text-amber-700",
      }
    case "invalid":
      return {
        label: locale === "ja" ? "問題" : locale === "en" ? "Issue" : "问题",
        className: "border-rose-200 text-rose-700",
      }
    default:
      return {
        label: locale === "ja" ? "待機中" : locale === "en" ? "Idle" : "空闲",
        className: "border-border text-muted-foreground",
      }
  }
}
