"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  ArrowRight,
  FilePlus,
  FileText,
  Filter,
  FolderOpen,
  Inbox,
  Library,
  Pin,
  Tags,
  Upload,
} from "lucide-react"
import { useDesignStore } from "@/lib/store/design-store"
import { useUiPreferences } from "@/lib/store/ui-preferences"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ImportSummaryToast } from "@/components/import-summary-toast"
import { Sheet } from "@/components/ui/sheet"
import {
  ActiveFilterChips,
  type FilterChip,
} from "@/components/active-filter-chips"
import { TaxonomyManagerDialog } from "@/components/taxonomy/taxonomy-manager-dialog"
import { cn } from "@/lib/utils"
import { downloadBlob } from "@/lib/download"
import type { BatchImportResult, WorkspaceDocument } from "@/lib/types/tokens"
import { exportWorkspaceToZip } from "@/lib/export/export-zip"
import { SaveAsThemeDialog } from "@/components/theme-gallery-page/save-as-theme-dialog"
import { AddTagsDialog } from "./add-tags-dialog"
import { DocumentDetailsDialog } from "./document-details-dialog"
import { DocumentCard } from "./document-card"
import { GalleryToolbar, type SortKey, type ViewMode } from "./gallery-toolbar"
import { TagFilterSidebar } from "./tag-filter-sidebar"

function sortDocuments(documents: WorkspaceDocument[], sort: SortKey) {
  const copy = [...documents]
  switch (sort) {
    case "name":
      copy.sort((a, b) => a.name.localeCompare(b.name))
      break
    case "created":
      copy.sort((a, b) => b.createdAt - a.createdAt)
      break
    case "opened":
      copy.sort(
        (a, b) =>
          (b.lastOpenedAt ?? b.updatedAt) - (a.lastOpenedAt ?? a.updatedAt)
      )
      break
    case "updated":
    default:
      copy.sort((a, b) => b.updatedAt - a.updatedAt)
      break
  }
  return copy
}

