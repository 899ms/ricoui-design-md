"use client"

import { X } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

export interface FilterChip {
  key: string
  label: string
  onClear: () => void
}

/**
 * Compact active-filter chips (V7-PRD §8.3). These are views over existing
 * filter state — clearing a chip calls the same setter as the sidebar, never
 * creating a second source of truth.
 */
export function ActiveFilterChips({
  chips,
  onClearAll,
  className,
}: {
  chips: FilterChip[]
  onClearAll?: () => void
  className?: string
}) {
  const t = useTranslations("Gallery.filter")
  const common = useTranslations("Common")
  if (chips.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onClear}
            aria-label={t("clearOne", { label: chip.label })}
            className="text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {onClearAll && chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          {common("clearAll")}
        </button>
      )}
    </div>
  )
}
