"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  FileText,
  Globe2,
  Library,
  Search,
  SearchX,
  SwatchBook,
  X,
} from "lucide-react"
import { useAiFeatureEnabled } from "@/hooks/use-ai-feature-enabled"
import { isUrlLikeInput, normalizeUrlInput } from "@/lib/ai/url-detect"
import type { Locale } from "@/lib/i18n/config"
import { useAiSettingsStore } from "@/lib/store/ai-settings-store"
import { useDesignStore } from "@/lib/store/design-store"
import { useUrlGenerationStore } from "@/lib/store/url-generation-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAiSettingsDialog } from "@/components/ai-settings-dialog-provider"
import {
  buildSearchIndex,
  searchItems,
  type SearchItem,
  type SearchSource,
} from "@/lib/search/build-search-index"

const GROUP_ORDER: SearchSource[] = ["draft", "library", "brand"]

const SOURCE_META: Record<
  SearchSource,
  { labelKey: "draft" | "library" | "brand"; icon: typeof FileText }
> = {
  draft: { labelKey: "draft", icon: FileText },
  library: { labelKey: "library", icon: Library },
  brand: { labelKey: "brand", icon: SwatchBook },
}

export function useGlobalSearch() {
  const router = useRouter()
  const documents = useDesignStore((state) => state.documents)
  const libraryEntries = useDesignStore((state) => state.libraryEntries)
  const brands = useDesignStore((state) => state.brands)
  const switchDocument = useDesignStore((state) => state.switchDocument)

  const [query, setQuery] = useState("")

  const index = useMemo(
    () => buildSearchIndex(documents, libraryEntries, brands),
    [documents, libraryEntries, brands]
  )

  const matches = useMemo(() => searchItems(index, query), [index, query])

  const grouped = useMemo(() => {
    const buckets: Record<SearchSource, SearchItem[]> = {
      draft: [],
      library: [],
      brand: [],
    }
    for (const item of matches) buckets[item.source].push(item)
    return buckets
  }, [matches])

  const counts = useMemo(
    () => ({
      draft: documents.length,
      library: libraryEntries.length,
      brand: brands.length,
    }),
    [documents.length, libraryEntries.length, brands.length]
  )

  const selectResult = (item: SearchItem) => {
    if (item.source === "draft") {
      switchDocument(item.id)
      router.push("/editor")
    } else if (item.source === "library") {
      router.push(`/library/${encodeURIComponent(item.id)}`)
    } else {
      router.push(`/brands/${encodeURIComponent(item.id)}`)
    }
  }

  return {
    query,
    setQuery,
    grouped,
    counts,
    hasQuery: query.trim().length > 0,
    totalResults: matches.length,
    selectResult,
  }
}

export function GlobalSearchInput({
  query,
  setQuery,
  autoFocus,
  placeholder,
  className,
  showShortcut = false,
}: {
  query: string
  setQuery: (query: string) => void
  autoFocus?: boolean
  placeholder?: string
  className?: string
  showShortcut?: boolean
}) {
  const t = useTranslations("Search")
  const hasQuery = query.trim().length > 0

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder ?? t("placeholder")}
        className={cn("h-11 pl-9 text-[15px]", showShortcut ? "pr-28" : "pr-9")}
        aria-label={t("title")}
      />
      {hasQuery ? (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 active:not-aria-[haspopup]:-translate-y-1/2"
          onClick={() => setQuery("")}
          aria-label={t("clear")}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : showShortcut ? (
        <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-border/70 bg-muted/45 px-2 py-1 font-mono text-[10px] text-muted-foreground sm:inline-flex">
          Ctrl K / ⌘ K
        </kbd>
      ) : null}
    </div>
  )
}

