"use client"

import {
  Archive,
  CheckSquare,
  Grid3x3,
  List,
  RefreshCw,
  Search,
  Tag,
  Trash2,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type SortKey = "updated" | "name" | "created" | "opened"
export type ViewMode = "grid" | "list"

interface GalleryToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  selectMode: boolean
  onToggleSelectMode: () => void
  selectedCount: number
  visibleCount: number
  allVisibleSelected: boolean
  onSelectAll: () => void
  onInvertSelection: () => void
  onBulkDelete: () => void
  onBulkExport: () => void
  onBulkAddTag: () => void
}

export function GalleryToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  selectMode,
  onToggleSelectMode,
  selectedCount,
  visibleCount,
  allVisibleSelected,
  onSelectAll,
  onInvertSelection,
  onBulkDelete,
  onBulkExport,
  onBulkAddTag,
}: GalleryToolbarProps) {
  const t = useTranslations("Documents.toolbar")
  const common = useTranslations("Common")
  const sortOptions: { value: SortKey; label: string }[] = [
    { value: "updated", label: t("updated") },
    { value: "opened", label: t("opened") },
    { value: "created", label: t("created") },
    { value: "name", label: t("name") },
  ]

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-muted/25 px-4 py-3 sm:px-6">
      <div className="relative max-w-md min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("search")}
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("sort")}</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortKey)}
            className="h-8 rounded-sm border border-border bg-background px-2 text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center rounded-sm border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-sm transition-colors",
              view === "grid"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={t("grid")}
          >
            <Grid3x3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("list")}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-sm transition-colors",
              view === "list"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={t("list")}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>

        <Button
          variant={selectMode ? "default" : "outline"}
          size="sm"
          onClick={onToggleSelectMode}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          {selectMode ? common("done") : t("select")}
        </Button>

        {selectMode && (
          <div className="flex items-center gap-1 rounded-sm border border-border bg-background p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              disabled={visibleCount === 0 || allVisibleSelected}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              {t("selectAll")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onInvertSelection}
              disabled={visibleCount === 0}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("invertSelection")}
            </Button>
          </div>
        )}

        {selectMode && selectedCount > 0 && (
          <div className="flex items-center gap-1 rounded-sm border border-border bg-background p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkAddTag}
              title={t("addTagsTitle")}
            >
              <Tag className="h-3.5 w-3.5" />
              {t("tags")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkExport}
              title={t("exportTitle")}
            >
              <Archive className="h-3.5 w-3.5" />
              {common("export")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkDelete}
              title={t("deleteTitle")}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {common("delete")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
