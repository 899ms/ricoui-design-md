"use client"

import { AnimatePresence, motion } from "motion/react"
import { useTranslations } from "next-intl"
import {
  Filter,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Tag,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TagFilterSidebarProps {
  tags: [string, number][]
  categories: [string, number][]
  selectedTags: string[]
  selectedCategory: string | null
  onlyPinned: boolean
  totalCount: number
  onToggleTag: (tag: string) => void
  onClearTags: () => void
  onSelectCategory: (category: string | null) => void
  onTogglePinned: () => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
  search?: string
  overlay?: boolean
}

export function TagFilterSidebar({
  tags,
  categories,
  selectedTags,
  selectedCategory,
  onlyPinned,
  totalCount,
  onToggleTag,
  onClearTags,
  onSelectCategory,
  onTogglePinned,
  collapsed = false,
  onToggleCollapsed,
  search = "",
  overlay = false,
}: TagFilterSidebarProps) {
  const t = useTranslations("Documents.sidebar")
  const common = useTranslations("Common")
  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    selectedTags.length +
    (onlyPinned ? 1 : 0) +
    (search.trim() ? 1 : 0)

  return (
    <motion.aside
      initial={false}
      animate={{ width: overlay ? 320 : collapsed ? 44 : 256 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "relative shrink-0 overflow-hidden border-r border-border/70 bg-background/90",
        overlay ? "flex h-full w-full flex-col" : "hidden lg:flex lg:flex-col"
      )}
    >
      {/* Collapsed icon layer */}
      {!overlay && (
        <motion.div
          initial={false}
          animate={{ opacity: collapsed ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          style={{ pointerEvents: collapsed ? "auto" : "none" }}
          className="absolute inset-0 flex flex-col items-center gap-1 py-2"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapsed}
            title={t("expand")}
            aria-label={t("expand")}
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
          <div className="my-1 h-px w-6 bg-border" />
          <Button
            variant={onlyPinned ? "default" : "ghost"}
            size="icon-sm"
            onClick={onTogglePinned}
            title={t("pinnedOnly")}
            aria-label={t("pinnedOnly")}
          >
            <Pin className={cn("h-4 w-4", onlyPinned && "fill-current")} />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapsed}
              title={t("activeFilters", { count: activeFilterCount })}
              aria-label={t("open")}
            >
              <Filter className="h-4 w-4" />
            </Button>
            {activeFilterCount > 0 && (
              <span className="pointer-events-none absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[9px] font-semibold text-background">
                {activeFilterCount}
              </span>
            )}
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {t("title")}
              </p>
              {onToggleCollapsed && (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  onClick={onToggleCollapsed}
                  title={t("collapse")}
                  aria-label={t("collapse")}
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-6 px-5 py-5">
                <section className="space-y-2">
                  <SectionHeader
                    icon={<Pin className="h-3 w-3" />}
                    label={t("quick")}
                  />
                  <button
                    type="button"
                    onClick={onTogglePinned}
                    className={cn(
                      "flex w-full items-center justify-between rounded-sm border px-3 py-2 text-left text-sm transition-colors",
                      onlyPinned
                        ? "border-foreground bg-foreground/5 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{t("pinnedOnly")}</span>
                    <Pin
                      className={cn(
                        "h-3.5 w-3.5",
                        onlyPinned ? "fill-current" : ""
                      )}
                    />
                  </button>
                </section>

                <section className="space-y-2">
                  <SectionHeader
                    icon={<FolderOpen className="h-3 w-3" />}
                    label={t("categories")}
                  />
                  {categories.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {t("noCategories")}
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      <li>
                        <CategoryButton
                          label={common("all")}
                          count={totalCount}
                          selected={selectedCategory === null}
                          onClick={() => onSelectCategory(null)}
                        />
                      </li>
                      {categories.map(([name, count]) => (
                        <li key={name}>
                          <CategoryButton
                            label={name}
                            count={count}
                            selected={selectedCategory === name}
                            onClick={() =>
                              onSelectCategory(
                                selectedCategory === name ? null : name
                              )
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <SectionHeader
                      icon={<Tag className="h-3 w-3" />}
                      label={t("tags")}
                    />
                    {selectedTags.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearTags}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                        {common("clear")}
                      </button>
                    )}
                  </div>
                  {tags.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {t("noTags")}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(([tag, count]) => {
                        const active = selectedTags.includes(tag)
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => onToggleTag(tag)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] transition-colors",
                              active
                                ? "border-foreground bg-foreground text-background"
                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span>{tag}</span>
                            <span
                              className={cn(
                                "rounded-full px-1.5 text-[10px]",
                                active
                                  ? "bg-background/20 text-background"
                                  : "bg-muted/60 text-muted-foreground"
                              )}
                            >
                              {count}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </section>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}

function SectionHeader({
  icon,
  label,
}: {
  icon?: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
      {icon}
      {label}
    </div>
  )
}

function CategoryButton({
  label,
  count,
  selected,
  onClick,
}: {
  label: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors",
        selected
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 text-[10px]",
          selected ? "bg-background/20" : "bg-muted/60"
        )}
      >
        {count}
      </span>
    </button>
  )
}
