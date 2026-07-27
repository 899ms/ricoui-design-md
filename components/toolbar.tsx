"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertTriangle,
  Archive,
  Check,
  ChevronDown,
  ClipboardList,
  Cloud,
  Download,
  FileCode,
  FileJson,
  FileText,
  Loader2,
  Library,
  LogOut,
  WandSparkles,
  MoreHorizontal,
  PencilLine,
  Redo2,
  UploadCloud,
  Trash2,
  Undo2,
  Wrench,
  XCircle,
} from "lucide-react"
import { useDesignStore } from "@/lib/store/design-store"
import type { ParseStatus } from "@/lib/types/tokens"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatRelativeTime } from "@/lib/format"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SaveAsThemeDialog } from "@/components/theme-gallery-page/save-as-theme-dialog"
import { toast } from "@/lib/store/toast"
import { exportToMd } from "@/lib/export/export-md"
import { exportWorkspaceToZip } from "@/lib/export/export-zip"
import { downloadBlob, downloadText as downloadFile } from "@/lib/download"
import { useAutoSave, type SaveStatus } from "@/hooks/use-auto-save"
import { useAiFeatureEnabled } from "@/hooks/use-ai-feature-enabled"
import { useAccountDialog } from "@/components/account-dialog-provider"
import { useSyncState } from "@/lib/sync/sync-state"
import type { Locale } from "@/lib/i18n/config"
import { compileDesignArtifacts } from "@/lib/export/compile-design-artifacts"
import { sha256Hex } from "@/lib/export/artifact-hash"
import { getMarkdownDocumentCapability } from "@/lib/document-capability"
import { evaluateDesignDocument } from "@/lib/document-evaluation"

interface ToolbarProps {
  onOpenImportDiagnostics?: () => void
  onClear?: () => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onOpenAiWorkspace?: () => void
  onOpenAiRepair?: () => void
}

interface FloatingMenuPosition {
  top: number
  left: number
}

function ToolbarButton({
  tooltip,
  onClick,
  children,
  disabled,
}: {
  tooltip: string
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClick}
            disabled={disabled}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

function ExportMenuItem({
  icon,
  title,
  subtitle,
  onSelect,
  disabled = false,
  compact = false,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  onSelect: () => void
  disabled?: boolean
  compact?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      aria-disabled={disabled}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault()
        if (!disabled) onSelect()
      }}
      className={`flex w-full items-start gap-2.5 rounded-md px-3 text-left transition-colors hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent ${
        compact ? "py-1.5" : "py-2"
      }`}
    >
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] leading-5 font-medium">{title}</span>
        {subtitle && (
          <span className="block text-[11px] leading-4 text-muted-foreground">
            {subtitle}
          </span>
        )}
      </span>
    </button>
  )
}

function ToolbarMenuItem({
  icon,
  title,
  subtitle,
  onSelect,
  disabled,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  onSelect: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      disabled={disabled}
      className="flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/70 disabled:pointer-events-none disabled:opacity-45"
    >
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-tight font-medium">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
            {subtitle}
          </span>
        )}
      </span>
    </button>
  )
}

function ExportMenuGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
      {children}
    </p>
  )
}

function DocumentStatusBadge({
  saveStatus,
  parseStatus,
}: {
  saveStatus: SaveStatus
  parseStatus: ParseStatus
}) {
  const t = useTranslations("Editor.toolbar")
  if (parseStatus === "invalid") {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        {t("parseIssue")}
      </Badge>
    )
  }

  if (parseStatus === "degraded") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-amber-300 text-amber-700"
      >
        <AlertTriangle className="h-3 w-3" />
        {t("previewFallback")}
      </Badge>
    )
  }

  if (saveStatus === "idle") return null

  const config = {
    unsaved: {
      icon: PencilLine,
      label: t("unsaved"),
      className: "text-amber-700",
    },
    saving: {
      icon: Loader2,
      label: t("saving"),
      className: "animate-spin text-muted-foreground",
    },
    saved: {
      icon: Check,
      label: t("saved"),
      className: "text-green-700",
    },
    error: {
      icon: XCircle,
      label: t("saveFailed"),
      className: "text-destructive",
    },
    idle: null,
  }[saveStatus]

  if (!config) return null
  const Icon = config.icon

  return (
    <Badge variant="outline" className="gap-1">
      <Icon className={`h-3 w-3 ${config.className}`} />
      {config.label}
    </Badge>
  )
}

