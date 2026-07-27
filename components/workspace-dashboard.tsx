"use client"

import type { ChangeEvent, DragEvent, ReactNode } from "react"
import { useCallback, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowRight,
  Clock3,
  FilePlus,
  FileText,
  Library as LibraryIcon,
  Palette,
  Pin,
  SwatchBook,
  Upload,
  WandSparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HomeHeroCopy } from "@/components/home-hero-copy"
import { GitHubMark } from "@/components/github-mark"
import { ImportSummaryToast } from "@/components/import-summary-toast"
import { useAccountDialog } from "@/components/account-dialog-provider"
import { AccountStatusIcon } from "@/components/account-status-icon"
import { BrandMedia } from "@/components/theme-gallery-page/brand-media"
import { BrandLogo } from "@/components/theme-gallery-page/brand-logo"
import {
  GlobalSearchInput,
  GlobalSearchResults,
  useGlobalSearch,
} from "@/components/search/global-search-content"
import { useDesignStore } from "@/lib/store/design-store"
import type {
  Brand,
  BatchImportResult,
  LibraryEntry,
  ParseStatus,
  WorkspaceDocument,
} from "@/lib/types/tokens"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { getParseStatusBadge } from "@/lib/parse-status"
import type { Locale } from "@/lib/i18n/config"

const RECENT_LIMIT = 4
const LIBRARY_LIMIT = 6
const BRAND_LIMIT = 18
const ALL_CATEGORY = "__all__"

function sortDocumentsByActivity(documents: WorkspaceDocument[]) {
  return [...documents].sort(
    (a, b) => (b.lastOpenedAt ?? b.updatedAt) - (a.lastOpenedAt ?? a.updatedAt)
  )
}

function sourceLabel(
  document: WorkspaceDocument,
  libraryEntries: LibraryEntry[],
  brands: Brand[],
  labels: {
    library: (name: string) => string
    libraryFallback: string
    brand: (name: string) => string
    brandFallback: string
    upload: string
    duplicate: string
    blank: string
  }
) {
  const { origin } = document

  if (origin.kind === "library") {
    const entry = libraryEntries.find((item) => item.id === origin.id)
    return entry ? labels.library(entry.name) : labels.libraryFallback
  }
  if (origin.kind === "brand") {
    const brand = brands.find((item) => item.id === origin.id)
    return brand ? labels.brand(brand.name) : labels.brandFallback
  }
  if (origin.kind === "upload") return labels.upload
  if (origin.kind === "duplicate") return labels.duplicate
  return labels.blank
}

function statusMeta(status: ParseStatus, locale: Locale) {
  return getParseStatusBadge(status, "tinted", locale)
}

