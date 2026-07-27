"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { FolderOpen, MessageSquareText, PanelLeftOpen, X } from "lucide-react"
import { useDesignStore } from "@/lib/store/design-store"
import { useUiPreferences } from "@/lib/store/ui-preferences"
import { useCssVariables } from "@/hooks/use-css-variables"
import { useUndoRedo } from "@/hooks/use-undo-redo"
import { useWorkspaceReady } from "@/hooks/use-workspace-ready"
import { UploadZone } from "@/components/upload-zone"
import { Toolbar } from "@/components/toolbar"
import { DocumentSyncConflictBanner } from "@/components/document-sync-conflict-banner"
import { PreviewPanel } from "@/components/preview-panel"
import { ControlPanel } from "@/components/control-panel"
import { DocumentEditor } from "@/components/document-editor"
import { EditorViewHeader } from "@/components/editor-view-header"
import { WorkspaceSidebar } from "@/components/workspace-sidebar"
import { ImportDiagnosticsPanel } from "@/components/import-diagnostics-panel"
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"
import { Sheet } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import {
  AiDocumentWorkspace,
  DEFAULT_AI_WORKSPACE_MODE,
  type AiWorkspaceMode,
} from "@/components/ai-document-workspace"
import { useAiFeatureEnabled } from "@/hooks/use-ai-feature-enabled"
import { useUrlGenerationStore } from "@/lib/store/url-generation-store"
import { getMarkdownDocumentCapability } from "@/lib/document-capability"