export function Toolbar({
  onOpenImportDiagnostics,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenAiWorkspace,
  onOpenAiRepair,
}: ToolbarProps) {
  const t = useTranslations("Editor.toolbar")
  const editorT = useTranslations("Editor")
  const common = useTranslations("Common")
  const locale = useLocale() as Locale
  const documents = useDesignStore((state) => state.documents)
  const activeDocumentId = useDesignStore((state) => state.activeDocumentId)
  const libraryEntries = useDesignStore((state) => state.libraryEntries)
  const tokens = useDesignStore((state) => state.tokens)
  const importDiagnostics = useDesignStore((state) => state.importDiagnostics)
  const rawSections = useDesignStore((state) => state.rawSections)
  const rawMarkdown = useDesignStore((state) => state.rawMarkdown)
  const parseStatus = useDesignStore((state) => state.parseStatus)
  const setActiveView = useDesignStore((state) => state.setActiveView)
  const publishDocumentToLibrary = useDesignStore(
    (state) => state.publishDocumentToLibrary
  )
  const renameDocument = useDesignStore((state) => state.renameDocument)
  const aiEnabled = useAiFeatureEnabled()
  const { configured: cloudConfigured, openAccount, user } = useAccountDialog()
  const syncStatus = useSyncState((state) => state.status)
  const sourceVersions = useSyncState((state) => state.sourceVersions)
  const syncConflicts = useSyncState((state) => state.conflicts)
  const [cloudPublishing, setCloudPublishing] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const [exportPosition, setExportPosition] =
    useState<FloatingMenuPosition | null>(null)
  const { status: saveStatus, clearSavedData } = useAutoSave()
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false)
  const [clearStorageConfirmOpen, setClearStorageConfirmOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const [morePosition, setMorePosition] = useState<FloatingMenuPosition | null>(
    null
  )
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState("")
  const activeDocument =
    documents.find((document) => document.id === activeDocumentId) ?? null
  const activeDocumentHasConflict = syncConflicts.some(
    (conflict) =>
      conflict.entity === "document" && conflict.entityId === activeDocumentId
  )
  const documentTitle = activeDocument?.name ?? editorT("workspace")
  const recentEditStamp =
    activeDocument?.lastOpenedAt ?? activeDocument?.updatedAt ?? null
  const recentEditLabel = recentEditStamp
    ? formatRelativeTime(recentEditStamp, {
        justNowLabel: editorT("justEdited"),
        locale,
      })
    : null
  const artifactCompilation = useMemo(
    () => compileDesignArtifacts(rawMarkdown),
    [rawMarkdown]
  )
  const documentCapability = useMemo(
    () => getMarkdownDocumentCapability(rawMarkdown),
    [rawMarkdown]
  )
  const documentEvaluation = useMemo(
    () => evaluateDesignDocument(rawMarkdown),
    [rawMarkdown]
  )
  // Current source compilation is authoritative. A generation-time warning
  // may become stale after parser improvements or document edits and must not
  // keep otherwise valid derived artifacts locked forever.
  const derivedFilesReady =
    parseStatus === "valid" && documentEvaluation.derived.status === "ready"
  const exportIssueCount = artifactCompilation.ok
    ? derivedFilesReady
      ? 0
      : 1
    : Math.max(artifactCompilation.issues.length, 1)
  const linkedLibraryId =
    activeDocument?.origin.kind === "library" ? activeDocument.origin.id : null
  const linkedLibraryEntry = linkedLibraryId
    ? (libraryEntries.find((entry) => entry.id === linkedLibraryId) ?? null)
    : null
  const cloudReleaseReady =
    Boolean(user) &&
    (syncStatus === "synced" ||
      (syncStatus === "conflict" && !activeDocumentHasConflict)) &&
    Boolean(sourceVersions[activeDocument?.id ?? ""])

  useEffect(() => {
    if (!exportOpen) return

    const updatePosition = () => {
      const trigger = exportRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const menuWidth = 336
      const gutter = 12
      const left = Math.min(
        Math.max(gutter, rect.right - menuWidth),
        window.innerWidth - menuWidth - gutter
      )

      setExportPosition({
        top: rect.bottom + 4,
        left,
      })
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      const isTriggerClick = exportRef.current?.contains(target)
      const isMenuClick = exportMenuRef.current?.contains(target)

      if (!isTriggerClick && !isMenuClick) {
        setExportOpen(false)
      }
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    document.addEventListener("mousedown", handlePointerDown)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [exportOpen])

  useEffect(() => {
    if (!moreOpen) return

    const updatePositions = () => {
      const gutter = 12
      const positionFromTrigger = (
        trigger: HTMLDivElement | null,
        menuWidth: number
      ) => {
        if (!trigger) return null
        const rect = trigger.getBoundingClientRect()
        return {
          top: rect.bottom + 4,
          left: Math.min(
            Math.max(gutter, rect.right - menuWidth),
            window.innerWidth - menuWidth - gutter
          ),
        }
      }

      if (moreOpen) setMorePosition(positionFromTrigger(moreRef.current, 224))
    }

    updatePositions()
    window.addEventListener("resize", updatePositions)
    window.addEventListener("scroll", updatePositions, true)
    return () => {
      window.removeEventListener("resize", updatePositions)
      window.removeEventListener("scroll", updatePositions, true)
    }
  }, [moreOpen])

  const handleCurrentExport = (
    format: "json" | "css" | "theme" | "md" | "zip"
  ) => {
    if (!tokens && format !== "md") return
    if (format !== "md" && !derivedFilesReady) {
      toast(t("fixBeforeDerivedExport", { count: exportIssueCount }), "warning")
      return
    }

    const artifacts = artifactCompilation.ok
      ? artifactCompilation.artifacts
      : null
    const prefix = artifacts?.tokens.meta.name || tokens?.meta.name || "design"
    const markdown =
      rawMarkdown || (tokens ? exportToMd(tokens, rawSections) : "")

    switch (format) {
      case "json":
        downloadFile(
          artifacts!.tokensJson,
          `${prefix}-tokens.json`,
          "application/json"
        )
        break
      case "css":
        downloadFile(
          artifacts!.variablesCss,
          `${prefix}-variables.css`,
          "text/css"
        )
        break
      case "theme":
        downloadFile(artifacts!.themeCss, `${prefix}-theme.css`, "text/css")
        break
      case "md":
        downloadFile(markdown, `${prefix}-DESIGN.md`, "text/markdown")
        break
      case "zip":
        downloadBlob(artifacts!.createZip(), `${prefix}-design-system.zip`)
        break
    }

    setExportOpen(false)
  }

  const handleWorkspaceExport = () => {
    if (documents.length < 2) return
    downloadBlob(exportWorkspaceToZip(documents), "design-md-workspace.zip")
    setExportOpen(false)
  }

  const handleCloudPublish = async () => {
    if (!activeDocument || !artifactCompilation.ok || cloudPublishing) return
    const version = sourceVersions[activeDocument.id]
    if (!user || syncStatus !== "synced" || !version) {
      toast(t("cloudPublishNeedsSync"), "warning")
      return
    }
    setCloudPublishing(true)
    try {
      const expectedSha256 = await sha256Hex(
        new TextEncoder().encode(artifactCompilation.artifacts.markdown)
      )
      const response = await fetch("/api/releases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceKind: "document",
          sourceId: activeDocument.id,
          expectedVersion: version,
          expectedSha256,
          clientRequestId: crypto.randomUUID(),
        }),
      })
      const result = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      if (!response.ok)
        throw new Error(result?.error || t("cloudPublishFailed"))
      toast(t("cloudPublishDone"), "success")
      setExportOpen(false)
    } catch (error) {
      toast(
        error instanceof Error ? error.message : t("cloudPublishFailed"),
        "warning"
      )
    } finally {
      setCloudPublishing(false)
    }
  }

  const handlePublish = () => {
    if (!activeDocument) return
    if (!documentCapability.canSaveToLibrary) {
      toast(t("saveLibraryEmpty"), "warning")
      return
    }
    if (activeDocument.origin.kind === "library" && linkedLibraryEntry) {
      setReplaceConfirmOpen(true)
      return
    }
    setPublishDialogOpen(true)
  }
  const showWorkspaceExport = documents.length > 1

  const startTitleRename = () => {
    if (!activeDocument) return
    setTitleDraft(activeDocument.name)
    setEditingTitle(true)
  }

  const submitTitleRename = () => {
    const next = titleDraft.trim()
    if (next && activeDocumentId) renameDocument(activeDocumentId, next)
    setEditingTitle(false)
    setTitleDraft("")
  }

  // Close compact action menus on outside click / Escape.
  useEffect(() => {
    if (!moreOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        moreRef.current?.contains(target) ||
        moreMenuRef.current?.contains(target)
      )
        return
      setMoreOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false)
      }
    }
    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [moreOpen])

  return (
    <div className="app-chrome border-b border-border/60">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            {editingTitle && activeDocument ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={submitTitleRename}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    submitTitleRename()
                  } else if (event.key === "Escape") {
                    event.preventDefault()
                    setEditingTitle(false)
                    setTitleDraft("")
                  }
                }}
                className="h-8 min-w-0 rounded-md border border-primary/40 bg-background px-2 text-xl leading-none font-semibold text-foreground outline-none focus:border-primary"
              />
            ) : (
              <p
                className="truncate text-xl leading-none font-semibold text-foreground"
                onDoubleClick={() => activeDocument && startTitleRename()}
                title={activeDocument ? t("renameTitle") : undefined}
              >
                {documentTitle}
              </p>
            )}
          </div>
          {tokens && (
            <DocumentStatusBadge
              saveStatus={saveStatus}
              parseStatus={parseStatus}
            />
          )}
          {recentEditLabel && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {recentEditLabel}
            </span>
          )}
          {cloudConfigured && user && (
            <button
              type="button"
              onClick={openAccount}
              className="hidden items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground sm:inline-flex"
              title={t("accountSync")}
            >
              <Cloud className="h-3.5 w-3.5" />
              {common(`syncStatus.${syncStatus}`)}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1">
          {aiEnabled && onOpenAiWorkspace && (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenAiWorkspace()
                  setMoreOpen(false)
                  setExportOpen(false)
                }}
                disabled={!tokens}
                className="border-primary/25 bg-primary/5 text-foreground hover:bg-primary/10 active:translate-y-px"
                aria-label={t("openAi")}
              >
                <WandSparkles
                  data-icon="inline-start"
                  className="text-primary"
                />
                {t("openAi")}
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handlePublish}
            disabled={!activeDocument || !documentCapability.canSaveToLibrary}
            title={
              documentCapability.level === "markdown-only"
                ? t("saveLibrarySourceOnlyTitle")
                : t("saveLibraryTitle")
            }
          >
            <Library data-icon="inline-start" />
            {t("saveLibrary")}
          </Button>

          <div className="relative" ref={exportRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setExportOpen((open) => !open)
                setMoreOpen(false)
              }}
              disabled={!tokens && documents.length === 0}
              aria-haspopup="menu"
              aria-expanded={exportOpen}
            >
              <Download className="h-3.5 w-3.5" />
              {common("export")}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          <Separator
            orientation="vertical"
            className="mx-1 hidden h-4 sm:block"
          />
          <ToolbarButton
            tooltip={t("undo")}
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            tooltip={t("redo")}
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <Separator
            orientation="vertical"
            className="mx-1 hidden h-4 sm:block"
          />

          <div ref={moreRef}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setMoreOpen((open) => !open)
                setExportOpen(false)
              }}
              aria-label={editorT("more")}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {exportOpen &&
        exportPosition &&
        createPortal(
          <div
            ref={exportMenuRef}
            role="menu"
            className="fixed z-[80] w-[336px] rounded-lg border border-border/70 bg-popover/95 p-1 shadow-[var(--shadow-lg)] backdrop-blur-xl"
            style={{
              top: exportPosition.top,
              left: exportPosition.left,
            }}
          >
            {activeDocument && !derivedFilesReady && (
              <div className="m-1 rounded-md border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground">
                      {t("derivedCompactTitle")}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
                      {t("derivedCompactCount", { count: exportIssueCount })}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2 pl-5.5">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setActiveView("document")
                      onOpenImportDiagnostics?.()
                      setExportOpen(false)
                    }}
                  >
                    <FileText className="size-3.5" />
                    {t("viewDerivedIssues")}
                  </Button>
                  {aiEnabled && onOpenAiRepair && (
                    <Button
                      size="xs"
                      onClick={() => {
                        onOpenAiRepair()
                        setExportOpen(false)
                      }}
                    >
                      <Wrench className="size-3.5" />
                      {t("repairWithAi")}
                    </Button>
                  )}
                </div>
              </div>
            )}
            {activeDocument && (
              <>
                <ExportMenuGroupLabel>{t("original")}</ExportMenuGroupLabel>
                <ExportMenuItem
                  icon={<FileText className="h-4 w-4" />}
                  title="DESIGN.md"
                  subtitle={t("markdownSource")}
                  onSelect={() => handleCurrentExport("md")}
                  compact
                />
                {tokens && (
                  <>
                    <div className="my-1 border-t border-border/60" />
                    <ExportMenuGroupLabel>
                      {t("generated")}
                    </ExportMenuGroupLabel>
                    <ExportMenuItem
                      icon={<FileJson className="h-4 w-4" />}
                      title="tokens.json"
                      subtitle={
                        derivedFilesReady
                          ? t("tokensSubtitle")
                          : t("fixBeforeDerivedExportShort", {
                              count: exportIssueCount,
                            })
                      }
                      onSelect={() => handleCurrentExport("json")}
                      disabled={!derivedFilesReady}
                      compact
                    />
                    <ExportMenuItem
                      icon={<FileCode className="h-4 w-4" />}
                      title="variables.css"
                      subtitle={t("cssSubtitle")}
                      onSelect={() => handleCurrentExport("css")}
                      disabled={!derivedFilesReady}
                      compact
                    />
                    <ExportMenuItem
                      icon={<FileCode className="h-4 w-4" />}
                      title="theme.css"
                      subtitle={t("themeSubtitle")}
                      onSelect={() => handleCurrentExport("theme")}
                      disabled={!derivedFilesReady}
                      compact
                    />
                    <div className="my-1 border-t border-border/60" />
                    <ExportMenuGroupLabel>{t("package")}</ExportMenuGroupLabel>
                    <ExportMenuItem
                      icon={<Archive className="h-4 w-4" />}
                      title={t("documentZip")}
                      subtitle={t("documentZipDetail")}
                      onSelect={() => handleCurrentExport("zip")}
                      disabled={!derivedFilesReady}
                      compact
                    />
                    {cloudConfigured && user && (
                      <>
                        <div className="my-1 border-t border-border/60" />
                        <ExportMenuGroupLabel>
                          {t("cloudRelease")}
                        </ExportMenuGroupLabel>
                        {!cloudReleaseReady ? (
                          <ExportMenuItem
                            icon={<Cloud className="h-4 w-4" />}
                            title={t("cloudPublish")}
                            subtitle={t("cloudPublishNeedsSync")}
                            onSelect={() => undefined}
                            disabled
                            compact
                          />
                        ) : (
                          <>
                            <ExportMenuItem
                              icon={
                                cloudPublishing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <UploadCloud className="h-4 w-4" />
                                )
                              }
                              title={t("cloudPublish")}
                              subtitle={
                                derivedFilesReady
                                  ? t("cloudPublishDetail")
                                  : t("fixBeforeDerivedExportShort", {
                                      count: exportIssueCount,
                                    })
                              }
                              onSelect={() => void handleCloudPublish()}
                              disabled={cloudPublishing || !derivedFilesReady}
                              compact
                            />
                            <ExportMenuItem
                              icon={<Cloud className="h-4 w-4" />}
                              title={t("manageReleases")}
                              subtitle={t("manageReleasesDetail")}
                              onSelect={() => {
                                window.location.href = "/releases"
                              }}
                              compact
                            />
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {showWorkspaceExport && (
              <>
                {activeDocument && (
                  <div className="my-1 border-t border-border/60" />
                )}
                <ExportMenuGroupLabel>
                  {editorT("workspace")}
                </ExportMenuGroupLabel>
                <ExportMenuItem
                  icon={<Archive className="h-4 w-4" />}
                  title={t("workspaceZip")}
                  subtitle={t("workspaceZipDetail")}
                  onSelect={handleWorkspaceExport}
                  compact
                />
              </>
            )}
          </div>,
          document.body
        )}

      {moreOpen &&
        morePosition &&
        createPortal(
          <div
            ref={moreMenuRef}
            role="menu"
            className="fixed z-[100] w-56 overflow-hidden rounded-lg border border-border/70 bg-popover/95 py-1 shadow-[var(--shadow-lg)] backdrop-blur-xl"
            style={{ top: morePosition.top, left: morePosition.left }}
          >
            {tokens && onOpenImportDiagnostics && importDiagnostics && (
              <>
                <ToolbarMenuItem
                  icon={<ClipboardList className="h-4 w-4" />}
                  title={t("importGuide")}
                  subtitle={t("importGuideDetail", {
                    count: importDiagnostics.summary.actionable,
                  })}
                  onSelect={() => {
                    setMoreOpen(false)
                    onOpenImportDiagnostics()
                  }}
                />
                <div className="my-1 border-t border-border/60" />
              </>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMoreOpen(false)
                onClear?.()
              }}
              disabled={!tokens}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-muted/70 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
              {t("removeDraft")}
            </button>
            <div className="my-1 border-t border-border/60" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMoreOpen(false)
                setClearStorageConfirmOpen(true)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("clearWorkspace")}
            </button>
          </div>,
          document.body
        )}

      <ConfirmDialog
        open={clearStorageConfirmOpen}
        title={t("clearTitle")}
        description={t("clearDetail")}
        confirmLabel={common("clear")}
        cancelLabel={common("cancel")}
        tone="destructive"
        onClose={() => setClearStorageConfirmOpen(false)}
        onConfirm={() => {
          setClearStorageConfirmOpen(false)
          void clearSavedData()
        }}
      />

      <ConfirmDialog
        open={replaceConfirmOpen}
        title={t("updateLibraryTitle")}
        description={
          linkedLibraryEntry
            ? t("updateLibraryDetail", { name: linkedLibraryEntry.name })
            : undefined
        }
        confirmLabel={t("replace")}
        secondaryLabel={t("saveNew")}
        cancelLabel={common("cancel")}
        onClose={() => setReplaceConfirmOpen(false)}
        onSecondary={() => {
          setReplaceConfirmOpen(false)
          setPublishDialogOpen(true)
        }}
        onConfirm={() => {
          if (!activeDocument) return
          publishDocumentToLibrary(
            activeDocument.id,
            {
              name: activeDocument.name,
              description: activeDocument.tokens?.meta.description || "",
              tags: activeDocument.tags ?? [],
              category: activeDocument.category,
            },
            { mode: "auto" }
          )
          setReplaceConfirmOpen(false)
          toast(t("updatedLibrary"), "success")
        }}
      />

      <SaveAsThemeDialog
        open={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        document={activeDocument}
        title={t("saveLibrary")}
        descriptionText={t("saveLibraryDetail")}
        submitLabel={common("save")}
        onSave={(input) => {
          if (!activeDocument) return
          publishDocumentToLibrary(activeDocument.id, input, { mode: "new" })
          setPublishDialogOpen(false)
          toast(t("savedLibrary"), "success")
        }}
      />
    </div>
  )
}
