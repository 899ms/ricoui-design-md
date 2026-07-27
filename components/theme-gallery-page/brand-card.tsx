"use client"

import { useTranslations } from "next-intl"
import { BookmarkPlus, Eye, Heart, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { UnifiedThemeEntry } from "./theme-gallery-page"
import { BrandLogo } from "./brand-logo"
import { BrandMedia } from "./brand-media"

interface BrandCardProps {
  entry: UnifiedThemeEntry
  favorited?: boolean
  isSelected?: boolean
  onToggleFavorite?: () => void
  onSelect?: () => void
  onOpen?: () => void
  onUse?: () => void
  onSaveToLibrary?: () => void
}

/**
 * Dedicated Brand reference card (V6 §5.1). Brands no longer reuse the generic
 * ThemeCard: the hero surface is a 16:9 media area (`cover.png` / `preview.mp4`
 * / placeholder), and the color list collapses into a compact swatch module
 * near the bottom instead of acting as the main visual strip.
 *
 * Library entries keep using `ThemeCard` — this component is brand-only.
 */
export function BrandCard({
  entry,
  favorited = false,
  isSelected = false,
  onToggleFavorite,
  onSelect,
  onOpen,
  onUse,
  onSaveToLibrary,
}: BrandCardProps) {
  const t = useTranslations("Gallery.card")
  const common = useTranslations("Common")
  const { previewColors } = entry
  const visibleTags = entry.tags.slice(0, 3)
  const extraTagCount = Math.max(0, entry.tags.length - visibleTags.length)

  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!onSelect) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md border bg-card",
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "shadow-[0_1px_0_rgba(15,23,42,0.02),0_1px_2px_rgba(15,23,42,0.04)]",
        onSelect && "cursor-pointer",
        isSelected
          ? "border-foreground/60 shadow-[0_2px_0_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.18)]"
          : "border-border/60 hover:-translate-y-px hover:border-border hover:shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_24px_-16px_rgba(15,23,42,0.18)]"
      )}
    >
      <div className="relative">
        <BrandMedia
          imageUrl={entry.imageUrl}
          videoUrl={entry.videoUrl}
          name={entry.name}
          variant="card"
          videoMode="image-click"
        />
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggleFavorite()
            }}
            title={favorited ? common("removeFavorite") : common("addFavorite")}
            aria-label={
              favorited ? common("removeFavorite") : common("addFavorite")
            }
            aria-pressed={favorited}
            className={cn(
              "absolute top-2.5 left-2.5 grid h-7 w-7 place-items-center rounded-sm bg-background/15 shadow-sm backdrop-blur-sm transition-colors hover:bg-background",
              favorited
                ? "text-rose-500"
                : "text-foreground/55 hover:text-foreground"
            )}
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 text-white/75",
                favorited && "fill-rose-500 text-rose-500"
              )}
            />
          </button>
        )}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          {entry.themeMode && (
            <span className="inline-flex items-center rounded-sm bg-background/85 px-2 py-0.5 text-[10px] font-medium tracking-wide text-foreground capitalize shadow-sm backdrop-blur-sm">
              {entry.themeMode === "light" ? common("light") : common("dark")}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <BrandLogo faviconUrl={entry.faviconUrl} name={entry.name} />
            <h3 className="truncate text-[15px] leading-tight font-semibold tracking-[-0.01em]">
              {entry.name}
            </h3>
          </div>
          <p className="mt-2 line-clamp-2 text-[12px] leading-[1.55] text-muted-foreground">
            {entry.description}
          </p>
        </div>

        {(entry.category || entry.tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
            {entry.category && (
              <>
                <span className="font-medium text-foreground/80">
                  {entry.category}
                </span>
                {entry.tags.length > 0 && (
                  <span className="text-border" aria-hidden>
                    ·
                  </span>
                )}
              </>
            )}
            {visibleTags.map((tag, index) => (
              <span key={tag} className="inline-flex items-center gap-1.5">
                <span>{tag}</span>
                {index < visibleTags.length - 1 && (
                  <span className="text-border" aria-hidden>
                    ·
                  </span>
                )}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="text-muted-foreground/70">+{extraTagCount}</span>
            )}
          </div>
        )}

        {previewColors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {previewColors.slice(0, 6).map((color, index) => (
              <span
                key={`${color}-${index}`}
                className="h-4 w-4 rounded-full ring-1 ring-black/10 ring-inset"
                style={{ backgroundColor: color }}
                aria-hidden
              />
            ))}
            {previewColors.length > 6 && (
              <span className="text-[10px] text-muted-foreground/70">
                +{previewColors.length - 6}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1">
          {onOpen && (
            <Button
              size="sm"
              className="h-8 flex-1"
              onClick={(event) => {
                event.stopPropagation()
                onOpen()
              }}
              title={t("viewTitle")}
            >
              <Eye className="h-3.5 w-3.5" />
              {common("view")}
            </Button>
          )}
          {onUse && (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={(event) => {
                event.stopPropagation()
                onUse()
              }}
              title={t("useTitle")}
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("useTemplate")}
            </Button>
          )}
          {onSaveToLibrary && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8"
              onClick={(event) => {
                event.stopPropagation()
                onSaveToLibrary()
              }}
              title={t("saveTitle")}
              aria-label={t("saveTitle")}
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
