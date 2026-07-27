"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  Copy,
  FileText,
  FolderOpen,
  Library,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Pin,
  PinOff,
  Search,
  SwatchBook,
  Trash2,
  Upload,
} from "lucide-react"
import { useDesignStore } from "@/lib/store/design-store"
import { Button } from "@/components/ui/button"
import { ImportSummaryToast } from "@/components/import-summary-toast"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { NewDocumentMenu } from "@/components/new-document-menu"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { getParseStatusBadge } from "@/lib/parse-status"
import type {
  BatchImportResult,
  ParseStatus,
  WorkspaceDocument,
} from "@/lib/types/tokens"
import type { Locale } from "@/lib/i18n/config"

function formatUpdatedAt(
  timestamp: number,
  locale: Locale,
  justNowLabel: string
) {
  return formatRelativeTime(timestamp, { justNowLabel, locale })
}

function getStatusBadge(parseStatus: ParseStatus, locale: Locale) {
  const badge = getParseStatusBadge(parseStatus, "plain", locale)
  return badge
    ? { ...badge, className: `${badge.className} text-[10px]` }
    : null
}

export function WorkspaceSidebar({
  onCollapse,
  onDocumentSelect,
}: {
  onCollapse?: () => void
  onDocumentSelect?: () => void
}) {
  const t = useTranslations("Editor")
  const common = useTranslations("Common")
  const router = useRouter()
  const documents = useDesignStore((state) => state.documents)
  const activeDocumentId = useDesignStore((state) => state.activeDocumentId)
  const switchDocument = useDesignStore((state) => state.switchDocument)
  const renameDocument = useDesignStore((state) => state.renameDocument)
  const duplicateDocument = useDesignStore((state) => state.duplicateDocument)
  const deleteDocument = useDesignStore((state) => state.deleteDocument)
  const createDocumentsFromFiles = useDesignStore(
    (state) => state.createDocumentsFromFiles
  )
  const setDocumentPinned = useDesignStore((state) => state.setDocumentPinned)
  const libraryEntries = useDesignStore((state) => state.libraryEntries)
  const [query, setQuery] = useState("")
  const [importSummary, setImportSummary] = useState<BatchImportResult | null>(
    null
  )

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return documents

    return documents.filter((document) => {
      return (
        document.name.toLowerCase().includes(normalizedQuery) ||
        document.tokens.meta.name.toLowerCase().includes(normalizedQuery) ||
        document.tokens.meta.description
          .toLowerCase()
          .includes(normalizedQuery) ||
        (document.tags ?? []).some((tag) =>
          tag.toLowerCase().includes(normalizedQuery)
        )
      )
    })
  }, [documents, query])

  const pinned = useMemo(
    () => filteredDocuments.filter((doc) => doc.pinned),
    [filteredDocuments]
  )
  const rest = useMemo(
    () => filteredDocuments.filter((doc) => !doc.pinned),
    [filteredDocuments]
  )

  const handleUpload = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".md"
    input.multiple = true
    input.onchange = async (event) => {
      const files = Array.from((event.target as HTMLInputElement).files ?? [])
      if (files.length === 0) return

      const result = await createDocumentsFromFiles(files)
      const hasIssues = result.failed.length > 0 || result.skipped.length > 0

      if (
        !(result.totalCount === 1 && result.successCount === 1 && !hasIssues)
      ) {
        setImportSummary(result)
      }
    }
    input.click()
  }, [createDocumentsFromFiles])

  const handleSwitchDocument = useCallback(
    (documentId: string) => {
      switchDocument(documentId)
      onDocumentSelect?.()
    },
    [onDocumentSelect, switchDocument]
  )

  return (
    <aside className="editor-sidebar flex h-full w-[304px] shrink-0 flex-col border-r border-border/70">
      <div className="border-b border-border/60 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-border/70 bg-card p-2 shadow-[var(--shadow-sm)]">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            {/* <p className="eyebrow-label">Workspace</p> */}
            <p className="truncate text-base leading-none font-bold">
              {t("workspace")}
            </p>
            {/* <p className="mt-1 text-xs text-muted-foreground">
               {documents.length} 个草稿
            </p> */}
          </div>
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto shrink-0"
              onClick={onCollapse}
              aria-label={t("collapseDrafts")}
              title={t("collapseDrafts")}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <NewDocumentMenu fullWidth label={t("newDraft")} />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleUpload}
            >
              <Upload className="h-3.5 w-3.5" />
              {common("import")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              render={<Link href="/documents" />}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              {t("manageAll")}
            </Button>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchWorkspace")}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3">
          {documents.length > 0 && (
            <div className="flex items-center justify-between px-1 text-[11px] font-medium text-muted-foreground">
              <span>{query.trim() ? t("searchResults") : t("drafts")}</span>
              <span className="tabular-nums">
                {query.trim()
                  ? `${filteredDocuments.length} / ${documents.length}`
                  : documents.length}
              </span>
            </div>
          )}
          {filteredDocuments.length === 0 ? (
            <div className="rounded-md border border-dashed bg-background/45 px-4 py-8 text-center text-sm text-muted-foreground">
              {documents.length === 0 ? t("noDrafts") : t("noMatches")}
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <DocumentSection
                  title={t("pinnedCount", { count: pinned.length })}
                  icon={<Pin className="h-3 w-3" />}
                  documents={pinned}
                  activeDocumentId={activeDocumentId}
                  onSwitch={handleSwitchDocument}
                  onRename={renameDocument}
                  onDuplicate={duplicateDocument}
                  onDelete={deleteDocument}
                  onTogglePin={(id, value) => setDocumentPinned(id, value)}
                  libraryEntries={libraryEntries}
                />
              )}
              {rest.length > 0 && (
                <DocumentSection
                  title={t("allDraftsCount", { count: rest.length })}
                  icon={
                    pinned.length > 0 ? (
                      <FileText className="h-3 w-3" />
                    ) : undefined
                  }
                  documents={rest}
                  activeDocumentId={activeDocumentId}
                  onSwitch={handleSwitchDocument}
                  onRename={renameDocument}
                  onDuplicate={duplicateDocument}
                  onDelete={deleteDocument}
                  onTogglePin={(id, value) => setDocumentPinned(id, value)}
                  libraryEntries={libraryEntries}
                />
              )}
            </>
          )}
        </div>
      </ScrollArea>
      <ImportSummaryToast
        result={importSummary}
        onDismiss={() => setImportSummary(null)}
        onOpenLatest={() => {
          const latestId = importSummary?.createdIds.at(-1)
          if (!latestId) return
          setImportSummary(null)
          router.push("/editor")
        }}
      />
    </aside>
  )
}

