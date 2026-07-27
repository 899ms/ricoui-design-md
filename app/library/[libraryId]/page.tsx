"use client"

import { useCallback, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileCode,
  FileJson,
  FileText,
  Heart,
  Pencil,
  Trash2,
  UploadCloud,
  Loader2,
} from "lucide-react"
import {
  ThemePreviewDocument,
  buildHeroCopy,
  useThemePreviewData,
} from "@/components/theme-gallery-page/theme-preview-renderer"
import type { UnifiedThemeEntry } from "@/components/theme-gallery-page/theme-gallery-page"
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { exportToTailwindTheme } from "@/lib/export/export-css"
import { useDesignStore } from "@/lib/store/design-store"
import type { LibraryEntry } from "@/lib/types/tokens"
import { cn, slugify } from "@/lib/utils"
import { downloadText as downloadTextFile } from "@/lib/download"
import {
  useShikiHighlight,
  type ShikiLanguage,
} from "@/hooks/use-shiki-highlight"
import { useWorkspaceReady } from "@/hooks/use-workspace-ready"
import { useAccountDialog } from "@/components/account-dialog-provider"
import { useSyncState } from "@/lib/sync/sync-state"
import { sha256Hex } from "@/lib/export/artifact-hash"
import { getMarkdownDocumentCapability } from "@/lib/document-capability"
import { toast } from "@/lib/store/toast"

type MobileTab = "preview" | "files"
type FileTab = "md" | "tailwind" | "css" | "tokens"

interface LibraryFileSource {
  id: FileTab
  label: string
  filename: string
  mime: string
  language: ShikiLanguage
  content: string
  icon: React.ReactNode
  disabled?: boolean
}

function downloadText(filename: string, content: string, mime: string) {
  downloadTextFile(content, filename, mime)
}

function libraryEntryToUnifiedEntry(entry: LibraryEntry): UnifiedThemeEntry {
  return {
    id: entry.id,
    origin: "library",
    name: entry.name,
    description: entry.description,
    tags: entry.tags,
    category: entry.category,
    previewColors: entry.previewColors,
    metadataChips: entry.metadataChips,
    mdContent: entry.mdContent,
    capability: getMarkdownDocumentCapability(entry.mdContent).level,
  }
}