function ColorStrip({ colors }: { colors: string[] }) {
  const safeColors = colors.filter(Boolean).slice(0, 6)
  if (safeColors.length === 0) {
    return <div className="h-9 rounded-sm bg-muted" />
  }

  return (
    <div className="flex h-9 overflow-hidden rounded-sm border border-border/70">
      {safeColors.map((color, index) => (
        <span
          key={`${color}-${index}`}
          className="min-w-0 flex-1"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

function getLibraryCategories(entries: LibraryEntry[]) {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    const category = entry.category?.trim()
    if (!category) continue
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }
  return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]))
}

export function WorkspaceDashboard() {
  const t = useTranslations("Dashboard")
  const router = useRouter()
  const documents = useDesignStore((state) => state.documents)
  const libraryEntries = useDesignStore((state) => state.libraryEntries)
  const brands = useDesignStore((state) => state.brands)
  const brandFavorites = useDesignStore((state) => state.brandFavorites)
  const activeDocumentId = useDesignStore((state) => state.activeDocumentId)
  const switchDocument = useDesignStore((state) => state.switchDocument)
  const createDocument = useDesignStore((state) => state.createDocument)
  const createDocumentsFromFiles = useDesignStore(
    (state) => state.createDocumentsFromFiles
  )
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dragDepthRef = useRef(0)
  const [isImportDragging, setIsImportDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<BatchImportResult | null>(
    null
  )
  const [selectedLibraryCategory, setSelectedLibraryCategory] =
    useState(ALL_CATEGORY)
  const homeSearch = useGlobalSearch()

  const activeDocument = useMemo(
    () =>
      documents.find((document) => document.id === activeDocumentId) ?? null,
    [documents, activeDocumentId]
  )

  const recentDocuments = useMemo(
    () => sortDocumentsByActivity(documents).slice(0, RECENT_LIMIT),
    [documents]
  )

  const libraryCategories = useMemo(
    () => getLibraryCategories(libraryEntries),
    [libraryEntries]
  )

  const libraryPreviewEntries = useMemo(() => {
    const source =
      selectedLibraryCategory === ALL_CATEGORY
        ? libraryEntries
        : libraryEntries.filter(
            (entry) => entry.category === selectedLibraryCategory
          )

    return [...source]
      .sort((a, b) => {
        if (!!b.favorited !== !!a.favorited) return b.favorited ? 1 : -1
        return b.updatedAt - a.updatedAt
      })
      .slice(0, LIBRARY_LIMIT)
  }, [libraryEntries, selectedLibraryCategory])

  const featuredBrands = useMemo(() => {
    const favoriteIds = new Set(brandFavorites)
    return [...brands]
      .sort((a, b) => {
        if (favoriteIds.has(a.id) !== favoriteIds.has(b.id)) {
          return favoriteIds.has(a.id) ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
      .slice(0, BRAND_LIMIT)
  }, [brands, brandFavorites])

  const openDocument = useCallback(
    (documentId: string) => {
      switchDocument(documentId)
      router.push("/editor")
    },
    [switchDocument, router]
  )

  const handleNewBlank = useCallback(async () => {
    const id = await createDocument({ source: "blank" })
    if (id) router.push("/editor")
  }, [createDocument, router])

  const handleImportFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return

      setImportSummary(null)
      setIsImporting(true)

      try {
        const result = await createDocumentsFromFiles(files)
        const hasIssues = result.failed.length > 0 || result.skipped.length > 0

        if (
          result.totalCount === 1 &&
          result.successCount === 1 &&
          !hasIssues
        ) {
          router.push("/editor")
          return
        }

        setImportSummary(result)
      } finally {
        setIsImporting(false)
      }
    },
    [createDocumentsFromFiles, router]
  )

  const handleUploadChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      event.target.value = ""
      await handleImportFiles(files)
    },
    [handleImportFiles]
  )

  const handleImportDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    dragDepthRef.current += 1
    setIsImportDragging(true)
  }, [])

  const handleImportDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const handleImportDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setIsImportDragging(false)
  }, [])

  const handleImportDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      dragDepthRef.current = 0
      setIsImportDragging(false)
      await handleImportFiles(Array.from(event.dataTransfer.files ?? []))
    },
    [handleImportFiles]
  )

  const editLibraryEntry = useCallback(
    async (entry: LibraryEntry) => {
      const existing = sortDocumentsByActivity(
        documents.filter(
          (document) =>
            document.origin.kind === "library" &&
            document.origin.id === entry.id
        )
      )[0]

      if (existing) {
        switchDocument(existing.id)
        router.push("/editor")
        return
      }

      const id = await createDocument({ source: "library", sourceId: entry.id })
      if (id) router.push("/editor")
    },
    [documents, switchDocument, createDocument, router]
  )

  return (
    <div className="work-surface min-h-0 flex-1 overflow-y-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept=".md"
        multiple
        className="hidden"
        onChange={handleUploadChange}
      />

      <main className="mx-auto flex w-full max-w-[1380px] flex-col gap-16 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <HeroSection
          search={homeSearch}
          activeDocument={activeDocument}
          documentsCount={documents.length}
          libraryCount={libraryEntries.length}
          brandCount={brands.length}
          onContinue={() => {
            if (activeDocument) openDocument(activeDocument.id)
            else void handleNewBlank()
          }}
        />

        <RecentProjectsSection
          documents={recentDocuments}
          libraryEntries={libraryEntries}
          brands={brands}
          isDragging={isImportDragging}
          isImporting={isImporting}
          importError={
            importSummary && importSummary.successCount === 0
              ? t("importNone")
              : null
          }
          onOpenDocument={openDocument}
          onNewBlank={() => void handleNewBlank()}
          onImport={() => fileInputRef.current?.click()}
          onDragEnter={handleImportDragEnter}
          onDragOver={handleImportDragOver}
          onDragLeave={handleImportDragLeave}
          onDrop={handleImportDrop}
        />

        <LibraryPreviewSection
          entries={libraryPreviewEntries}
          totalCount={libraryEntries.length}
          categories={libraryCategories}
          selectedCategory={selectedLibraryCategory}
          onSelectCategory={setSelectedLibraryCategory}
          onEditEntry={editLibraryEntry}
        />

        <BrandPreviewSection
          brands={featuredBrands}
          totalCount={brands.length}
        />

        <HomeFooter />
      </main>
      <ImportSummaryToast
        result={importSummary}
        onDismiss={() => setImportSummary(null)}
        onOpenLatest={() => {
          const latestId = importSummary?.createdIds.at(-1)
          if (!latestId) return
          setImportSummary(null)
          openDocument(latestId)
        }}
      />
    </div>
  )
}