export function WorkspaceGallery() {
  const router = useRouter()
  const t = useTranslations("Documents")
  const common = useTranslations("Common")
  const documents = useDesignStore((state) => state.documents)
  const switchDocument = useDesignStore((state) => state.switchDocument)
  const deleteDocument = useDesignStore((state) => state.deleteDocument)
  const setDocumentTags = useDesignStore((state) => state.setDocumentTags)
  const setDocumentCategory = useDesignStore(
    (state) => state.setDocumentCategory
  )
  const setDocumentPinned = useDesignStore((state) => state.setDocumentPinned)
  const renameDocument = useDesignStore((state) => state.renameDocument)
  const duplicateDocument = useDesignStore((state) => state.duplicateDocument)
  const createDocument = useDesignStore((state) => state.createDocument)
  const createDocumentsFromFiles = useDesignStore(
    (state) => state.createDocumentsFromFiles
  )
  const publishDocumentToLibrary = useDesignStore(
    (state) => state.publishDocumentToLibrary
  )

  const [search, setSearch] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [onlyPinned, setOnlyPinned] = useState(false)
  const [sort, setSort] = useState<SortKey>("updated")
  const [view, setView] = useState<ViewMode>("grid")
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailsDocumentId, setDetailsDocumentId] = useState<string | null>(
    null
  )
  const [bulkTagsDialogOpen, setBulkTagsDialogOpen] = useState(false)
  const [saveThemeDocumentId, setSaveThemeDocumentId] = useState<string | null>(
    null
  )
  const [importSummary, setImportSummary] = useState<BatchImportResult | null>(
    null
  )
  const [pendingDelete, setPendingDelete] = useState<
    { type: "single"; documentId: string } | { type: "bulk" } | null
  >(null)
  const [taxonomyOpen, setTaxonomyOpen] = useState(false)
  const [filterMobileOpen, setFilterMobileOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const resourceFilterCollapsed = useUiPreferences(
    (state) => state.resourceFilterCollapsed
  )
  const toggleResourceFilterCollapsed = useUiPreferences(
    (state) => state.toggleResourceFilterCollapsed
  )
  const legacyConflictCount = useMemo(
    () =>
      documents.filter((document) =>
        /（冲突副本）|\(Conflict copy\)/iu.test(document.name)
      ).length,
    [documents]
  )

  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const doc of documents) {
      for (const tag of doc.tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [documents])

  const allCategories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const doc of documents) {
      const category = doc.category?.trim()
      if (!category) continue
      counts.set(category, (counts.get(category) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [documents])

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return documents.filter((doc) => {
      if (onlyPinned && !doc.pinned) return false
      if (selectedCategory && doc.category !== selectedCategory) return false
      if (selectedTags.length > 0) {
        const docTags = doc.tags ?? []
        if (!selectedTags.every((tag) => docTags.includes(tag))) return false
      }
      if (normalized) {
        const haystack = [
          doc.name,
          doc.tokens.meta.name,
          doc.tokens.meta.description,
          doc.notes,
          ...(doc.tags ?? []),
          doc.category,
        ]
          .filter(Boolean)
          .map((value) => (value as string).toLowerCase())
          .join(" ")
        if (!haystack.includes(normalized)) return false
      }
      return true
    })
  }, [documents, search, selectedTags, selectedCategory, onlyPinned])

  const sorted = useMemo(() => sortDocuments(filtered, sort), [filtered, sort])

  const detailsDocument = useMemo(
    () => documents.find((doc) => doc.id === detailsDocumentId) ?? null,
    [documents, detailsDocumentId]
  )

  const saveThemeDocument = useMemo(
    () => documents.find((doc) => doc.id === saveThemeDocumentId) ?? null,
    [documents, saveThemeDocumentId]
  )

  const pendingDeleteDocument = useMemo(() => {
    if (pendingDelete?.type !== "single") return null
    return documents.find((doc) => doc.id === pendingDelete.documentId) ?? null
  }, [documents, pendingDelete])

  const pinnedSorted = useMemo(
    () => sorted.filter((doc) => doc.pinned),
    [sorted]
  )
  const restSorted = useMemo(
    () => sorted.filter((doc) => !doc.pinned),
    [sorted]
  )

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectAllVisible = useCallback(() => {
    setSelectedIds((current) => {
      const next = new Set(current)
      for (const document of sorted) next.add(document.id)
      return next
    })
  }, [sorted])

  const invertVisibleSelection = useCallback(() => {
    setSelectedIds((current) => {
      const next = new Set(current)
      for (const document of sorted) {
        if (next.has(document.id)) next.delete(document.id)
        else next.add(document.id)
      }
      return next
    })
  }, [sorted])

  const allVisibleSelected =
    sorted.length > 0 &&
    sorted.every((document) => selectedIds.has(document.id))

  const handleOpenDocument = useCallback(
    (id: string) => {
      switchDocument(id)
      router.push("/editor")
    },
    [switchDocument, router]
  )

  const handleNewBlank = useCallback(async () => {
    const id = await createDocument({ source: "blank" })
    if (id) router.push("/editor")
  }, [createDocument, router])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleUploadChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      event.target.value = ""
      if (files.length === 0) return

      const result = await createDocumentsFromFiles(files)
      const hasIssues = result.failed.length > 0 || result.skipped.length > 0
      if (result.totalCount === 1 && result.successCount === 1 && !hasIssues) {
        router.push("/editor")
        return
      }

      setImportSummary(result)
    },
    [createDocumentsFromFiles, router]
  )

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    setPendingDelete({ type: "bulk" })
  }, [selectedIds.size])

  const handleBulkExport = useCallback(() => {
    if (selectedIds.size === 0) return
    const subset = documents.filter((doc) => selectedIds.has(doc.id))
    if (subset.length === 0) return
    const blob = exportWorkspaceToZip(subset)
    downloadBlob(blob, `design-workspace-${Date.now()}.zip`)
  }, [selectedIds, documents])

  const handleBulkAddTag = useCallback(() => {
    if (selectedIds.size === 0) return
    setBulkTagsDialogOpen(true)
  }, [selectedIds.size])

  const handleSaveTheme = useCallback((documentId: string) => {
    setSaveThemeDocumentId(documentId)
  }, [])

  const isEmpty = documents.length === 0
  const activeFilterCount = useMemo(
    () =>
      (selectedCategory ? 1 : 0) +
      selectedTags.length +
      (onlyPinned ? 1 : 0) +
      (search.trim() ? 1 : 0),
    [selectedCategory, selectedTags, onlyPinned, search]
  )

  const galleryChips: FilterChip[] = []
  if (search.trim()) {
    galleryChips.push({
      key: "search",
      label: t("searchChip", { query: search.trim() }),
      onClear: () => setSearch(""),
    })
  }
  if (onlyPinned) {
    galleryChips.push({
      key: "pinned",
      label: t("pinnedOnly"),
      onClear: () => setOnlyPinned(false),
    })
  }
  if (selectedCategory) {
    galleryChips.push({
      key: "category",
      label: selectedCategory,
      onClear: () => setSelectedCategory(null),
    })
  }
  for (const tag of selectedTags) {
    galleryChips.push({
      key: `tag-${tag}`,
      label: tag,
      onClear: () =>
        setSelectedTags((current) => current.filter((value) => value !== tag)),
    })
  }
  const clearGalleryFilters = () => {
    setSelectedCategory(null)
    setSelectedTags([])
    setOnlyPinned(false)
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(45,109,195,0.035),transparent_220px)]">
      <TagFilterSidebar
        tags={allTags}
        categories={allCategories}
        selectedTags={selectedTags}
        selectedCategory={selectedCategory}
        onlyPinned={onlyPinned}
        onToggleTag={(tag) =>
          setSelectedTags((current) =>
            current.includes(tag)
              ? current.filter((value) => value !== tag)
              : [...current, tag]
          )
        }
        onClearTags={() => setSelectedTags([])}
        onSelectCategory={setSelectedCategory}
        onTogglePinned={() => setOnlyPinned((current) => !current)}
        totalCount={documents.length}
        collapsed={resourceFilterCollapsed}
        onToggleCollapsed={toggleResourceFilterCollapsed}
        search={search}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 bg-background/95 px-6 py-4">
          <div className="min-w-0">
            <h1 className="text-xl leading-tight font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {isEmpty ? (
                t("emptyTitle")
              ) : (
                <>
                  {t("shown", {
                    filtered: filtered.length,
                    total: documents.length,
                  })}
                  {activeFilterCount > 0
                    ? ` · ${t("filterCount", { count: activeFilterCount })}`
                    : ""}
                  {selectMode && selectedIds.size > 0 ? (
                    <>
                      {" · "}
                      <span className="font-medium text-foreground">
                        {t("selected", { count: selectedIds.size })}
                      </span>
                    </>
                  ) : null}
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setFilterMobileOpen(true)}
            >
              <Filter className="h-3.5 w-3.5" />
              {common("filters")}
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-foreground px-1.5 text-[10px] font-semibold text-background">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              multiple
              className="hidden"
              onChange={handleUploadChange}
            />
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/editor" />}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              {common("workspace")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleUploadClick}>
              <Upload className="h-3.5 w-3.5" />
              {t("upload")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTaxonomyOpen(true)}
              title={t("manageTaxonomy")}
            >
              <Tags className="h-3.5 w-3.5" />
              {t("taxonomy")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/library" />}
            >
              <Library data-icon="inline-start" />
              {t("library")}
            </Button>
            <Button size="sm" onClick={handleNewBlank}>
              <FilePlus className="h-3.5 w-3.5" />
              {t("newDraft")}
            </Button>
          </div>
        </div>

        {legacyConflictCount > 0 ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-amber-300/60 bg-amber-50/70 px-6 py-2.5 text-xs text-amber-950">
            <AlertTriangle className="size-4 shrink-0 text-amber-700" />
            <p className="min-w-0 flex-1 leading-5">
              {t("legacyConflicts", { count: legacyConflictCount })}
            </p>
            <Button
              variant="outline"
              size="xs"
              className="border-amber-300 bg-background/90"
              onClick={() => {
                setSearch("冲突副本")
                setSelectMode(true)
                clearSelection()
              }}
            >
              {t("reviewLegacyConflicts")}
            </Button>
          </div>
        ) : null}

        <GalleryToolbar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          view={view}
          onViewChange={setView}
          selectMode={selectMode}
          onToggleSelectMode={() => {
            setSelectMode((current) => !current)
            clearSelection()
          }}
          selectedCount={selectedIds.size}
          visibleCount={sorted.length}
          allVisibleSelected={allVisibleSelected}
          onSelectAll={selectAllVisible}
          onInvertSelection={invertVisibleSelection}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          onBulkAddTag={handleBulkAddTag}
        />

        <ActiveFilterChips
          chips={galleryChips}
          onClearAll={clearGalleryFilters}
          className="border-b border-border/60 bg-background/60 px-6 py-2"
        />

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {isEmpty ? (
            <EmptyState
              onNewBlank={handleNewBlank}
              onUploadClick={handleUploadClick}
            />
          ) : sorted.length === 0 ? (
            <div className="grid place-items-center rounded-md border border-dashed bg-background/80 px-6 py-16 text-center">
              <Inbox className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">{t("noMatch")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("noMatchDetail")}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {pinnedSorted.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    <Pin className="h-3 w-3" />
                    {t("pinned")}
                  </div>
                  <DocumentList
                    documents={pinnedSorted}
                    view={view}
                    selectMode={selectMode}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onOpen={handleOpenDocument}
                    onRename={(id, name) => renameDocument(id, name)}
                    onDuplicate={duplicateDocument}
                    onDelete={(id) => {
                      setPendingDelete({ type: "single", documentId: id })
                    }}
                    onTogglePinned={(id) => {
                      const doc = documents.find((item) => item.id === id)
                      if (!doc) return
                      setDocumentPinned(id, !doc.pinned)
                    }}
                    onEditMetadata={setDetailsDocumentId}
                    onSaveAsTheme={handleSaveTheme}
                  />
                </section>
              )}

              <section className="space-y-3">
                {pinnedSorted.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    <FileText className="h-3 w-3" />
                    {t("allDrafts")}
                  </div>
                )}
                <DocumentList
                  documents={restSorted}
                  view={view}
                  selectMode={selectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onOpen={handleOpenDocument}
                  onRename={(id, name) => renameDocument(id, name)}
                  onDuplicate={duplicateDocument}
                  onDelete={(id) => {
                    setPendingDelete({ type: "single", documentId: id })
                  }}
                  onTogglePinned={(id) => {
                    const doc = documents.find((item) => item.id === id)
                    if (!doc) return
                    setDocumentPinned(id, !doc.pinned)
                  }}
                  onEditMetadata={setDetailsDocumentId}
                  onSaveAsTheme={handleSaveTheme}
                />
              </section>
            </div>
          )}
        </div>
      </div>

      <DocumentDetailsDialog
        open={detailsDocument !== null}
        document={detailsDocument}
        onClose={() => setDetailsDocumentId(null)}
        onSave={(input) => {
          if (!detailsDocument) return
          setDocumentTags(detailsDocument.id, input.tags)
          setDocumentCategory(detailsDocument.id, input.category)
          setDetailsDocumentId(null)
        }}
      />

      <AddTagsDialog
        open={bulkTagsDialogOpen}
        selectedCount={selectedIds.size}
        onClose={() => setBulkTagsDialogOpen(false)}
        onSave={(tags) => {
          for (const id of selectedIds) {
            const doc = documents.find((item) => item.id === id)
            if (!doc) continue
            const next = Array.from(new Set([...(doc.tags ?? []), ...tags]))
            setDocumentTags(id, next)
          }
          setBulkTagsDialogOpen(false)
        }}
      />

      <SaveAsThemeDialog
        open={saveThemeDocument !== null}
        onClose={() => setSaveThemeDocumentId(null)}
        document={saveThemeDocument}
        onSave={(input) => {
          if (!saveThemeDocument) return
          publishDocumentToLibrary(saveThemeDocument.id, input, { mode: "new" })
          setSaveThemeDocumentId(null)
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete?.type === "bulk" ? t("deleteSelected") : t("deleteOne")
        }
        description={
          pendingDelete?.type === "bulk"
            ? t("deleteSelectedDetail", { count: selectedIds.size })
            : pendingDeleteDocument
              ? t("deleteOneDetail", { name: pendingDeleteDocument.name })
              : undefined
        }
        confirmLabel={common("delete")}
        tone="destructive"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          if (pendingDelete.type === "bulk") {
            for (const id of selectedIds) {
              deleteDocument(id)
            }
            clearSelection()
          } else {
            deleteDocument(pendingDelete.documentId)
          }
          setPendingDelete(null)
        }}
      />
      <ImportSummaryToast
        result={importSummary}
        onDismiss={() => setImportSummary(null)}
        onOpenLatest={() => {
          const latestId = importSummary?.createdIds.at(-1)
          if (!latestId) return
          setImportSummary(null)
          handleOpenDocument(latestId)
        }}
      />
      <TaxonomyManagerDialog
        open={taxonomyOpen}
        onOpenChange={setTaxonomyOpen}
      />

      {/* Mobile filter drawer (§5.1). */}
      <Sheet
        open={filterMobileOpen}
        onClose={() => setFilterMobileOpen(false)}
        side="right"
        className="w-[300px] p-0"
      >
        <TagFilterSidebar
          tags={allTags}
          categories={allCategories}
          selectedTags={selectedTags}
          selectedCategory={selectedCategory}
          onlyPinned={onlyPinned}
          onToggleTag={(tag) =>
            setSelectedTags((current) =>
              current.includes(tag)
                ? current.filter((value) => value !== tag)
                : [...current, tag]
            )
          }
          onClearTags={() => setSelectedTags([])}
          onSelectCategory={setSelectedCategory}
          onTogglePinned={() => setOnlyPinned((current) => !current)}
          totalCount={documents.length}
          search={search}
          overlay
        />
      </Sheet>
    </div>
  )
}