export function GlobalSearchResults({
  query,
  grouped,
  counts,
  totalResults,
  hasQuery,
  onSelect,
  onGenerateStarted,
  dense = false,
}: {
  query: string
  grouped: Record<SearchSource, SearchItem[]>
  counts: Record<SearchSource, number>
  totalResults: number
  hasQuery: boolean
  onSelect: (item: SearchItem) => void
  onGenerateStarted?: () => void
  dense?: boolean
}) {
  const t = useTranslations("Search")
  if (!hasQuery) {
    return <EmptySearchState counts={counts} dense={dense} />
  }

  if (totalResults === 0) {
    return isUrlLikeInput(query) ? (
      <div className={cn("flex flex-col", dense ? "gap-5" : "gap-7")}>
        <GenerateUrlAction
          query={query}
          onGenerateStarted={onGenerateStarted}
        />
        <NoMatches query={query} dense={dense} />
      </div>
    ) : (
      <NoMatches query={query} dense={dense} />
    )
  }

  return (
    <div className={cn("flex flex-col", dense ? "gap-5" : "gap-7")}>
      {isUrlLikeInput(query) && (
        <GenerateUrlAction
          query={query}
          onGenerateStarted={onGenerateStarted}
        />
      )}
      {GROUP_ORDER.map((source) => {
        const items = grouped[source]
        if (items.length === 0) return null
        const meta = SOURCE_META[source]
        const Icon = meta.icon
        const label = t(meta.labelKey)
        return (
          <section key={source} aria-label={label}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-[13px] font-semibold tracking-wide text-foreground/80">
                {label}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
                {items.length}
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
              {items.map((item, index) => (
                <ResultRow
                  key={`${item.source}-${item.id}`}
                  item={item}
                  query={query}
                  divider={index > 0}
                  onSelect={() => onSelect(item)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function GenerateUrlAction({
  query,
  onGenerateStarted,
}: {
  query: string
  onGenerateStarted?: () => void
}) {
  const t = useTranslations("Search")
  const locale = useLocale() as Locale
  const router = useRouter()
  const openAiSettings = useAiSettingsDialog()
  const settings = useAiSettingsStore()
  const aiEnabled = useAiFeatureEnabled()
  const job = useUrlGenerationStore((state) => state.job)
  const start = useUrlGenerationStore((state) => state.start)
  const generationRunning = job?.status === "running"

  const handleGenerate = () => {
    if (generationRunning) {
      router.push("/editor")
      onGenerateStarted?.()
      return
    }
    if (!settings.apiKey) {
      openAiSettings("ai")
      return
    }
    if (!aiEnabled) return
    const url = normalizeUrlInput(query)
    void start({ url, settings, locale })
    router.push("/editor")
    onGenerateStarted?.()
  }

  if (!aiEnabled) return null
  return (
    <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Globe2 className="h-4 w-4 text-primary" />
            {t("generateFromUrl")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("generateDescription")}
          </p>
        </div>
        <Button size="sm" onClick={handleGenerate}>
          {generationRunning
            ? t("viewProgress")
            : settings.apiKey
              ? t("startGenerate")
              : t("configureKey")}
        </Button>
      </div>
    </div>
  )
}

function highlight(text: string, query: string) {
  const normalized = query.trim()
  if (!normalized) return text
  const idx = text.toLowerCase().indexOf(normalized.toLowerCase())
  if (idx === -1) return text
  return [
    text.slice(0, idx),
    text.slice(idx, idx + normalized.length),
    text.slice(idx + normalized.length),
  ]
}

function ResultRow({
  item,
  query,
  divider,
  onSelect,
}: {
  item: SearchItem
  query: string
  divider: boolean
  onSelect: () => void
}) {
  const t = useTranslations("Search")
  const [before, match, after] = highlight(item.name, query)
  const visibleTags = item.tags.slice(0, 3)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none active:translate-y-px",
        divider && "border-t border-border/60"
      )}
    >
      <div className="mt-0.5 flex w-16 shrink-0 justify-start">
        <span className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
          {t(item.source)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] leading-tight font-medium text-foreground">
          {before}
          {match ? (
            <mark className="rounded-sm bg-primary/15 text-foreground">
              {match}
            </mark>
          ) : null}
          {after}
        </p>
        {item.description ? (
          <p className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">
            {item.description}
          </p>
        ) : null}
        {item.category || visibleTags.length > 0 ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground/80">
            {item.category ? (
              <span className="font-medium">{item.category}</span>
            ) : null}
            {visibleTags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  )
}

function EmptySearchState({
  counts,
  dense,
}: {
  counts: Record<SearchSource, number>
  dense: boolean
}) {
  const t = useTranslations("Search")
  return (
    <div
      className={cn(
        "grid place-items-center rounded-md border border-dashed border-border/70 bg-background/80 px-6 text-center",
        dense ? "py-10" : "py-16"
      )}
    >
      <Search className="mb-3 h-7 w-7 text-muted-foreground/70" />
      <p className="text-sm font-medium">{t("start")}</p>
      <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
        {t("startDetail")}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
        {GROUP_ORDER.map((source) => {
          const meta = SOURCE_META[source]
          const Icon = meta.icon
          return (
            <span
              key={source}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2.5 py-1"
            >
              <Icon className="h-3 w-3" />
              {t(meta.labelKey)}
              <span className="text-muted-foreground/70 tabular-nums">
                {counts[source]}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function NoMatches({ query, dense }: { query: string; dense: boolean }) {
  const t = useTranslations("Search")
  return (
    <div
      className={cn(
        "grid place-items-center rounded-md border border-dashed border-border/70 bg-background/80 px-6 text-center",
        dense ? "py-10" : "py-16"
      )}
    >
      <SearchX className="mb-3 h-7 w-7 text-muted-foreground/70" />
      <p className="text-sm font-medium">{t("noMatches")}</p>
      <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
        {t("noMatchesDetail", { query: query.trim() })}
      </p>
    </div>
  )
}