function HeroSection({
  search,
  activeDocument,
  documentsCount,
  libraryCount,
  brandCount,
  onContinue,
}: {
  search: ReturnType<typeof useGlobalSearch>
  activeDocument: WorkspaceDocument | null
  documentsCount: number
  libraryCount: number
  brandCount: number
  onContinue: () => void
}) {
  const t = useTranslations("Dashboard")
  const searchT = useTranslations("Search")
  return (
    <section className="relative pt-8 pb-4 sm:pt-12 lg:pt-16">
      <HomeHeaderActions />
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <HomeHeroCopy />

        <div className="mt-8 w-full max-w-3xl">
          <div className="relative">
            <div className="rounded-2xl border border-border/70 bg-background/86 p-2 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <GlobalSearchInput
                autoFocus
                query={search.query}
                setQuery={search.setQuery}
                placeholder={t("searchPlaceholder")}
              />
              {!search.hasQuery ? (
                <div className="flex flex-wrap items-center justify-center gap-2 px-2 pt-3 pb-1 text-[11px] text-muted-foreground">
                  <SourceChip
                    label={searchT("draft")}
                    count={documentsCount}
                    onSelect={() => search.setQuery(searchT("draft"))}
                  />
                  <SourceChip
                    label={searchT("library")}
                    count={libraryCount}
                    onSelect={() => search.setQuery(searchT("library"))}
                  />
                  <SourceChip
                    label={searchT("brand")}
                    count={brandCount}
                    onSelect={() => search.setQuery(searchT("brand"))}
                  />
                  <button
                    type="button"
                    onClick={() => search.setQuery("vercel.com")}
                    className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/[0.06] px-2.5 py-1 font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                  >
                    <WandSparkles className="size-3" />
                    {t("urlGenerateHint")}
                  </button>
                </div>
              ) : null}
            </div>

            {search.hasQuery ? (
              <div className="absolute top-full right-0 left-0 z-30 mt-2 max-h-[min(30rem,calc(100dvh-14rem))] overflow-y-auto overscroll-contain rounded-xl border border-border/60 bg-background/95 p-3 text-left shadow-[0_24px_70px_-34px_rgba(15,23,42,0.55)] backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
                  <span>
                    {t("resultCount", { count: search.totalResults })}
                  </span>
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    {t("openSearch")}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <GlobalSearchResults
                  dense
                  query={search.query}
                  grouped={search.grouped}
                  counts={search.counts}
                  totalResults={search.totalResults}
                  hasQuery={search.hasQuery}
                  onSelect={search.selectResult}
                />
              </div>
            ) : null}
          </div>

          {!search.hasQuery && activeDocument ? (
            <ContinueDraftPrompt
              document={activeDocument}
              onContinue={onContinue}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function HomeHeaderActions() {
  const t = useTranslations("Dashboard")

  return (
    <div className="absolute top-0 right-0 hidden items-center gap-2 lg:flex">
      <span className="text-sm text-muted-foreground">GitHub</span>
      <a
        href="https://github.com/ricocc/ricoui-design-md"
        target="_blank"
        rel="noreferrer"
        className="grid size-9 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none active:translate-y-px"
        aria-label={t("openSourceRepository")}
        title={t("openSourceRepository")}
      >
        <GitHubMark className="size-5" />
      </a>

      {/* Keep the existing home sign-in entry available for a future rollout. */}
      <div className="hidden">
        <HomeAccountPrompt />
      </div>
    </div>
  )
}

function HomeAccountPrompt() {
  const t = useTranslations("Dashboard")
  const { authReady, configured, openAccount, user } = useAccountDialog()

  if (!configured || !authReady || user) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {t("accountPrompt")}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={openAccount}
        aria-label={t("signInRegister")}
        title={t("signInRegister")}
      >
        <AccountStatusIcon connected={false} />
      </Button>
    </div>
  )
}

function SourceChip({
  label,
  count,
  onSelect,
}: {
  label: string
  count: number
  onSelect: () => void
}) {
  const t = useTranslations("Dashboard")
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={count === 0}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-card/70 px-2.5 py-1 transition-colors hover:border-primary/30 hover:bg-primary/[0.06] hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      )}
      title={`${t("searchPlaceholder")}: ${label}`}
    >
      {label}
      <span className="font-medium text-foreground tabular-nums">{count}</span>
    </button>
  )
}

