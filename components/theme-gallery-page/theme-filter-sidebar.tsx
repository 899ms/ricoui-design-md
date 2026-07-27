"use client"

import { motion, AnimatePresence } from "motion/react"
import { useTranslations } from "next-intl"
import {
  Filter,
  GalleryVerticalEnd,
  Heart,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Star,
  SwatchBook,
  Sun,
  Tag,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export type ThemeSource = "all" | "brand" | "library"

export const UNCATEGORIZED_KEY = "__uncategorized__"

interface ThemeFilterSidebarProps {
  source: ThemeSource
  onSourceChange: (source: ThemeSource) => void
  sourceCounts: { all: number; brand: number; library: number }
  selectedMode: "light" | "dark" | null
  onSelectMode: (mode: "light" | "dark" | null) => void
  categories: [string, number][]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
  uncategorizedCount?: number
  favoritesOnly?: boolean
  favoritesCount?: number
  onToggleFavoritesOnly?: () => void
  tags: [string, number][]
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  onClearTags: () => void
  search: string
  onSearchChange: (value: string) => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
  onOpenTaxonomyManager?: () => void
  showSourceFilters?: boolean
  overlay?: boolean
}

const SOURCE_OPTIONS: {
  value: ThemeSource
  icon: React.ReactNode
}[] = [
  { value: "all", icon: <GalleryVerticalEnd className="h-3.5 w-3.5" /> },
  {
    value: "brand",
    icon: <SwatchBook className="h-3.5 w-3.5" />,
  },
  {
    value: "library",
    icon: <Star className="h-3.5 w-3.5" />,
  },
]

export function ThemeFilterSidebar({
  source,
  onSourceChange,
  sourceCounts,
  selectedMode,
  onSelectMode,
  categories,
  selectedCategory,
  onSelectCategory,
  uncategorizedCount = 0,
  favoritesOnly = false,
  favoritesCount = 0,
  onToggleFavoritesOnly,
  tags,
  selectedTags,
  onToggleTag,
  onClearTags,
  search,
  onSearchChange,
  collapsed = false,
  onToggleCollapsed,
  onOpenTaxonomyManager,
  showSourceFilters = true,
  overlay = false,
}: ThemeFilterSidebarProps) {
  const t = useTranslations("Gallery.sidebar")
  const gallery = useTranslations("Gallery")
  const common = useTranslations("Common")
  const sourceOptions = SOURCE_OPTIONS.map((option) => ({
    ...option,
    label:
      option.value === "all"
        ? common("all")
        : option.value === "brand"
          ? t("brand")
          : t("library"),
  }))
  const activeFilterCount =
    (selectedMode ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    selectedTags.length +
    (search.trim() ? 1 : 0) +
    (favoritesOnly ? 1 : 0)
  const sidebarTitle = showSourceFilters
    ? t("resources")
    : source === "brand"
      ? t("brand")
      : t("library")

  return (
    <motion.aside
      initial={false}
      animate={{ width: overlay ? 320 : collapsed ? 44 : 256 }}
      transition={{
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={cn(
        "relative shrink-0 overflow-hidden border-r border-border/60 bg-background",
        overlay ? "flex h-full w-full flex-col" : "hidden lg:flex lg:flex-col"
      )}
    >
      {/* ── Collapsed icon layer ── */}
      {!overlay && (
        <motion.div
          initial={false}
          animate={{
            opacity: collapsed ? 1 : 0,
          }}
          transition={{ duration: 0.15 }}
          style={{ pointerEvents: collapsed ? "auto" : "none" }}
          className="absolute inset-0 flex flex-col items-center gap-1 py-2"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapsed}
            title={t("expand", { title: sidebarTitle })}
            aria-label={t("expand", { title: sidebarTitle })}
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
          <div className="my-1 h-px w-6 bg-border" />
          {showSourceFilters &&
            sourceOptions.map((option) => {
              const active = source === option.value
              return (
                <Button
                  key={option.value}
                  variant={active ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => onSourceChange(option.value)}
                  title={`${option.label} (${sourceCounts[option.value]})`}
                  aria-label={option.label}
                >
                  {option.icon}
                </Button>
              )
            })}
          {showSourceFilters && <div className="my-1 h-px w-6 bg-border" />}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapsed}
              title={t("activeFilters", { count: activeFilterCount })}
              aria-label={t("openFilters")}
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

      {/* ── Expanded content layer ── */}
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
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <p className="text-md font-semibold text-muted-foreground/80 uppercase">
                  {sidebarTitle}
                </p>
              </div>
              {onToggleCollapsed && (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  onClick={onToggleCollapsed}
                  title={t("collapse", { title: sidebarTitle })}
                  aria-label={t("collapse", { title: sidebarTitle })}
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {showSourceFilters && (
              <div className="border-b border-border/60 px-3 py-3">
                <div className="space-y-0.5">
                  {sourceOptions.map((option) => {
                    const active = source === option.value
                    const count = sourceCounts[option.value]
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onSourceChange(option.value)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                          active
                            ? "bg-foreground text-background"
                            : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          {option.icon}
                          {option.label}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 text-[10px] tabular-nums",
                            active
                              ? "bg-background/20 text-background/90"
                              : "bg-muted/70 text-muted-foreground"
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="border-b border-border/60 px-5 py-4">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={t("search")}
                  className="h-8 pl-8 text-[13px]"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-6 px-5 py-5">
                {onToggleFavoritesOnly && (
                  <section className="space-y-2.5">
                    <button
                      type="button"
                      onClick={onToggleFavoritesOnly}
                      aria-pressed={favoritesOnly}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px] transition-colors",
                        favoritesOnly
                          ? "bg-rose-500 text-white hover:bg-rose-500/90"
                          : "border border-border bg-background text-foreground/80 hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Heart
                          className={cn(
                            "h-3.5 w-3.5",
                            favoritesOnly && "fill-current"
                          )}
                        />
                        {common("favorite")}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[10px] tabular-nums",
                          favoritesOnly
                            ? "bg-white/25 text-white"
                            : "bg-muted/70 text-muted-foreground"
                        )}
                      >
                        {favoritesCount}
                      </span>
                    </button>
                  </section>
                )}

                <section className="space-y-2.5">
                  <SectionHeader label={t("mode")} />
                  <div className="grid grid-cols-3 gap-1.5">
                    <ModeButton
                      label={common("all")}
                      icon={null}
                      selected={selectedMode === null}
                      onClick={() => onSelectMode(null)}
                    />
                    <ModeButton
                      label={common("light")}
                      icon={<Sun className="h-3 w-3" />}
                      selected={selectedMode === "light"}
                      onClick={() =>
                        onSelectMode(selectedMode === "light" ? null : "light")
                      }
                    />
                    <ModeButton
                      label={common("dark")}
                      icon={<Moon className="h-3 w-3" />}
                      selected={selectedMode === "dark"}
                      onClick={() =>
                        onSelectMode(selectedMode === "dark" ? null : "dark")
                      }
                    />
                  </div>
                </section>

                <section className="space-y-2.5">
                  <SectionHeader label={t("categories")} />
                  {onOpenTaxonomyManager && (
                    <button
                      type="button"
                      onClick={onOpenTaxonomyManager}
                      className="mb-2 flex w-full items-center justify-between rounded-md border border-border/75 bg-card/60 px-2.5 py-2 text-left text-[13px] text-foreground/80 shadow-[var(--shadow-sm)] transition-colors hover:border-primary/25 hover:bg-card hover:text-foreground"
                    >
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <Tag className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{t("manageTaxonomy")}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {common("edit")}
                      </span>
                    </button>
                  )}
                  {categories.length === 0 && uncategorizedCount === 0 ? (
                    <p className="text-xs text-muted-foreground/80">
                      {t("noCategories")}
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      <li>
                        <CategoryButton
                          label={common("all")}
                          count={
                            categories.reduce((acc, [, n]) => acc + n, 0) +
                            uncategorizedCount
                          }
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
                      {uncategorizedCount > 0 && (
                        <li>
                          <CategoryButton
                            label={gallery("uncategorized")}
                            count={uncategorizedCount}
                            selected={selectedCategory === UNCATEGORIZED_KEY}
                            onClick={() =>
                              onSelectCategory(
                                selectedCategory === UNCATEGORIZED_KEY
                                  ? null
                                  : UNCATEGORIZED_KEY
                              )
                            }
                          />
                        </li>
                      )}
                    </ul>
                  )}
                </section>

                <section className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <SectionHeader
                      icon={<Tag className="h-3 w-3" />}
                      label={t("tags")}
                    />
                    {selectedTags.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearTags}
                        className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                        {common("clear")}
                      </button>
                    )}
                  </div>
                  {tags.length === 0 ? (
                    <p className="text-xs text-muted-foreground/80">
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
                              "inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[11px] transition-colors",
                              active
                                ? "border-foreground bg-foreground text-background"
                                : "border-border/70 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                            )}
                          >
                            <span>{tag}</span>
                            <span
                              className={cn(
                                "rounded-full px-1.5 text-[9.5px] tabular-nums",
                                active
                                  ? "bg-background/20 text-background/90"
                                  : "bg-muted/60 text-muted-foreground/80"
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
    <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/80 uppercase">
      {icon}
      {label}
    </div>
  )
}

function ModeButton({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border/70 bg-background text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
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
        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
        selected
          ? "bg-foreground text-background"
          : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 text-[10px] tabular-nums",
          selected
            ? "bg-background/20 text-background/90"
            : "bg-muted/70 text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  )
}
