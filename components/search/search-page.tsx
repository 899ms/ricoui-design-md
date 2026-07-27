"use client"

import { useTranslations } from "next-intl"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  GlobalSearchInput,
  GlobalSearchResults,
  useGlobalSearch,
} from "@/components/search/global-search-content"

export function SearchPage() {
  const t = useTranslations("Search")
  const search = useGlobalSearch()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/15">
      <div className="border-b border-border/60 bg-background/95 px-7 py-5 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
              {t("global")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("sources")}
            </span>
          </div>
          <h1 className="mt-3 text-2xl leading-tight font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>

          <GlobalSearchInput
            autoFocus
            query={search.query}
            setQuery={search.setQuery}
            className="mt-4"
          />

          {search.hasQuery ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("resultCount", { count: search.totalResults })}
            </p>
          ) : null}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-7 py-6">
          <GlobalSearchResults
            query={search.query}
            grouped={search.grouped}
            counts={search.counts}
            totalResults={search.totalResults}
            hasQuery={search.hasQuery}
            onSelect={search.selectResult}
          />
        </div>
      </ScrollArea>
    </div>
  )
}