interface DocumentListProps {
  documents: WorkspaceDocument[]
  view: ViewMode
  selectMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onOpen: (id: string) => void
  onRename: (id: string, name: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onTogglePinned: (id: string) => void
  onEditMetadata: (id: string) => void
  onSaveAsTheme: (id: string) => void
}

function DocumentList({
  documents,
  view,
  selectMode,
  selectedIds,
  onToggleSelect,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onTogglePinned,
  onEditMetadata,
  onSaveAsTheme,
}: DocumentListProps) {
  return (
    <div
      className={cn(
        view === "grid"
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "flex flex-col gap-2"
      )}
    >
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          view={view}
          selectMode={selectMode}
          selected={selectedIds.has(document.id)}
          onToggleSelect={() => onToggleSelect(document.id)}
          onOpen={() => onOpen(document.id)}
          onRename={(name) => onRename(document.id, name)}
          onDuplicate={() => onDuplicate(document.id)}
          onDelete={() => onDelete(document.id)}
          onTogglePinned={() => onTogglePinned(document.id)}
          onEditMetadata={() => onEditMetadata(document.id)}
          onSaveAsTheme={() => onSaveAsTheme(document.id)}
        />
      ))}
    </div>
  )
}

function EmptyState({
  onNewBlank,
  onUploadClick,
}: {
  onNewBlank: () => void
  onUploadClick: () => void
}) {
  const t = useTranslations("Documents")

  return (
    <div className="grid place-items-center rounded-md border border-dashed bg-background/80 px-6 py-20 text-center">
      <FileText className="mb-4 h-10 w-10 text-muted-foreground" />
      <h2 className="text-base font-semibold">{t("emptyLocal")}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t("emptyLocalDetail")}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button size="sm" onClick={onNewBlank}>
          <FilePlus className="h-3.5 w-3.5" />
          {t("newDraft")}
        </Button>
        <Button variant="outline" size="sm" onClick={onUploadClick}>
          <Upload className="h-3.5 w-3.5" />
          {t("upload")}
        </Button>
        <Button variant="outline" size="sm" render={<Link href="/library" />}>
          <Library data-icon="inline-start" />
          {t("browseLibrary")}
        </Button>
      </div>
    </div>
  )
}