interface DocumentSectionProps {
  title?: string
  icon?: React.ReactNode
  documents: WorkspaceDocument[]
  activeDocumentId: string | null
  onSwitch: (id: string) => void
  onRename: (id: string, name: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string, pinned: boolean) => void
  libraryEntries: Array<{ id: string; name: string }>
}

function DocumentSection({
  title,
  icon,
  documents,
  activeDocumentId,
  onSwitch,
  onRename,
  onDuplicate,
  onDelete,
  onTogglePin,
  libraryEntries,
}: DocumentSectionProps) {
  const t = useTranslations("Editor")
  const common = useTranslations("Common")
  const locale = useLocale() as Locale
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(
    null
  )
  const [draftName, setDraftName] = useState("")
  const [openMenuDocumentId, setOpenMenuDocumentId] = useState<string | null>(
    null
  )
  const [pendingDeleteDocument, setPendingDeleteDocument] =
    useState<WorkspaceDocument | null>(null)

  const startEditing = (document: WorkspaceDocument) => {
    setOpenMenuDocumentId(null)
    setEditingDocumentId(document.id)
    setDraftName(document.name)
  }

  const submitEditing = (documentId: string) => {
    const nextName = draftName.trim()
    if (nextName) {
      onRename(documentId, nextName)
    }
    setEditingDocumentId(null)
    setDraftName("")
  }

  const cancelEditing = () => {
    setEditingDocumentId(null)
    setDraftName("")
  }

  return (
    <section className="space-y-2">
      {title && (
        <div className="flex items-center gap-1.5 px-1 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {icon}
          {title}
        </div>
      )}
      {documents.map((document) => {
        const status = getStatusBadge(document.parseStatus, locale)
        const isActive = document.id === activeDocumentId
        const isEditing = editingDocumentId === document.id
        const menuOpen = openMenuDocumentId === document.id
        const libraryOriginId =
          document.origin.kind === "library" ? document.origin.id : null
        const linkedLibrary = libraryOriginId
          ? (libraryEntries.find((entry) => entry.id === libraryOriginId) ??
            null)
          : null

        return (
          <div
            key={document.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (isEditing) return
              setOpenMenuDocumentId(null)
              onSwitch(document.id)
            }}
            onKeyDown={(event) => {
              if (isEditing) return
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                setOpenMenuDocumentId(null)
                onSwitch(document.id)
              }
            }}
            className={cn(
              "w-full rounded-md border px-3 py-3 text-left shadow-[var(--shadow-sm)] transition-all",
              isActive
                ? "border-primary/35 bg-card"
                : "border-border/65 bg-background/62 hover:border-primary/20 hover:bg-card/80"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {document.pinned && (
                    <Pin className="h-3 w-3 fill-current text-foreground" />
                  )}
                  {isEditing ? (
                    <input
                      value={draftName}
                      autoFocus
                      onChange={(event) => setDraftName(event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                      onDoubleClick={(event) => event.stopPropagation()}
                      onBlur={() => submitEditing(document.id)}
                      onKeyDown={(event) => {
                        event.stopPropagation()
                        if (event.key === "Enter") {
                          event.preventDefault()
                          submitEditing(document.id)
                        }
                        if (event.key === "Escape") {
                          event.preventDefault()
                          cancelEditing()
                        }
                      }}
                      className="h-7 min-w-0 flex-1 rounded-md border border-primary/30 bg-background px-2 text-sm font-medium outline-none focus:border-primary"
                    />
                  ) : (
                    <p
                      className="truncate text-sm font-medium"
                      onDoubleClick={(event) => {
                        event.stopPropagation()
                        startEditing(document)
                      }}
                    >
                      {document.name}
                    </p>
                  )}
                </div>
                {/* <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {document.tokens.meta.description || "暂无描述。"}
                </p> */}
              </div>
              {status && (
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                {formatUpdatedAt(
                  document.lastOpenedAt ?? document.updatedAt,
                  locale,
                  t("justEdited")
                )}
              </p>
              {document.origin.kind === "library" && linkedLibrary && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Library className="h-3 w-3" />
                  {linkedLibrary.name}
                </span>
              )}
              {document.origin.kind === "brand" && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <SwatchBook className="h-3 w-3" />
                  {document.origin.id}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    setOpenMenuDocumentId(null)
                    onTogglePin(document.id, !document.pinned)
                  }}
                  title={document.pinned ? t("unpin") : t("pin")}
                  aria-label={document.pinned ? t("unpinDraft") : t("pinDraft")}
                >
                  {document.pinned ? (
                    <PinOff className="h-3 w-3" />
                  ) : (
                    <Pin className="h-3 w-3" />
                  )}
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(event) => {
                      event.stopPropagation()
                      setOpenMenuDocumentId((current) =>
                        current === document.id ? null : document.id
                      )
                    }}
                    title={t("more")}
                    aria-label={t("moreDraft")}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                  {menuOpen && (
                    <div
                      onClick={(event) => event.stopPropagation()}
                      className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-md border border-border/60 bg-popover/95 py-1 shadow-[var(--shadow-lg)] backdrop-blur-xl"
                    >
                      <MenuItem
                        icon={<Copy className="h-3.5 w-3.5" />}
                        label={common("copy")}
                        onClick={() => {
                          setOpenMenuDocumentId(null)
                          onDuplicate(document.id)
                        }}
                      />
                      <MenuItem
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        label={t("rename")}
                        onClick={() => startEditing(document)}
                      />
                      <div className="my-1 border-t border-border/60" />
                      <MenuItem
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        label={common("delete")}
                        tone="danger"
                        onClick={() => {
                          setOpenMenuDocumentId(null)
                          setPendingDeleteDocument(document)
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <ConfirmDialog
        open={pendingDeleteDocument !== null}
        title={t("deleteDraft")}
        description={
          pendingDeleteDocument
            ? t("deleteDraftDetail", { name: pendingDeleteDocument.name })
            : undefined
        }
        confirmLabel={common("delete")}
        tone="destructive"
        onClose={() => setPendingDeleteDocument(null)}
        onConfirm={() => {
          if (!pendingDeleteDocument) return
          onDelete(pendingDeleteDocument.id)
          setPendingDeleteDocument(null)
        }}
      />
    </section>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  tone = "neutral",
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  tone?: "neutral" | "danger"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors",
        tone === "danger"
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted/60"
      )}
    >
      {icon}
      {label}
    </button>
  )
}