function ContinueDraftPrompt({
  document,
  onContinue,
}: {
  document: WorkspaceDocument
  onContinue: () => void
}) {
  const t = useTranslations("Dashboard")
  const locale = useLocale() as Locale
  return (
    <button
      type="button"
      onClick={onContinue}
      className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/72 px-3 py-2.5 text-left shadow-[var(--shadow-sm)] transition-colors hover:border-primary/30 hover:bg-primary/[0.04] focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none active:translate-y-px"
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {t("continueEditing")}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{document.name}</span>
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5" />
        {formatRelativeTime(document.lastOpenedAt ?? document.updatedAt, {
          locale,
        })}
        <ArrowRight className="h-3.5 w-3.5 text-primary" />
      </span>
    </button>
  )
}

function RecentProjectsSection({
  documents,
  libraryEntries,
  brands,
  isDragging,
  isImporting,
  importError,
  onOpenDocument,
  onNewBlank,
  onImport,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  documents: WorkspaceDocument[]
  libraryEntries: LibraryEntry[]
  brands: Brand[]
  isDragging: boolean
  isImporting: boolean
  importError: string | null
  onOpenDocument: (documentId: string) => void
  onNewBlank: () => void
  onImport: () => void
  onDragEnter: (event: DragEvent) => void
  onDragOver: (event: DragEvent) => void
  onDragLeave: (event: DragEvent) => void
  onDrop: (event: DragEvent) => void
}) {
  const t = useTranslations("Dashboard")
  const sourceLabels = {
    library: (name: string) => t("source.library", { name }),
    libraryFallback: t("source.libraryFallback"),
    brand: (name: string) => t("source.brand", { name }),
    brandFallback: t("source.brandFallback"),
    upload: t("source.upload"),
    duplicate: t("source.duplicate"),
    blank: t("source.blank"),
  }
  return (
    <section aria-labelledby="recent-projects">
      <SectionHeader
        id="recent-projects"
        eyebrow={t("recentEyebrow")}
        title={t("recentTitle")}
        description={t("recentDetail")}
        action={
          <Button variant="ghost" size="sm" render={<Link href="/documents" />}>
            {t("viewAll")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        }
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
        <StartProjectCard
          isDragging={isDragging}
          isImporting={isImporting}
          error={importError}
          onNewBlank={onNewBlank}
          onImport={onImport}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />

        {documents.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {documents.map((document) => (
              <RecentDocumentCard
                key={document.id}
                document={document}
                source={sourceLabel(
                  document,
                  libraryEntries,
                  brands,
                  sourceLabels
                )}
                onOpen={() => onOpenDocument(document.id)}
              />
            ))}
          </div>
        ) : (
          <div className="panel-surface grid min-h-56 place-items-center p-6 text-center">
            <FileText className="mb-3 h-8 w-8 text-muted-foreground/70" />
            <h3 className="text-sm font-semibold">{t("noRecent")}</h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              {t("noRecentDetail")}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function StartProjectCard({
  isDragging,
  isImporting,
  error,
  onNewBlank,
  onImport,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  isDragging: boolean
  isImporting: boolean
  error: string | null
  onNewBlank: () => void
  onImport: () => void
  onDragEnter: (event: DragEvent) => void
  onDragOver: (event: DragEvent) => void
  onDragLeave: (event: DragEvent) => void
  onDrop: (event: DragEvent) => void
}) {
  const t = useTranslations("Dashboard")
  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "panel-surface flex min-h-56 flex-col justify-between p-5 transition-colors",
        isDragging
          ? "border-primary bg-primary/[0.06]"
          : "border-border/80 bg-background/85"
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <span
            className={cn(
              "grid h-11 w-11 place-items-center rounded-md",
              isDragging
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            <Upload className="h-5 w-5" />
          </span>
          <span className="rounded-sm border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {t("maxFile")}
          </span>
        </div>
        <h3 className="mt-5 text-xl leading-tight font-semibold tracking-tight">
          {isImporting
            ? t("importing")
            : isDragging
              ? t("dropToImport")
              : t("startProject")}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t("importDetail")}
        </p>
        {error ? (
          <p className="mt-3 text-xs font-medium text-destructive">{error}</p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" onClick={onNewBlank}>
          <FilePlus className="h-3.5 w-3.5" />
          {t("newDraft")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onImport}
          disabled={isImporting}
        >
          <Upload className="h-3.5 w-3.5" />
          {t("chooseFiles")}
        </Button>
      </div>
    </div>
  )
}

function RecentDocumentCard({
  document,
  source,
  onOpen,
}: {
  document: WorkspaceDocument
  source: string
  onOpen: () => void
}) {
  const t = useTranslations("Dashboard")
  const locale = useLocale() as Locale
  const status = statusMeta(document.parseStatus, locale)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="panel-surface group flex min-h-56 flex-col justify-between p-4 text-left transition-colors hover:border-primary/35 hover:bg-muted/20 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none active:translate-y-px"
    >
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-sm border bg-muted/40">
            {document.pinned ? (
              <Pin className="h-4 w-4 text-primary" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
          {status ? (
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          ) : null}
        </div>
        <h3 className="mt-5 line-clamp-2 text-base leading-tight font-semibold tracking-tight">
          {document.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {source}
        </p>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5" />
          {formatRelativeTime(document.lastOpenedAt ?? document.updatedAt, {
            locale,
          })}
        </span>
        <span className="inline-flex items-center gap-1 font-medium text-primary">
          {t("open")}
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  )
}

function LibraryPreviewSection({
  entries,
  totalCount,
  categories,
  selectedCategory,
  onSelectCategory,
  onEditEntry,
}: {
  entries: LibraryEntry[]
  totalCount: number
  categories: [string, number][]
  selectedCategory: string
  onSelectCategory: (category: string) => void
  onEditEntry: (entry: LibraryEntry) => void
}) {
  const t = useTranslations("Dashboard")
  return (
    <section aria-labelledby="home-library">
      <SectionHeader
        id="home-library"
        eyebrow={t("libraryEyebrow")}
        title={t("libraryTitle")}
        description={t("libraryDetail")}
        count={t("libraryCount", { count: totalCount })}
        action={
          <Button variant="outline" size="sm" render={<Link href="/library" />}>
            {t("viewAll")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <CategoryButton
          active={selectedCategory === ALL_CATEGORY}
          onClick={() => onSelectCategory(ALL_CATEGORY)}
        >
          {t("all")}
          <span className="text-muted-foreground tabular-nums">
            {totalCount}
          </span>
        </CategoryButton>
        {categories.map(([category, count]) => (
          <CategoryButton
            key={category}
            active={selectedCategory === category}
            onClick={() => onSelectCategory(category)}
          >
            {category}
            <span className="text-muted-foreground tabular-nums">{count}</span>
          </CategoryButton>
        ))}
      </div>

      {entries.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <LibraryPreviewCard
              key={entry.id}
              entry={entry}
              onEdit={() => onEditEntry(entry)}
            />
          ))}
        </div>
      ) : (
        <EmptyBand
          icon={<LibraryIcon className="h-7 w-7" />}
          title={t("noLibrary")}
          description={t("noLibraryDetail")}
          action={
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/library" />}
            >
              {t("openLibrary")}
            </Button>
          }
        />
      )}
    </section>
  )
}

function CategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none active:translate-y-px",
        active
          ? "border-primary/35 bg-primary/10 text-foreground"
          : "border-border/70 bg-background/75 text-muted-foreground hover:border-primary/25 hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function LibraryPreviewCard({
  entry,
  onEdit,
}: {
  entry: LibraryEntry
  onEdit: () => void
}) {
  const t = useTranslations("Dashboard")
  const visibleTags = entry.tags.slice(0, 3)

  return (
    <article className="panel-surface flex min-h-52 flex-col p-4">
      <ColorStrip colors={entry.previewColors} />
      <div className="mt-4 min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-base font-semibold tracking-tight">
            {entry.name}
          </h3>
          {entry.favorited ? (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {t("favorite")}
            </Badge>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {entry.description || t("noDescription")}
        </p>
      </div>

      {(entry.category || visibleTags.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
          {entry.category ? (
            <span className="font-medium text-foreground/80">
              {entry.category}
            </span>
          ) : null}
          {visibleTags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-4">
        <Button size="sm" className="h-8 flex-1" onClick={onEdit}>
          <Palette className="h-3.5 w-3.5" />
          {t("editWorkspace")}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={`/library/${encodeURIComponent(entry.id)}`} />}
          title={t("viewDetails")}
          aria-label={t("viewNamed", { name: entry.name })}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  )
}

function BrandPreviewSection({
  brands,
  totalCount,
}: {
  brands: Brand[]
  totalCount: number
}) {
  const t = useTranslations("Dashboard")
  return (
    <section aria-labelledby="home-brands" className="pb-6">
      <SectionHeader
        id="home-brands"
        eyebrow={t("brandsEyebrow")}
        title={t("brandsTitle")}
        description={t("brandsDetail")}
        count={t("brandsCount", { count: totalCount })}
        action={
          <Button variant="outline" size="sm" render={<Link href="/brands" />}>
            {t("viewAll")}
          </Button>
        }
      />

      {brands.length > 0 ? (
        <div className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <BrandPreviewCard key={brand.id} brand={brand} />
            ))}
          </div>
          <div className="mt-6 flex justify-center border-t border-border/60 pt-5">
            <Button
              variant="outline"
              size="md"
              render={<Link href="/brands" />}
            >
              {t("viewAllBrands")}
            </Button>
          </div>
        </div>
      ) : (
        <EmptyBand
          icon={<SwatchBook className="h-7 w-7" />}
          title={t("brandsLoading")}
          description={t("brandsLoadingDetail")}
          action={
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/brands" />}
            >
              {t("openBrands")}
            </Button>
          }
        />
      )}
    </section>
  )
}

function HomeFooter() {
  const t = useTranslations("About")
  return (
    <footer className="border-t border-border/60 pt-6 pb-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>{t("homeFooter")}</p>
        <Link
          href="/about"
          className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
        >
          {t("navLabel")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </footer>
  )
}

function BrandPreviewCard({ brand }: { brand: Brand }) {
  const t = useTranslations("Dashboard")
  const visibleTags = brand.tags.slice(0, 3)

  return (
    <article className="panel-surface flex flex-col overflow-hidden">
      <BrandMedia
        imageUrl={brand.imageUrl}
        videoUrl={brand.videoUrl}
        name={brand.name}
        variant="card"
        videoMode="image-click"
      />
      <div className="flex flex-1 flex-col p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <BrandLogo faviconUrl={brand.faviconUrl} name={brand.name} />
            <h3 className="truncate text-base font-semibold tracking-tight">
              {brand.name}
            </h3>
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {brand.description}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground/80">
            {brand.category}
          </span>
          {visibleTags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>

        {brand.previewColors.length > 0 ? (
          <div className="mt-3 flex items-center gap-1.5">
            {brand.previewColors.slice(0, 6).map((color, index) => (
              <span
                key={`${color}-${index}`}
                className="h-4 w-4 rounded-full ring-1 ring-black/10 ring-inset"
                style={{ backgroundColor: color }}
                aria-hidden
              />
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Button
            size="sm"
            className="h-8 w-full"
            render={<Link href={`/brands/${encodeURIComponent(brand.id)}`} />}
            aria-label={t("viewNamed", { name: brand.name })}
          >
            {t("view")}
          </Button>
        </div>
      </div>
    </article>
  )
}

function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  count,
  action,
}: {
  id: string
  eyebrow: string
  title: string
  description: string
  count?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
            {eyebrow}
          </span>
          {count ? (
            <span className="rounded-sm border border-border bg-muted/35 px-2 py-1 text-[11px] text-muted-foreground">
              {count}
            </span>
          ) : null}
        </div>
        <h2
          id={id}
          className="mt-6 mb-3 text-2xl leading-tight font-semibold tracking-tight"
        >
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

function EmptyBand({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mt-4 grid place-items-center rounded-md border border-dashed border-border/80 bg-background/75 px-6 py-12 text-center">
      <div className="mb-3 text-muted-foreground/70">{icon}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
