"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Clock3,
  Copy,
  Library,
  MoreHorizontal,
  Palette,
  Pencil,
  Pin,
  PinOff,
  SwatchBook,
  Tag,
  Trash2,
} from "lucide-react"
import { useDesignStore } from "@/lib/store/design-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { getParseStatusBadge } from "@/lib/parse-status"
import type { ParseStatus, WorkspaceDocument } from "@/lib/types/tokens"
import type { Locale } from "@/lib/i18n/config"
import type { ViewMode } from "./gallery-toolbar"
import { useSyncState } from "@/lib/sync/sync-state"

interface DocumentCardProps {
  document: WorkspaceDocument
  view: ViewMode
  selectMode: boolean
  selected: boolean
  onToggleSelect: () => void
  onOpen: () => void
  onRename: (name: string) => void
  onDuplicate: () => void
  onDelete: () => void
  onTogglePinned: () => void
  onEditMetadata: () => void
  onSaveAsTheme: () => void
}

function statusBadge(status: ParseStatus, locale: Locale) {
  return getParseStatusBadge(status, "plain", locale)
}

export function DocumentCard({
  document,
  view,
  selectMode,
  selected,
  onToggleSelect,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onTogglePinned,
  onEditMetadata,
  onSaveAsTheme,
}: DocumentCardProps) {
  const locale = useLocale() as Locale
  const t = useTranslations("Documents.card")
  const common = useTranslations("Common")
  const libraryOriginId =
    document.origin.kind === "library" ? document.origin.id : null
  const sourceTheme = useDesignStore((state) =>
    libraryOriginId
      ? state.libraryEntries.find((entry) => entry.id === libraryOriginId)
      : null
  )
  const syncPaused = useSyncState((state) =>
    state.conflicts.some(
      (conflict) =>
        conflict.entity === "document" && conflict.entityId === document.id
    )
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(document.name)

  const colorBar = useMemo(() => {
    const colors: string[] = []
    const seen = new Set<string>()
    for (const color of document.tokens.colors) {
      const value = color.value?.trim()
      if (!value || seen.has(value)) continue
      seen.add(value)
      colors.push(value)
      if (colors.length >= 6) break
    }
    return colors
  }, [document.tokens.colors])

  const status = statusBadge(document.parseStatus, locale)
  const tags = document.tags ?? []

  const handleCardClick = (event: React.MouseEvent) => {
    if (editingName) {
      event.preventDefault()
      return
    }
    if (selectMode) {
      event.preventDefault()
      onToggleSelect()
      return
    }
    onOpen()
  }

  const startEditingName = () => {
    setMenuOpen(false)
    setDraftName(document.name)
    setEditingName(true)
  }

  const submitEditingName = () => {
    const nextName = draftName.trim()
    if (nextName) {
      onRename(nextName)
    }
    setEditingName(false)
  }

  const cancelEditingName = () => {
    setDraftName(document.name)
    setEditingName(false)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (editingName) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          if (selectMode) onToggleSelect()
          else onOpen()
        }
      }}
      className={cn(
        "group relative cursor-pointer rounded-md border bg-background transition-all",
        selected
          ? "border-foreground ring-2 ring-foreground/40"
          : "border-border/70 hover:border-primary/30 hover:shadow-[0_16px_34px_-28px_rgba(45,109,195,0.45)]",
        view === "list" ? "flex items-center gap-4 px-4 py-3" : "flex flex-col"
      )}
    >
      {selectMode && (
        <div
          className={cn(
            "absolute z-10 grid h-5 w-5 place-items-center rounded-sm border bg-background text-foreground",
            view === "list"
              ? "top-1/2 left-3 -translate-y-1/2"
              : "top-3 left-3",
            selected ? "border-foreground bg-foreground" : "border-border"
          )}
        >
          {selected && (
            <svg
              viewBox="0 0 16 16"
              className="h-3 w-3 text-background"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="3 8 7 12 13 4" />
            </svg>
          )}
        </div>
      )}

      <div
        className={cn(
          view === "list"
            ? "h-12 w-20 shrink-0 overflow-hidden rounded-sm"
            : "h-16 w-full overflow-hidden rounded-t-md"
        )}
      >
        {colorBar.length > 0 ? (
          <div className="flex h-full w-full">
            {colorBar.map((color, index) => (
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
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col gap-3",
          view === "list" ? "min-w-0 px-1" : "p-4"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {document.pinned && (
                <Pin className="h-3 w-3 fill-current text-foreground" />
              )}
              {editingName ? (
                <input
                  value={draftName}
                  autoFocus
                  onChange={(event) => setDraftName(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onDoubleClick={(event) => event.stopPropagation()}
                  onBlur={submitEditingName}
                  onKeyDown={(event) => {
                    event.stopPropagation()
                    if (event.key === "Enter") {
                      event.preventDefault()
                      submitEditingName()
                    }
                    if (event.key === "Escape") {
                      event.preventDefault()
                      cancelEditingName()
                    }
                  }}
                  className="h-7 min-w-0 flex-1 rounded-md border border-primary/30 bg-background px-2 text-sm font-semibold outline-none focus:border-primary"
                />
              ) : (
                <h3
                  className="truncate text-sm font-semibold"
                  onDoubleClick={(event) => {
                    event.stopPropagation()
                    startEditingName()
                  }}
                >
                  {document.name}
                </h3>
              )}
            </div>
            {document.tokens.meta.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {document.tokens.meta.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {syncPaused ? (
              <Badge className="border-amber-300 bg-amber-50 text-amber-800">
                {t("syncPaused")}
              </Badge>
            ) : null}
            {status && (
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            )}
          </div>
        </div>

        {(tags.length > 0 || document.category) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {document.category && (
              <Badge variant="secondary" className="text-[10px]">
                {document.category}
              </Badge>
            )}
            {tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
            {tags.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{tags.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/50 pt-2.5">
          <div className="grid min-w-0 gap-1 text-[10px] leading-4 text-muted-foreground">
            <span
              className="inline-flex items-center gap-1"
              title={t("updated", {
                time: formatRelativeTime(document.updatedAt, { locale }),
              })}
            >
              <Clock3 className="size-3 shrink-0" />
              {t("updatedShort", {
                time: formatRelativeTime(document.updatedAt, { locale }),
              })}
            </span>
            {document.origin.kind === "brand" && (
              <span
                className="inline-flex min-w-0 items-center gap-1"
                title={t("brandSource", { name: document.origin.id })}
              >
                <SwatchBook className="size-3 shrink-0" />
                <span className="truncate">
                  {t("brandSourceShort", { name: document.origin.id })}
                </span>
              </span>
            )}
            {document.origin.kind === "library" && sourceTheme && (
              <span
                className="inline-flex min-w-0 items-center gap-1"
                title={t("librarySource", { name: sourceTheme.name })}
              >
                <Library className="size-3 shrink-0" />
                <span className="truncate">
                  {t("librarySourceShort", { name: sourceTheme.name })}
                </span>
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {!selectMode && (
              <Button
                variant="outline"
                size="xs"
                className="h-7"
                onClick={(event) => {
                  event.stopPropagation()
                  onOpen()
                }}
                title={t("openTitle")}
              >
                {t("open")}
              </Button>
            )}
            <div className="relative">
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
                  className="absolute right-0 z-20 mt-1 w-44 rounded-md border bg-background py-1 shadow-lg"
                >
                  <MenuItem
                    icon={<Pencil className="h-3.5 w-3.5" />}
                    label={t("rename")}
                    onClick={startEditingName}
                  />
                  <MenuItem
                    icon={<Copy className="h-3.5 w-3.5" />}
                    label={t("duplicate")}
                    onClick={() => {
                      setMenuOpen(false)
                      onDuplicate()
                    }}
                  />
                  <MenuItem
                    icon={
                      document.pinned ? (
                        <PinOff className="h-3.5 w-3.5" />
                      ) : (
                        <Pin className="h-3.5 w-3.5" />
                      )
                    }
                    label={document.pinned ? t("unpin") : t("pin")}
                    onClick={() => {
                      setMenuOpen(false)
                      onTogglePinned()
                    }}
                  />
                  <MenuItem
                    icon={<Tag className="h-3.5 w-3.5" />}
                    label={t("editDetails")}
                    onClick={() => {
                      setMenuOpen(false)
                      onEditMetadata()
                    }}
                  />
                  <MenuItem
                    icon={<Palette className="h-3.5 w-3.5" />}
                    label={t("saveLibrary")}
                    onClick={() => {
                      setMenuOpen(false)
                      onSaveAsTheme()
                    }}
                  />
                  <div className="my-1 border-t" />
                  <MenuItem
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    label={common("delete")}
                    tone="danger"
                    onClick={() => {
                      setMenuOpen(false)
                      onDelete()
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
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
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
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