export default function LibraryDetailPage() {
  const t = useTranslations("Details")
  const libraryT = useTranslations("Details.library")
  const common = useTranslations("Common")
  const params = useParams<{ libraryId: string }>()
  const router = useRouter()
  const { ready } = useWorkspaceReady()
  const libraryEntries = useDesignStore((state) => state.libraryEntries)
  const createDocument = useDesignStore((state) => state.createDocument)
  const duplicateLibraryEntry = useDesignStore(
    (state) => state.duplicateLibraryEntry
  )
  const deleteLibraryEntry = useDesignStore((state) => state.deleteLibraryEntry)
  const toggleLibraryEntryFavorite = useDesignStore(
    (state) => state.toggleLibraryEntryFavorite
  )

  const [mobileTab, setMobileTab] = useState<MobileTab>("preview")
  const [fileTab, setFileTab] = useState<FileTab>("md")
  const [copiedFile, setCopiedFile] = useState<FileTab | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const { user, openAccount } = useAccountDialog()
  const syncStatus = useSyncState((state) => state.status)
  const sourceVersions = useSyncState((state) => state.sourceVersions)

  const libraryEntry = useMemo(
    () => libraryEntries.find((entry) => entry.id === params.libraryId) ?? null,
    [libraryEntries, params.libraryId]
  )

  const libraryIndex = useMemo(
    () => libraryEntries.findIndex((entry) => entry.id === params.libraryId),
    [libraryEntries, params.libraryId]
  )

  const previousEntry =
    libraryIndex >= 0 && libraryEntries.length > 1
      ? libraryEntries[
          (libraryIndex - 1 + libraryEntries.length) % libraryEntries.length
        ]
      : null
  const nextEntry =
    libraryIndex >= 0 && libraryEntries.length > 1
      ? libraryEntries[(libraryIndex + 1) % libraryEntries.length]
      : null

  const entry = useMemo(
    () => (libraryEntry ? libraryEntryToUnifiedEntry(libraryEntry) : null),
    [libraryEntry]
  )

  const {
    parsed,
    previewSemantics,
    cssVars,
    mdSource,
    jsonSource,
    cssSource,
    prefix,
  } = useThemePreviewData(entry, { loadFonts: true })

  const safePrefix = prefix || slugify(libraryEntry?.name ?? "library-entry")
  const documentCapability = useMemo(
    () => getMarkdownDocumentCapability(libraryEntry?.mdContent ?? ""),
    [libraryEntry?.mdContent]
  )
  const previewReady =
    documentCapability.canPreview && !!parsed && !!previewSemantics && !!cssVars
  const derivedReady = documentCapability.canDerive && !!parsed

  const fileSources = useMemo<LibraryFileSource[]>(() => {
    const unavailable = libraryT("unavailableFile")
    return [
      {
        id: "md",
        label: "DESIGN.md",
        filename: `${safePrefix}-DESIGN.md`,
        mime: "text/markdown",
        language: "markdown",
        content: mdSource,
        icon: <FileText className="h-3.5 w-3.5" />,
      },
      {
        id: "tailwind",
        label: "Tailwind v4",
        filename: `${safePrefix}-tailwind-theme.css`,
        mime: "text/css",
        language: "css",
        content:
          derivedReady && parsed
            ? exportToTailwindTheme(parsed.tokens)
            : unavailable,
        icon: <FileCode className="h-3.5 w-3.5" />,
        disabled: !derivedReady,
      },
      {
        id: "css",
        label: "CSS Variables",
        filename: `${safePrefix}-variables.css`,
        mime: "text/css",
        language: "css",
        content: derivedReady && parsed ? cssSource : unavailable,
        icon: <FileCode className="h-3.5 w-3.5" />,
        disabled: !derivedReady,
      },
      {
        id: "tokens",
        label: "Design Tokens",
        filename: `${safePrefix}-tokens.json`,
        mime: "application/json",
        language: "json",
        content: derivedReady && parsed ? jsonSource : unavailable,
        icon: <FileJson className="h-3.5 w-3.5" />,
        disabled: !derivedReady,
      },
    ]
  }, [
    cssSource,
    derivedReady,
    jsonSource,
    libraryT,
    mdSource,
    parsed,
    safePrefix,
  ])

  const activeFile = useMemo(() => {
    const found = fileSources.find((source) => source.id === fileTab)
    if (found?.disabled) return fileSources[0]
    return found ?? fileSources[0]
  }, [fileSources, fileTab])

  const goToEntry = useCallback(
    (libraryId: string) => {
      router.push(`/library/${encodeURIComponent(libraryId)}`)
    },
    [router]
  )

  const handleEdit = useCallback(async () => {
    if (!libraryEntry) return
    const id = await createDocument({
      source: "library",
      sourceId: libraryEntry.id,
    })
    if (id) router.push("/editor")
  }, [createDocument, libraryEntry, router])

  const handleDuplicate = useCallback(() => {
    if (!libraryEntry) return
    const id = duplicateLibraryEntry(libraryEntry.id)
    if (id)
      toast(libraryT("duplicated", { name: libraryEntry.name }), "success")
  }, [duplicateLibraryEntry, libraryEntry, libraryT])

  const handleDelete = useCallback(() => {
    if (!libraryEntry) return
    deleteLibraryEntry(libraryEntry.id)
    router.push("/library")
  }, [deleteLibraryEntry, libraryEntry, router])

  const handleFavorite = useCallback(() => {
    if (!libraryEntry) return
    toggleLibraryEntryFavorite(libraryEntry.id)
  }, [libraryEntry, toggleLibraryEntryFavorite])

  const handleCopyFile = useCallback(
    async (file: LibraryFileSource) => {
      if (file.disabled) return
      try {
        await navigator.clipboard.writeText(file.content)
        setCopiedFile(file.id)
        window.setTimeout(() => setCopiedFile(null), 1400)
      } catch {
        toast(t("copyFailed"), "warning")
      }
    },
    [t]
  )

  const publishCloudVersion = async () => {
    if (!libraryEntry || publishing) return
    if (!documentCapability.canDerive) {
      toast(libraryT("deliveryUnavailable"), "warning")
      return
    }
    if (!user) {
      openAccount()
      return
    }
    const version = sourceVersions[libraryEntry.id]
    if (syncStatus !== "synced" || !version) {
      toast(
        syncStatus === "error"
          ? libraryT("deliverySyncError")
          : libraryT("deliveryNeedsSync"),
        "warning"
      )
      return
    }
    setPublishing(true)
    toast(libraryT("deliveryGenerating"), "info")
    try {
      const normalized = libraryEntry.mdContent.replace(/\r\n?/g, "\n")
      const response = await fetch("/api/releases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceKind: "library_entry",
          sourceId: libraryEntry.id,
          expectedVersion: version,
          expectedSha256: await sha256Hex(new TextEncoder().encode(normalized)),
          clientRequestId: crypto.randomUUID(),
        }),
      })
      const result = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      if (!response.ok)
        throw new Error(result?.error || libraryT("deliveryFailed"))
      toast(libraryT("deliveryDone"), "success")
    } catch (cause) {
      toast(
        cause instanceof Error ? cause.message : libraryT("deliveryFailed"),
        "warning"
      )
    } finally {
      setPublishing(false)
    }
  }

  if (!ready) {
    return <PageLoadingSkeleton />
  }

  if (!libraryEntry || !entry) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center bg-muted/15 px-6 text-center">
        <div>
          <p className="text-base font-medium">{libraryT("unavailable")}</p>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            {libraryT("unavailableDetail")}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/library")}
          >
            <ArrowLeft className="h-4 w-4" />
            {libraryT("back")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/15">
      <div className="shrink-0 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => router.push("/library")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {libraryT("library")}
            </Button>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!previousEntry}
              onClick={() => previousEntry && goToEntry(previousEntry.id)}
              aria-label={libraryT("previous")}
              title={libraryT("previous")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!nextEntry}
              onClick={() => nextEntry && goToEntry(nextEntry.id)}
              aria-label={libraryT("next")}
              title={libraryT("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <select
              value={libraryEntry.id}
              onChange={(event) => goToEntry(event.target.value)}
              className="h-8 max-w-[180px] rounded-md border border-border bg-background px-2 text-sm font-medium transition-colors outline-none hover:bg-muted/35 focus:border-ring focus:ring-3 focus:ring-ring/30 sm:max-w-[260px]"
              aria-label={libraryT("switch")}
            >
              {libraryEntries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide",
                documentCapability.level === "full"
                  ? "bg-emerald-500/10 text-emerald-700"
                  : documentCapability.level === "partial"
                    ? "bg-amber-500/10 text-amber-700"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {libraryT(`capability.${documentCapability.level}`)}
            </span>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={publishing || !documentCapability.canDerive}
              aria-busy={publishing}
              title={
                publishing
                  ? libraryT("deliveryGenerating")
                  : !documentCapability.canDerive
                    ? libraryT("deliveryUnavailable")
                    : !user
                      ? libraryT("deliverySignInTitle")
                      : syncStatus === "error"
                        ? libraryT("deliverySyncError")
                        : syncStatus !== "synced" ||
                            !sourceVersions[libraryEntry.id]
                          ? libraryT("deliveryNeedsSync")
                          : libraryT("deliveryReadyTitle")
              }
              onClick={() => void publishCloudVersion()}
            >
              {publishing ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <UploadCloud data-icon="inline-start" />
              )}
              {libraryT(publishing ? "deliveryGenerating" : "deliveryGenerate")}
            </Button>
            <Button
              variant={libraryEntry.favorited ? "default" : "outline"}
              size="sm"
              className="h-8"
              onClick={handleFavorite}
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5",
                  libraryEntry.favorited && "fill-current"
                )}
              />
              {libraryT("favorite")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
              {common("edit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleDuplicate}
            >
              <Copy className="h-3.5 w-3.5" />
              {common("copy")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {common("delete")}
            </Button>
          </div>
        </div>
      </div>

      {documentCapability.level !== "full" && (
        <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/5 px-6 py-2.5 text-[12px] text-amber-800">
          {libraryT(
            documentCapability.level === "partial"
              ? "partialWarning"
              : "sourceWarning"
          )}
        </div>
      )}

      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        <PreviewSurface
          entry={entry}
          parsed={previewReady ? parsed : null}
          previewSemantics={previewReady ? previewSemantics : null}
          cssVars={previewReady ? cssVars : null}
        />
        <FilesSurface
          fileSources={fileSources}
          activeFile={activeFile}
          fileTab={fileTab}
          onFileTabChange={setFileTab}
          copiedFile={copiedFile}
          onCopyFile={handleCopyFile}
        />
      </div>

      <Tabs
        value={mobileTab}
        onValueChange={(value) => setMobileTab(value as MobileTab)}
        className="flex min-h-0 flex-1 flex-col gap-0 lg:hidden"
      >
        <div className="shrink-0 border-b border-border/60 bg-background px-4 pt-2">
          <TabsList variant="line" className="h-9 gap-3 px-0">
            <TabsTrigger value="preview" className="px-1 text-[12.5px]">
              {t("preview")}
            </TabsTrigger>
            <TabsTrigger value="files" className="px-1 text-[12.5px]">
              {t("files")}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" className="min-h-0 flex-1 bg-muted/15">
          <PreviewSurface
            entry={entry}
            parsed={previewReady ? parsed : null}
            previewSemantics={previewReady ? previewSemantics : null}
            cssVars={previewReady ? cssVars : null}
          />
        </TabsContent>
        <TabsContent value="files" className="min-h-0 flex-1 bg-background">
          <FilesSurface
            fileSources={fileSources}
            activeFile={activeFile}
            fileTab={fileTab}
            onFileTabChange={setFileTab}
            copiedFile={copiedFile}
            onCopyFile={handleCopyFile}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteOpen}
        title={libraryT("deleteTitle")}
        description={libraryT("deleteDetail", { name: libraryEntry.name })}
        confirmLabel={common("delete")}
        tone="destructive"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function PreviewSurface({
  entry,
  parsed,
  previewSemantics,
  cssVars,
}: {
  entry: UnifiedThemeEntry
  parsed: ReturnType<typeof useThemePreviewData>["parsed"]
  previewSemantics: ReturnType<typeof useThemePreviewData>["previewSemantics"]
  cssVars: ReturnType<typeof useThemePreviewData>["cssVars"]
}) {
  const t = useTranslations("Details.library")
  if (!parsed || !previewSemantics || !cssVars) {
    return (
      <ScrollArea className="h-full min-h-0 bg-muted/15">
        <div className="grid min-h-full place-items-center p-6 text-center">
          <div className="max-w-md rounded-md border border-dashed border-amber-500/35 bg-amber-500/5 px-6 py-8">
            <FileText className="mx-auto h-7 w-7 text-amber-700/75" />
            <h2 className="mt-3 text-base font-semibold">
              {t("previewUnavailable")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("previewUnavailableDetail")}
            </p>
          </div>
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="h-full min-h-0 bg-muted/15">
      <div className="p-4 lg:p-6">
        <ThemePreviewDocument
          tokens={parsed.tokens}
          rawSections={parsed.rawSections}
          parsedName={parsed.tokens.meta.name}
          previewSemantics={previewSemantics}
          cssVars={cssVars}
          hero={buildHeroCopy({
            name: entry.name,
            description: entry.description,
            mdContent: entry.mdContent,
          })}
          className="px-6 py-9 sm:px-8 lg:px-10 lg:py-10"
        />
      </div>
    </ScrollArea>
  )
}

function FilesSurface({
  fileSources,
  activeFile,
  fileTab,
  onFileTabChange,
  copiedFile,
  onCopyFile,
}: {
  fileSources: LibraryFileSource[]
  activeFile: LibraryFileSource
  fileTab: FileTab
  onFileTabChange: (value: FileTab) => void
  copiedFile: FileTab | null
  onCopyFile: (file: LibraryFileSource) => void
}) {
  const common = useTranslations("Common")
  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border/60 bg-background">
      <Tabs
        value={fileTab}
        onValueChange={(value) => onFileTabChange(value as FileTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="shrink-0 border-b border-border/60 px-4 pt-2">
          <TabsList
            variant="line"
            className="h-9 max-w-full justify-start gap-4 overflow-x-auto px-0"
          >
            {fileSources.map((file) => (
              <TabsTrigger
                key={file.id}
                value={file.id}
                disabled={file.disabled}
                className="flex-none px-1 text-[12.5px]"
              >
                {file.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2 text-[12px] text-muted-foreground">
            {activeFile.icon}
            <span className="truncate font-mono">{activeFile.filename}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              disabled={activeFile.disabled}
              onClick={() => onCopyFile(activeFile)}
            >
              {copiedFile === activeFile.id ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedFile === activeFile.id ? common("copied") : common("copy")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              disabled={activeFile.disabled}
              onClick={() =>
                downloadText(
                  activeFile.filename,
                  activeFile.content,
                  activeFile.mime
                )
              }
            >
              <Download className="h-3.5 w-3.5" />
              {common("download")}
            </Button>
          </div>
        </div>
        {fileSources.map((file) => (
          <TabsContent
            key={file.id}
            value={file.id}
            className="min-h-0 flex-1 bg-muted/10"
          >
            <CodeViewer file={file} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function CodeViewer({ file }: { file: LibraryFileSource }) {
  const highlighted = useShikiHighlight(file.content, file.language)

  return (
    <div className="h-full min-h-0 overflow-auto bg-background">
      {highlighted ? (
        <div
          className={cn(
            "shiki-rendered min-w-max px-4 py-4 font-mono text-[12px] leading-[1.7]",
            file.disabled && "opacity-60"
          )}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <pre
          className={cn(
            "m-0 min-w-max px-4 py-4 font-mono text-[12px] leading-[1.7] whitespace-pre text-foreground/85",
            file.disabled && "opacity-60"
          )}
        >
          {file.content}
        </pre>
      )}
    </div>
  )
}
