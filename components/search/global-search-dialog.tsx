"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  GlobalSearchInput,
  GlobalSearchResults,
  useGlobalSearch,
} from "@/components/search/global-search-content"
import type { SearchItem } from "@/lib/search/build-search-index"

interface GlobalSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: GlobalSearchDialogProps) {
  const t = useTranslations("Search")
  const search = useGlobalSearch()

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onOpenChange, open])

  if (!open) return null

  const handleSelect = (item: SearchItem) => {
    search.selectResult(item)
    onOpenChange(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("global")}
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/55 px-4 py-6 backdrop-blur-sm"
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        className="flex min-h-0 max-h-[calc(100dvh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/10 bg-background/95 shadow-[0_30px_90px_-35px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border/60 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
                  {t("global")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("sources")}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("dialogDescription")}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <GlobalSearchInput
            autoFocus
            query={search.query}
            setQuery={search.setQuery}
            showShortcut
          />

          {search.hasQuery ? (
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{t("resultCount", { count: search.totalResults })}</span>
              <Link
                href="/search"
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-muted/60 hover:text-foreground"
                onClick={() => onOpenChange(false)}
              >
                {t("openPage")}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          ) : null}
        </div>

        <ScrollArea className="min-h-0 flex-1" aria-label={t("title")}>
          <div className="p-4 sm:p-5">
            <GlobalSearchResults
              dense
              query={search.query}
              grouped={search.grouped}
              counts={search.counts}
              totalResults={search.totalResults}
              hasQuery={search.hasQuery}
              onSelect={handleSelect}
              onGenerateStarted={() => onOpenChange(false)}
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