export function EditorWorkspace() {
  const t = useTranslations("Editor")
  const aiT = useTranslations("AiWorkspace")
  const tokens = useDesignStore((state) => state.tokens)
  const documents = useDesignStore((state) => state.documents)
  const activeDocumentId = useDesignStore((state) => state.activeDocumentId)
  const activeView = useDesignStore((state) => state.activeView)
  const rawMarkdown = useDesignStore((state) => state.rawMarkdown)
  const setActiveView = useDesignStore((state) => state.setActiveView)
  const deleteDocument = useDesignStore((state) => state.deleteDocument)
  const aiAssistInvitationDocumentId = useDesignStore(
    (state) => state.aiAssistInvitationDocumentId
  )
  const dismissAiAssistInvitation = useDesignStore(
    (state) => state.dismissAiAssistInvitation
  )
  const { ready } = useWorkspaceReady()
  const [importDiagnosticsOpen, setImportDiagnosticsOpen] = useState(false)
  const [sidebarOverlayOpen, setSidebarOverlayOpen] = useState(false)
  const [aiWorkspaceOpen, setAiWorkspaceOpen] = useState(false)
  const [aiWorkspaceMode, setAiWorkspaceMode] = useState<AiWorkspaceMode>(
    DEFAULT_AI_WORKSPACE_MODE
  )
  const [hiddenUrlGenerationJobId, setHiddenUrlGenerationJobId] = useState<
    string | null
  >(null)
  const [aiRequestId, setAiRequestId] = useState(0)
  const [aiAssistantInstruction, setAiAssistantInstruction] = useState("")
  const aiEnabled = useAiFeatureEnabled()
  const urlGenerationJobId = useUrlGenerationStore((state) => state.job?.id)
  const urlGenerationWorkspaceOpen = Boolean(
    urlGenerationJobId && hiddenUrlGenerationJobId !== urlGenerationJobId
  )
  const effectiveAiWorkspaceOpen = aiWorkspaceOpen || urlGenerationWorkspaceOpen
  const effectiveAiWorkspaceMode = urlGenerationJobId
    ? "standardize"
    : aiWorkspaceMode
  const cssVarsRef = useCssVariables<HTMLDivElement>()
  const { undo, redo, canUndo, canRedo } = useUndoRedo()
  const documentCapability = useMemo(
    () => getMarkdownDocumentCapability(rawMarkdown),
    [rawMarkdown]
  )

  const openAiWorkspace = (
    mode: AiWorkspaceMode,
    assistantInstruction = ""
  ) => {
    setHiddenUrlGenerationJobId(null)
    setAiWorkspaceMode(mode)
    setAiAssistantInstruction(assistantInstruction)
    setAiWorkspaceOpen(true)
    setAiRequestId((requestId) => requestId + 1)
  }

  const showAiWorkspace = () => {
    setHiddenUrlGenerationJobId(null)
    setAiWorkspaceMode(DEFAULT_AI_WORKSPACE_MODE)
    setAiWorkspaceOpen(true)
  }

  const workspaceSidebarCollapsed = useUiPreferences(
    (state) => state.workspaceSidebarCollapsed
  )
  const setWorkspaceSidebarCollapsed = useUiPreferences(
    (state) => state.setWorkspaceSidebarCollapsed
  )

  if (!ready) {
    return <PageLoadingSkeleton variant="editor" />
  }

  const showSidebar = documents.length > 0

  return (
    <>
      <div
        ref={cssVarsRef}
        className="work-surface flex min-h-0 flex-1 overflow-hidden"
      >
        {showSidebar && (
          <div className="hidden lg:block">
            {workspaceSidebarCollapsed ? (
              <CollapsedWorkspaceRail
                docCount={documents.length}
                onExpand={() => setWorkspaceSidebarCollapsed(false)}
              />
            ) : (
              <WorkspaceSidebar
                onCollapse={() => setWorkspaceSidebarCollapsed(true)}
              />
            )}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile control bar — opens Workspace/Outline as drawers on
              narrow screens (V7-PRD §4.8, §8.1). */}
          {showSidebar && (
            <div className="flex items-center gap-2 border-b border-border/60 bg-background/80 px-3 py-1.5 lg:hidden">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setSidebarOverlayOpen(true)}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                {t("drafts")}
                <span className="rounded-full bg-muted px-1.5 text-[10px]">
                  {documents.length}
                </span>
              </Button>
            </div>
          )}

          <Toolbar
            onOpenImportDiagnostics={() => setImportDiagnosticsOpen(true)}
            onClear={
              activeDocumentId
                ? () => deleteDocument(activeDocumentId)
                : undefined
            }
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onOpenAiWorkspace={showAiWorkspace}
            onOpenAiRepair={() =>
              openAiWorkspace("assistant", aiT("assistantSuggestion1"))
            }
          />

          <DocumentSyncConflictBanner />

          {aiEnabled &&
            activeDocumentId &&
            aiAssistInvitationDocumentId === activeDocumentId && (
              <div className="flex flex-wrap items-center gap-2 border-b border-primary/15 bg-primary/[0.035] px-4 py-2 text-sm lg:px-6">
                <MessageSquareText className="h-4 w-4 shrink-0 text-primary" />
                <p className="mr-auto text-muted-foreground">
                  {t("aiInvitation")}
                </p>
                <Button
                  size="xs"
                  onClick={() => {
                    dismissAiAssistInvitation()
                    openAiWorkspace("standardize")
                  }}
                >
                  {t("aiGenerate")}
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    dismissAiAssistInvitation()
                    openAiWorkspace("assistant")
                  }}
                >
                  {t("aiAssistant")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("closeAiInvitation")}
                  onClick={dismissAiAssistInvitation}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

          {tokens && (
            <EditorViewHeader
              activeView={activeView}
              onSetActiveView={setActiveView}
              sourceOnly={documentCapability.level === "markdown-only"}
            />
          )}

          {tokens ? (
            <div className="flex flex-1 overflow-hidden">
              {activeView === "document" && <DocumentEditor />}
              {activeView === "structured" && <ControlPanel />}
              {activeView === "preview" && <PreviewPanel />}
            </div>
          ) : (
            <UploadZone compact={documents.length > 0} />
          )}
        </div>

        {aiEnabled && (
          <AiDocumentWorkspace
            key={activeDocumentId ?? "no-document"}
            open={effectiveAiWorkspaceOpen}
            mode={effectiveAiWorkspaceMode}
            requestId={aiRequestId}
            assistantInstruction={aiAssistantInstruction}
            onModeChange={setAiWorkspaceMode}
            onClose={() => {
              setAiWorkspaceOpen(false)
              setHiddenUrlGenerationJobId(urlGenerationJobId ?? null)
            }}
          />
        )}
      </div>

      {/* Mobile access to the full Workspace sidebar keeps
          new/import/search/document-switch reachable on narrow screens. */}
      <Sheet
        open={sidebarOverlayOpen}
        onClose={() => setSidebarOverlayOpen(false)}
        side="left"
        className="w-[340px] max-w-[calc(100vw-24px)] p-0"
      >
        <WorkspaceSidebar
          onDocumentSelect={() => setSidebarOverlayOpen(false)}
        />
      </Sheet>

      <ImportDiagnosticsPanel
        open={importDiagnosticsOpen}
        onClose={() => setImportDiagnosticsOpen(false)}
      />
    </>
  )
}

function CollapsedWorkspaceRail({
  docCount,
  onExpand,
}: {
  docCount: number
  onExpand: () => void
}) {
  const t = useTranslations("Editor")
  return (
    <aside className="editor-sidebar flex h-full w-14 shrink-0 flex-col items-center gap-2 border-r border-border/70 py-3">
      <RailIconButton
        label={t("expandDrafts")}
        onClick={onExpand}
        icon={<PanelLeftOpen className="h-4 w-4" />}
      />
      <div className="my-1 h-px w-8 bg-border/60" />
      <RailIconButton
        label={t("viewDrafts", { count: docCount })}
        onClick={onExpand}
        icon={
          <span className="relative">
            <FolderOpen className="h-4 w-4" />
            <span className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {docCount}
            </span>
          </span>
        }
      />
    </aside>
  )
}

function RailIconButton({
  label,
  onClick,
  icon,
}: {
  label: string
  onClick: () => void
  icon: React.ReactNode
}) {
  const button = (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {icon}
    </Button>
  )
  return (
    <Tooltip>
      <TooltipTrigger render={button}>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
