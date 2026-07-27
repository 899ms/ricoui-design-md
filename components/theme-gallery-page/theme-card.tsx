"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Eye,
  Heart,
  MoreHorizontal,
  Palette,
  Pencil,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getLibraryCardCapabilityBadge } from "@/lib/document-capability"
import type { UnifiedThemeEntry } from "./theme-gallery-page"

interface ThemeCardProps {
  entry: UnifiedThemeEntry
  favorited?: boolean
  onToggleFavorite?: () => void
  onOpen?: () => void
  onEdit?: () => void
  onUse?: () => void
  onEditMetadata?: () => void
  onDelete?: () => void
  isSelected?: boolean
  onSelect?: () => void
  selectionMode?: boolean
  selectionSelected?: boolean
}

function formatAddedDate(timestamp: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(timestamp)
}

export function ThemeCard({
  entry,
  favorited = false,
  onToggleFavorite,
  onOpen,
  onEdit,
  onUse,
  onEditMetadata,
  onDelete,
  isSelected = false,
  onSelect,
  selectionMode = false,
  selectionSelected = false,
}: ThemeCardProps) {
  const t = useTranslations("Gallery.card")
  const common = useTranslations("Common")
  const locale = useLocale()
  const [menuOpen, setMenuOpen] = useState(false)
  const { previewColors } = entry
  const visibleTags = entry.tags.slice(0, 3)
  const extraTagCount = Math.max(0, entry.tags.length - visibleTags.length)
  const hasMenu = onEditMetadata || onDelete
  const capabilityBadge = getLibraryCardCapabilityBadge(entry.capability)

  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={selectionMode ? selectionSelected : undefined}
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
        isSelected || selectionSelected
          ? "border-foreground/60 shadow-[0_2px_0_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.18)]"
          : "border-border/60 hover:-translate-y-px hover:border-border hover:shadow-[0_1px_0_rgba(15,23,42,0.03),0_8px_24px_-16px_rgba(15,23,42,0.18)]"
      )}
    >
      <div className="relative h-14 w-full overflow-hidden">
        {previewColors.length > 0 ? (
          <div className="flex h-full w-full">
            {previewColors.map((color, index) => (
              <div
                key={`${color}-${index}`}
                className="flex-1"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-card to-transparent" />
        {selectionMode && (
          <div
            className={cn(
              "absolute top-2.5 left-2.5 z-10 grid h-6 w-6 place-items-center rounded-sm border bg-background/90 shadow-sm backdrop-blur-sm",
              selectionSelected
                ? "border-foreground bg-foreground"
                : "border-border"
            )}
            aria-hidden
          >
            {selectionSelected && (
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5 text-background"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="3 8 7 12 13 4" />
              </svg>
            )}
          </div>
        )}
        {!selectionMode && onToggleFavorite && (
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
          {entry.origin === "library" && capabilityBadge && (
            <span className="inline-flex items-center rounded-sm bg-background/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-foreground/70 shadow-sm backdrop-blur-sm">
              {t(`capability.${capabilityBadge}`)}
            </span>
          )}
          {entry.origin === "brand" && entry.isComplete === false && (
            <span className="inline-flex items-center rounded-sm bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-amber-700 shadow-sm backdrop-blur-sm">
              {common("incompletePackage")}
            </span>
          )}
          {entry.themeMode && (
            <span className="inline-flex items-center rounded-sm bg-background/85 px-2 py-0.5 text-[10px] font-medium tracking-wide text-foreground capitalize shadow-sm backdrop-blur-sm">
              {entry.themeMode === "light" ? common("light") : common("dark")}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] leading-tight font-semibold tracking-[-0.01em]">
              {entry.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-[12px] leading-[1.55] text-muted-foreground">
              {entry.description}
            </p>
          </div>
          {!selectionMode && hasMenu && (
            <div className="relative shrink-0">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(event) => {
                  event.stopPropagation()
                  setMenuOpen((current) => !current)
                }}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
              {menuOpen && (
                <div
                  onClick={(event) => event.stopPropagation()}
                  className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-border/60 bg-popover py-1 shadow-lg"
                >
                  {onEditMetadata && (
                    <MenuItem
                      icon={<Palette className="h-3.5 w-3.5" />}
                      label={t("editInfo")}
                      onClick={() => {
                        setMenuOpen(false)
                        onEditMetadata()
                      }}
                    />
                  )}
                  {onDelete && (
                    <>
                      <div className="my-1 border-t border-border/60" />
                      <MenuItem
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        label={common("delete")}
                        tone="danger"
                        onClick={() => {
                          setMenuOpen(false)
                          onDelete()
                        }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {entry.createdAt && (
          <p className="text-[11px] text-muted-foreground">
            {t("added", { date: formatAddedDate(entry.createdAt, locale) })}
          </p>
        )}

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

        {!selectionMode && (
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
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit()
                }}
                title={t("editWorkspaceTitle")}
              >
                <Pencil className="h-3.5 w-3.5" />
                {t("editWorkspace")}
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
          </div>
        )}
      </div>
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  tone = "neutral",
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  tone?: "neutral" | "danger"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors",
        tone === "danger"
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted/60"
      )}
    >
      {icon}
      {label}
    </button>
  )
}
