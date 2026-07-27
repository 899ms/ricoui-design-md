"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { AnimatePresence, motion } from "motion/react"
import {
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Filter,
  FolderOpen,
  Plus,
  SearchX,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { useDesignStore } from "@/lib/store/design-store"
import { useUiPreferences } from "@/lib/store/ui-preferences"
import type { ThemePreset, UserTheme } from "@/lib/types/tokens"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet } from "@/components/ui/sheet"
import {
  ActiveFilterChips,
  type FilterChip,
} from "@/components/active-filter-chips"
import { PageInfoButton } from "@/components/page-info-button"
import { TaxonomyManagerDialog } from "@/components/taxonomy/taxonomy-manager-dialog"
import { cn } from "@/lib/utils"
import { setProjectUrlInMarkdown } from "@/lib/library/project-url"
import { ThemeCard } from "./theme-card"
import { BrandCard } from "./brand-card"
import {
  ThemeFilterSidebar,
  UNCATEGORIZED_KEY,
  type ThemeSource,
} from "./theme-filter-sidebar"
import { EditThemeDialog } from "./edit-theme-dialog"
import { SaveAsThemeDialog } from "./save-as-theme-dialog"
import {
  getMarkdownDocumentCapability,
  type DocumentCapabilityLevel,
} from "@/lib/document-capability"
type ThemeGalleryMode = "all" | "library" | "brands"
const GALLERY_PAGE_SIZE = 24

export interface UnifiedThemeEntry {
  id: string
  origin: "brand" | "library"
  name: string
  description: string
  createdAt?: number
  tags: string[]
  category?: string
  previewColors: string[]
  metadataChips: ThemePreset["metadataChips"]
  themeMode?: "light" | "dark"
  mdContent: string
  folder?: string
  files?: string[]
  designMdUrl?: string
  previewUrl?: string
  tokensUrl?: string
  variablesUrl?: string
  themeCssUrl?: string
  imageUrl?: string
  faviconUrl?: string
  videoUrl?: string
  isComplete?: boolean
  missingFiles?: string[]
  capability?: DocumentCapabilityLevel
}

function detectThemeMode(mdContent: string): "light" | "dark" | undefined {
  const match = mdContent.match(/\*\*Theme:\*\*\s*(light|dark)/i)
  return (match?.[1]?.toLowerCase() as "light" | "dark") ?? undefined
}

function presetToEntry(preset: ThemePreset): UnifiedThemeEntry {
  return {
    id: preset.id,
    origin: "brand",
    name: preset.name,
    description: preset.description,
    tags: preset.tags,
    category: preset.category,
    previewColors: preset.previewColors,
    metadataChips: preset.metadataChips,
    themeMode:
      detectThemeMode(preset.mdContent) ??
      (preset.tags.includes("Dark UI")
        ? "dark"
        : preset.tags.includes("Light UI")
          ? "light"
          : undefined),
    mdContent: preset.mdContent,
    folder: preset.folder,
    files: preset.files,
    designMdUrl: preset.designMdUrl,
    previewUrl: preset.previewUrl,
    tokensUrl: preset.tokensUrl,
    variablesUrl: preset.variablesUrl,
    themeCssUrl: preset.themeCssUrl,
    imageUrl: preset.imageUrl,
    faviconUrl: preset.faviconUrl,
    videoUrl: preset.videoUrl,
    isComplete: preset.isComplete,
    missingFiles: preset.missingFiles,
  }
}

function userThemeToEntry(theme: UserTheme): UnifiedThemeEntry {
  return {
    id: theme.id,
    origin: "library",
    name: theme.name,
    description: theme.description,
    createdAt: theme.createdAt,
    tags: theme.tags,
    category: theme.category,
    previewColors: theme.previewColors,
    metadataChips: theme.metadataChips,
    themeMode: detectThemeMode(theme.mdContent),
    mdContent: theme.mdContent,
    capability: getMarkdownDocumentCapability(theme.mdContent).level,
  }
}

export function ThemeGalleryPage({
  mode = "all",
}: {
  mode?: ThemeGalleryMode
}) {
  const t = useTranslations("Gallery")
  const common = useTranslations("Common")
  const router = useRouter()
  const brands = useDesignStore((state) => state.brands)
  const userThemes = useDesignStore((state) => state.libraryEntries)
  const brandFavorites = useDesignStore((state) => state.brandFavorites)
  const documents = useDesignStore((state) => state.documents)
  const activeDocumentId = useDesignStore((state) => state.activeDocumentId)
  const createDocument = useDesignStore((state) => state.createDocument)
  const switchDocument = useDesignStore((state) => state.switchDocument)
  const toggleLibraryEntryFavorite = useDesignStore(
    (state) => state.toggleLibraryEntryFavorite
  )
  const toggleBrandFavorite = useDesignStore(
    (state) => state.toggleBrandFavorite
  )
  const saveBrandToLibrary = useDesignStore((state) => state.saveBrandToLibrary)
  const renameLibraryEntry = useDesignStore((state) => state.renameLibraryEntry)
  const updateLibraryEntry = useDesignStore((state) => state.updateLibraryEntry)
  const deleteLibraryEntry = useDesignStore((state) => state.deleteLibraryEntry)
  const deleteLibraryEntries = useDesignStore(
    (state) => state.deleteLibraryEntries
  )
  const publishDocumentToLibrary = useDesignStore(
    (state) => state.publishDocumentToLibrary
  )

  const [source, setSource] = useState<ThemeSource>(
    mode === "library" ? "library" : mode === "brands" ? "brand" : "all"
  )
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<"light" | "dark" | null>(
    null
  )
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null)
  const [pendingDeleteThemeId, setPendingDeleteThemeId] = useState<
    string | null
  >(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<string>>(
    () => new Set()
  )
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false)
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)
  const resourceFilterCollapsed = useUiPreferences(
    (state) => state.resourceFilterCollapsed
  )
  const toggleResourceFilterCollapsed = useUiPreferences(
    (state) => state.toggleResourceFilterCollapsed
  )
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [taxonomyOpen, setTaxonomyOpen] = useState(false)
  const [filterMobileOpen, setFilterMobileOpen] = useState(false)
  const [pagination, setPagination] = useState({
    key: "",
    count: GALLERY_PAGE_SIZE,
  })
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null)
  const [toast, setToast] = useState<{
    message: string
    tone: "warning" | "info"
  } | null>(null)
  const isLibraryOnly = mode === "library"
  const isBrandsOnly = mode === "brands"
  const showSourceFilters = mode === "all"
  const pageCopy = isLibraryOnly
    ? {
        label: t("library.label"),
        eyebrow: t("library.eyebrow"),
        title: t("library.title"),
        countNoun: t("library.noun"),
        description: t("library.description"),
        infoLabel: t("library.infoLabel"),
        infoTitle: t("library.infoTitle"),
        infoBullets: [
          t("library.info1"),
          t("library.info2"),
          t("library.info3"),
        ],
      }
    : isBrandsOnly
      ? {
          label: t("brands.label"),
          eyebrow: t("brands.eyebrow"),
          title: t("brands.title"),
          countNoun: t("brands.noun"),
          description: t("brands.description"),
          infoLabel: t("brands.infoLabel"),
          infoTitle: t("brands.infoTitle"),
          infoBullets: [
            t("brands.info1"),
            t("brands.info2"),
            t("brands.info3"),
          ],
        }
      : {
          label: t("all.label"),
          eyebrow: t("all.eyebrow"),
          title: t("all.title"),
          countNoun: t("all.noun"),
          description: t("all.description"),
          infoLabel: "",
          infoTitle: "",
          infoBullets: [],
        }
  const showInfoButton = pageCopy.infoBullets.length > 0

  const activeDocument =
    documents.find((doc) => doc.id === activeDocumentId) ?? null

  const builtinEntries = useMemo(() => brands.map(presetToEntry), [brands])

  const userEntries = useMemo(
    () => userThemes.map(userThemeToEntry),
    [userThemes]
  )

  const sourceEntries = useMemo(() => {
    if (isLibraryOnly) return userEntries
    if (isBrandsOnly) return builtinEntries
    switch (source) {
      case "brand":
        return builtinEntries
      case "library":
        return userEntries
      case "all":
      default:
        return [...userEntries, ...builtinEntries]
    }
  }, [source, builtinEntries, userEntries, isLibraryOnly, isBrandsOnly])

  const userThemeFavoriteIds = useMemo(
    () =>
      new Set(
        userThemes.filter((entry) => entry.favorited).map((entry) => entry.id)
      ),
    [userThemes]
  )
  const brandFavoriteIds = useMemo(
    () => new Set(brandFavorites),
    [brandFavorites]
  )

  const isEntryFavorited = useCallback(
    (entry: UnifiedThemeEntry) => {
      if (entry.origin === "library") return userThemeFavoriteIds.has(entry.id)
      return brandFavoriteIds.has(entry.id)
    },
    [userThemeFavoriteIds, brandFavoriteIds]
  )

  const favoritesCount = useMemo(
    () => sourceEntries.filter(isEntryFavorited).length,
    [sourceEntries, isEntryFavorited]
  )

  const allCategories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entry of sourceEntries) {
      if (!entry.category) continue
      counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [sourceEntries])

  const uncategorizedCount = useMemo(
    () => sourceEntries.filter((entry) => !entry.category).length,
    [sourceEntries]
  )

  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entry of sourceEntries) {
      for (const tag of entry.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
  }, [sourceEntries])

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return sourceEntries.filter((entry) => {
      if (favoritesOnly && !isEntryFavorited(entry)) return false
      if (selectedCategory === UNCATEGORIZED_KEY) {
        if (entry.category) return false
      } else if (selectedCategory && entry.category !== selectedCategory) {
        return false
      }
      if (selectedMode && entry.themeMode !== selectedMode) return false
      if (selectedTags.length > 0) {
        if (!selectedTags.every((tag) => entry.tags.includes(tag))) return false
      }
      if (normalized) {
        const haystack = [entry.name, entry.description, ...entry.tags]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(normalized)) return false
      }
      return true
    })
  }, [
    sourceEntries,
    search,
    selectedCategory,
    selectedMode,
    selectedTags,
    favoritesOnly,
    isEntryFavorited,
  ])

  const paginationKey = `${source}\u0000${search}\u0000${selectedCategory ?? ""}\u0000${selectedMode ?? ""}\u0000${selectedTags.join("\u0001")}\u0000${favoritesOnly}`
  const visibleCount =
    pagination.key === paginationKey ? pagination.count : GALLERY_PAGE_SIZE

  const visibleEntries = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  )

  const filteredLibraryIds = useMemo(
    () =>
      filtered
        .filter((entry) => entry.origin === "library")
        .map((entry) => entry.id),
    [filtered]
  )
  const allFilteredLibraryEntriesSelected =
    filteredLibraryIds.length > 0 &&
    filteredLibraryIds.every((id) => selectedLibraryIds.has(id))
  const selectedLibraryIdList = useMemo(
    () =>
      userEntries
        .filter((entry) => selectedLibraryIds.has(entry.id))
        .map((entry) => entry.id),
    [selectedLibraryIds, userEntries]
  )
  const selectedLibraryCount = selectedLibraryIdList.length

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current
    if (!sentinel || visibleEntries.length >= filtered.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        setPagination((current) => ({
          key: paginationKey,
          count: Math.min(
            (current.key === paginationKey
              ? current.count
              : GALLERY_PAGE_SIZE) + GALLERY_PAGE_SIZE,
            filtered.length
          ),
        }))
      },
      { rootMargin: "320px 0px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [filtered.length, paginationKey, visibleEntries.length])

  const effectiveSelectedId = useMemo(() => {
    if (filtered.length === 0) return null
    const stillVisible =
      selectedThemeId !== null &&
      filtered.some((entry) => entry.id === selectedThemeId)
    return stillVisible ? selectedThemeId : null
  }, [filtered, selectedThemeId])

  const editingEntry = useMemo(
    () => userEntries.find((entry) => entry.id === editingThemeId) ?? null,
    [userEntries, editingThemeId]
  )

  const pendingDeleteEntry = useMemo(
    () =>
      userEntries.find((entry) => entry.id === pendingDeleteThemeId) ?? null,
    [userEntries, pendingDeleteThemeId]
  )

  const handleOpen = useCallback((id: string) => {
    setSelectedThemeId(id)
  }, [])

  const handleOpenBrand = useCallback(
    (entry: UnifiedThemeEntry) => {
      if (entry.origin !== "brand") {
        handleOpen(entry.id)
        return
      }
      router.push(`/brands/${encodeURIComponent(entry.id)}`)
    },
    [handleOpen, router]
  )

  const handleOpenLibrary = useCallback(
    (entry: UnifiedThemeEntry) => {
      if (entry.origin !== "library") {
        handleOpen(entry.id)
        return
      }
      router.push(`/library/${encodeURIComponent(entry.id)}`)
    },
    [handleOpen, router]
  )

  // Deep-link support (V6 search → `/library?focus=` / `/brands?focus=`):
  // when the gallery is opened with a `focus` query param, expand the matching
  // entry's in-place preview so the user lands on the detail/preview flow with
  // all source-specific actions intact. Consumed once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return
    const focusId = new URLSearchParams(window.location.search).get("focus")
    if (!focusId) return
    const exists = sourceEntries.some((entry) => entry.id === focusId)
    if (!exists) return
    if (isBrandsOnly) {
      router.push(`/brands/${encodeURIComponent(focusId)}`)
      return
    }
    if (isLibraryOnly) {
      router.push(`/library/${encodeURIComponent(focusId)}`)
      return
    }
    const timer = window.setTimeout(() => handleOpen(focusId), 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceEntries])

  const handleUse = useCallback(
    async (entry: UnifiedThemeEntry) => {
      const id = await createDocument({
        source: entry.origin,
        sourceId: entry.id,
      })
      if (id) router.push("/editor")
    },
    [createDocument, router]
  )

  const handleEditLibrary = useCallback(
    async (entry: UnifiedThemeEntry) => {
      if (entry.origin !== "library") return
      const related = documents
        .filter(
          (doc) => doc.origin.kind === "library" && doc.origin.id === entry.id
        )
        .sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))
      const existing = related[0]

      if (existing) {
        const isDirty = existing.rawMarkdown !== existing.initialRawMarkdown
        if (existing.id !== activeDocumentId) {
          switchDocument(existing.id)
        }
        if (isDirty) {
          setToast({
            message: t("unsavedLibraryEdit", { name: existing.name }),
            tone: "warning",
          })
        }
        router.push("/editor")
        return
      }

      const id = await createDocument({
        source: "library",
        sourceId: entry.id,
      })
      if (id) router.push("/editor")
    },
    [documents, activeDocumentId, switchDocument, createDocument, router, t]
  )

  const handleSaveBrandToLibrary = useCallback(
    async (entry: UnifiedThemeEntry) => {
      if (entry.origin !== "brand") return
      const id = await saveBrandToLibrary(entry.id)
      if (id) {
        if (!isBrandsOnly) {
          setSource("library")
        }
        setSelectedThemeId(id)
        setToast({
          message: t("savedBrand", { name: entry.name }),
          tone: "info",
        })
      }
    },
    [saveBrandToLibrary, isBrandsOnly, t]
  )

  const handleToggleFavorite = useCallback(
    (entry: UnifiedThemeEntry) => {
      if (entry.origin === "library") {
        toggleLibraryEntryFavorite(entry.id)
      } else {
        toggleBrandFavorite(entry.id)
      }
    },
    [toggleLibraryEntryFavorite, toggleBrandFavorite]
  )

  const handleOpenEditDialog = useCallback((entry: UnifiedThemeEntry) => {
    if (entry.origin !== "library") return
    setEditingThemeId(entry.id)
    setEditDialogOpen(true)
  }, [])

  const handleRequestDeleteUser = useCallback((entry: UnifiedThemeEntry) => {
    if (entry.origin !== "library") return
    setPendingDeleteThemeId(entry.id)
  }, [])

  const toggleLibrarySelection = useCallback((libraryId: string) => {
    setSelectedLibraryIds((current) => {
      const next = new Set(current)
      if (next.has(libraryId)) next.delete(libraryId)
      else next.add(libraryId)
      return next
    })
  }, [])

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedLibraryIds(new Set())
  }, [])

  const toggleAllFilteredLibraryEntries = useCallback(() => {
    setSelectedLibraryIds((current) => {
      const next = new Set(current)
      const allSelected = filteredLibraryIds.every((id) => next.has(id))
      for (const id of filteredLibraryIds) {
        if (allSelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }, [filteredLibraryIds])

  const sourceCounts = useMemo(
    () => ({
      brand: builtinEntries.length,
      library: userEntries.length,
      all: builtinEntries.length + userEntries.length,
    }),
    [builtinEntries.length, userEntries.length]
  )

  const activeFilterCount =
    (selectedMode ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    selectedTags.length +
    (favoritesOnly ? 1 : 0) +
    (search.trim() ? 1 : 0)

  const galleryChips: FilterChip[] = []
  if (search.trim()) {
    galleryChips.push({
      key: "search",
      label: t("searchChip", { query: search.trim() }),
      onClear: () => setSearch(""),
    })
  }
  if (favoritesOnly) {
    galleryChips.push({
      key: "fav",
      label: t("favoritesOnly"),
      onClear: () => setFavoritesOnly(false),
    })
  }
  if (selectedMode) {
    galleryChips.push({
      key: "mode",
      label: selectedMode === "light" ? common("light") : common("dark"),
      onClear: () => setSelectedMode(null),
    })
  }
  if (selectedCategory) {
    galleryChips.push({
      key: "category",
      label:
        selectedCategory === UNCATEGORIZED_KEY
          ? t("uncategorized")
          : selectedCategory,
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
    setSelectedMode(null)
    setSelectedCategory(null)
    setSelectedTags([])
    setFavoritesOnly(false)
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <ThemeFilterSidebar
        source={source}
        onSourceChange={(next) => {
          setSource(next)
          setSelectedCategory(null)
          setSelectedTags([])
          setFavoritesOnly(false)
        }}
        sourceCounts={sourceCounts}
        selectedMode={selectedMode}
        onSelectMode={setSelectedMode}
        categories={allCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        uncategorizedCount={uncategorizedCount}
        favoritesOnly={favoritesOnly}
        favoritesCount={favoritesCount}
        onToggleFavoritesOnly={() => setFavoritesOnly((current) => !current)}
        tags={allTags}
        selectedTags={selectedTags}
        onToggleTag={(tag) =>
          setSelectedTags((current) =>
            current.includes(tag)
              ? current.filter((value) => value !== tag)
              : [...current, tag]
          )
        }
        onClearTags={() => setSelectedTags([])}
        search={search}
        onSearchChange={setSearch}
        collapsed={resourceFilterCollapsed}
        onToggleCollapsed={toggleResourceFilterCollapsed}
        onOpenTaxonomyManager={
          isBrandsOnly ? undefined : () => setTaxonomyOpen(true)
        }
        showSourceFilters={showSourceFilters}
      />

      <div className="flex min-w-0 flex-1 flex-row bg-[linear-gradient(180deg,rgba(45,109,195,0.035),transparent_220px)]">
        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 bg-background/95 px-7 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl leading-tight font-semibold tracking-tight">
                  {pageCopy.label}
                </h1>
                {showInfoButton && (
                  <PageInfoButton
                    label={pageCopy.infoLabel}
                    title={pageCopy.infoTitle}
                    bullets={pageCopy.infoBullets}
                  />
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {sourceEntries.length === 0
                  ? isBrandsOnly
                    ? t("noBrands")
                    : t("noEntries")
                  : (() => {
                      const parts: string[] = []
                      if (showSourceFilters) {
                        parts.push(
                          t("filteredCount", {
                            filtered: filtered.length,
                            total: sourceEntries.length,
                            noun: pageCopy.countNoun,
                          })
                        )
                      } else {
                        parts.push(
                          t("count", {
                            count: filtered.length,
                            noun: pageCopy.countNoun,
                          })
                        )
                      }
                      if (selectedMode) {
                        parts.push(
                          selectedMode === "light"
                            ? common("light")
                            : common("dark")
                        )
                      }
                      if (selectedCategory) parts.push(selectedCategory)
                      const activeFilterCount =
                        (selectedMode ? 1 : 0) +
                        (selectedCategory ? 1 : 0) +
                        selectedTags.length +
                        (favoritesOnly ? 1 : 0) +
                        (search.trim() ? 1 : 0)
                      if (activeFilterCount > 0)
                        parts.push(
                          t("filterCount", { count: activeFilterCount })
                        )
                      return parts.join(" · ")
                    })()}
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
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/editor" />}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                {common("workspace")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              {isLibraryOnly && (
                <Button
                  variant={selectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (selectionMode) exitSelectionMode()
                    else setSelectionMode(true)
                  }}
                  disabled={!selectionMode && userEntries.length === 0}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  {selectionMode ? common("done") : t("batch.select")}
                </Button>
              )}
              {!isBrandsOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSaveDialogOpen(true)}
                  disabled={!activeDocument}
                  title={
                    activeDocument ? t("saveCurrentTitle") : t("openDraftFirst")
                  }
                  className="h-8"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("createFromDraft")}
                </Button>
              )}
            </div>
          </div>

          <ActiveFilterChips
            chips={galleryChips}
            onClearAll={clearGalleryFilters}
            className="border-b border-border/60 bg-background/60 px-7 py-2"
          />

          {isLibraryOnly && selectionMode && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-muted/25 px-7 py-2.5">
              <p className="text-xs font-medium text-foreground">
                {t("batch.selected", { count: selectedLibraryCount })}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllFilteredLibraryEntries}
                  disabled={filteredLibraryIds.length === 0}
                >
                  {allFilteredLibraryEntriesSelected
                    ? t("batch.unselectFiltered", {
                        count: filteredLibraryIds.length,
                      })
                    : t("batch.selectFiltered", {
                        count: filteredLibraryIds.length,
                      })}
                </Button>
                {selectedLibraryCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLibraryIds(new Set())}
                  >
                    {common("clear")}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setPendingBulkDelete(true)}
                  disabled={selectedLibraryCount === 0}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("batch.delete", { count: selectedLibraryCount })}
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="@container px-7 py-6">
              {filtered.length === 0 ? (
                <div className="grid place-items-center rounded-md border border-dashed border-border/70 bg-background/80 px-6 py-20 text-center">
                  {isLibraryOnly || source === "library" ? (
                    <>
                      <Star className="mb-3 h-7 w-7 text-muted-foreground/70" />
                      <p className="text-sm font-medium">
                        {isLibraryOnly ? t("emptyLibrary") : t("emptySaved")}
                      </p>
                      <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
                        {t("emptyLibraryDetail")}
                      </p>
                    </>
                  ) : (
                    <>
                      <SearchX className="mb-3 h-7 w-7 text-muted-foreground/70" />
                      <p className="text-sm font-medium">
                        {t("noFilterMatch")}
                      </p>
                      <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                        {t("noFilterMatchDetail")}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div
                  className={cn(
                    "grid grid-cols-1 gap-4 gap-y-6 @lg:grid-cols-2 @lg:gap-6 @lg:gap-y-8 @4xl:grid-cols-3",
                    isLibraryOnly && "@6xl:grid-cols-4"
                  )}
                >
                  {visibleEntries.map((entry) =>
                    entry.origin === "brand" ? (
                      <BrandCard
                        key={`${entry.origin}-${entry.id}`}
                        entry={entry}
                        isSelected={entry.id === effectiveSelectedId}
                        favorited={isEntryFavorited(entry)}
                        onToggleFavorite={() => handleToggleFavorite(entry)}
                        onSelect={() => handleOpenBrand(entry)}
                        onOpen={() => handleOpenBrand(entry)}
                        onUse={() => handleUse(entry)}
                        onSaveToLibrary={() => handleSaveBrandToLibrary(entry)}
                      />
                    ) : (
                      <ThemeCard
                        key={`${entry.origin}-${entry.id}`}
                        entry={entry}
                        isSelected={
                          !selectionMode && entry.id === effectiveSelectedId
                        }
                        selectionMode={selectionMode && isLibraryOnly}
                        selectionSelected={selectedLibraryIds.has(entry.id)}
                        favorited={isEntryFavorited(entry)}
                        onToggleFavorite={() => handleToggleFavorite(entry)}
                        onSelect={
                          selectionMode && isLibraryOnly
                            ? () => toggleLibrarySelection(entry.id)
                            : isLibraryOnly
                              ? () => handleOpenLibrary(entry)
                              : () => handleOpen(entry.id)
                        }
                        onOpen={
                          isLibraryOnly
                            ? () => handleOpenLibrary(entry)
                            : () => handleOpen(entry.id)
                        }
                        onEdit={
                          entry.origin === "library"
                            ? () => handleEditLibrary(entry)
                            : undefined
                        }
                        onEditMetadata={
                          !isBrandsOnly && entry.origin === "library"
                            ? () => handleOpenEditDialog(entry)
                            : undefined
                        }
                        onDelete={
                          !isBrandsOnly && entry.origin === "library"
                            ? () => handleRequestDeleteUser(entry)
                            : undefined
                        }
                      />
                    )
                  )}
                </div>
              )}
              {visibleEntries.length < filtered.length && (
                <div
                  ref={loadMoreSentinelRef}
                  className="flex flex-col items-center gap-2 py-8"
                  aria-live="polite"
                >
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {t("loadingMore", {
                      visible: visibleEntries.length,
                      total: filtered.length,
                    })}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <InlineToast toast={toast} onDismiss={() => setToast(null)} />

      <TaxonomyManagerDialog
        open={taxonomyOpen}
        onOpenChange={setTaxonomyOpen}
      />

      {/* Mobile filter drawer (§6.2 / §8.2 / §9.2). */}
      <Sheet
        open={filterMobileOpen}
        onClose={() => setFilterMobileOpen(false)}
        side="right"
        className="w-[300px] p-0"
      >
        <ThemeFilterSidebar
          source={source}
          onSourceChange={(next) => {
            setSource(next)
            setSelectedCategory(null)
            setSelectedTags([])
            setFavoritesOnly(false)
          }}
          sourceCounts={sourceCounts}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          categories={allCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          uncategorizedCount={uncategorizedCount}
          favoritesOnly={favoritesOnly}
          favoritesCount={favoritesCount}
          onToggleFavoritesOnly={() => setFavoritesOnly((current) => !current)}
          tags={allTags}
          selectedTags={selectedTags}
          onToggleTag={(tag) =>
            setSelectedTags((current) =>
              current.includes(tag)
                ? current.filter((value) => value !== tag)
                : [...current, tag]
            )
          }
          onClearTags={() => setSelectedTags([])}
          search={search}
          onSearchChange={setSearch}
          onOpenTaxonomyManager={
            isBrandsOnly ? undefined : () => setTaxonomyOpen(true)
          }
          showSourceFilters={showSourceFilters}
          overlay
        />
      </Sheet>

      <SaveAsThemeDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        document={activeDocument}
        onSave={(input) => {
          if (!activeDocument) return
          const id = publishDocumentToLibrary(activeDocument.id, input, {
            mode: "new",
          })
          if (id) {
            setSaveDialogOpen(false)
            if (!isBrandsOnly) {
              setSource("library")
            }
          }
        }}
      />

      {!isBrandsOnly && (
        <EditThemeDialog
          open={editDialogOpen}
          entry={editingEntry}
          onClose={() => {
            setEditDialogOpen(false)
            setEditingThemeId(null)
          }}
          onSave={(input) => {
            if (!editingEntry) return
            renameLibraryEntry(editingEntry.id, input.name)
            updateLibraryEntry(editingEntry.id, {
              description: input.description,
              mdContent: setProjectUrlInMarkdown(
                editingEntry.mdContent,
                input.projectUrl
              ),
              tags: input.tags,
              category: input.category,
            })
            setEditDialogOpen(false)
            setEditingThemeId(null)
          }}
          onDelete={
            editingEntry
              ? () => setPendingDeleteThemeId(editingEntry.id)
              : undefined
          }
        />
      )}

      {!isBrandsOnly && (
        <ConfirmDialog
          open={pendingDeleteEntry !== null}
          title={t("deleteTitle")}
          description={
            pendingDeleteEntry
              ? t("deleteDescription", { name: pendingDeleteEntry.name })
              : undefined
          }
          confirmLabel={common("delete")}
          tone="destructive"
          onClose={() => setPendingDeleteThemeId(null)}
          onConfirm={() => {
            if (!pendingDeleteEntry) return
            deleteLibraryEntry(pendingDeleteEntry.id)
            if (editingThemeId === pendingDeleteEntry.id) {
              setEditDialogOpen(false)
              setEditingThemeId(null)
            }
            setPendingDeleteThemeId(null)
          }}
        />
      )}

      {isLibraryOnly && (
        <ConfirmDialog
          open={pendingBulkDelete}
          title={t("batch.deleteTitle", { count: selectedLibraryCount })}
          description={t("batch.deleteDescription", {
            count: selectedLibraryCount,
          })}
          confirmLabel={t("batch.confirmDelete", {
            count: selectedLibraryCount,
          })}
          tone="destructive"
          onClose={() => setPendingBulkDelete(false)}
          onConfirm={() => {
            deleteLibraryEntries(selectedLibraryIdList)
            setPendingBulkDelete(false)
            exitSelectionMode()
          }}
        />
      )}
    </div>
  )
}

export function LibraryGalleryPage() {
  return <ThemeGalleryPage mode="library" />
}

export function BrandsGalleryPage() {
  return <ThemeGalleryPage mode="brands" />
}

function InlineToast({
  toast,
  onDismiss,
}: {
  toast: { message: string; tone: "warning" | "info" } | null
  onDismiss: () => void
}) {
  const common = useTranslations("Common")
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onDismiss, 3500)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "pointer-events-auto fixed right-6 bottom-6 z-50 flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-[13px] shadow-lg backdrop-blur-sm",
            toast.tone === "warning"
              ? "border-amber-300/70 bg-amber-50/95 text-amber-900"
              : "border-border bg-popover/95 text-foreground"
          )}
          role="status"
          aria-live="polite"
        >
          <AlertTriangle
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              toast.tone === "warning" ? "text-amber-600" : "text-foreground/70"
            )}
          />
          <span className="flex-1 leading-relaxed">{toast.message}</span>
          <button
            type="button"
            onClick={onDismiss}
            className="text-current/60 transition-colors hover:text-current"
            aria-label={common("closeNotice")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
