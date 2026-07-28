"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Settings2,
  WandSparkles,
  X,
} from "lucide-react"
import { ensureAiTextOutput, streamAiConvert } from "@/lib/ai/ai-client"
import { getAiUserFacingError } from "@/lib/ai/provider-error"
import {
  validateConvertedMarkdown,
  type ConvertedCompletenessReport,
} from "@/lib/ai/validate-converted"
import { useAiSettingsStore } from "@/lib/store/ai-settings-store"
import { getAiProvider } from "@/lib/ai/providers"
import { useDesignStore } from "@/lib/store/design-store"
import { useUiPreferences } from "@/lib/store/ui-preferences"
import { useAiSettingsDialog } from "@/components/ai-settings-dialog-provider"
import { AiAssistantChat } from "@/components/ai-repair-chat"
import { Button } from "@/components/ui/button"
import {
  DesignFileTabs,
  buildDesignFileSources,
} from "@/components/design-file-tabs"
import { toast } from "@/lib/store/toast"
import { exportToZip } from "@/lib/export/export-zip"
import { compileDesignArtifacts } from "@/lib/export/compile-design-artifacts"
import { downloadBlob } from "@/lib/download"
import { cn, slugify } from "@/lib/utils"
import type { ParseResult } from "@/lib/types/tokens"
import type { Locale } from "@/lib/i18n/config"
import { getDocumentRevision } from "@/lib/document-revision"
import { UrlGenerationProgress } from "@/components/url-generation-progress"
import {
  useUrlGenerationStore,
  type UrlGenerationAssistantAction,
} from "@/lib/store/url-generation-store"

export type AiWorkspaceMode = "standardize" | "assistant"
type AiRunnableMode = "standardize"
export const DEFAULT_AI_WORKSPACE_MODE: AiWorkspaceMode = "standardize"

export type StandardizeApplyState = "ready" | "applied" | "stale" | "invalid"

export function resolveStandardizeApplyState({
  hasResult,
  reportValid,
  sourceRevision,
  currentRevision,
  candidateRevision,
}: {
  hasResult: boolean
  reportValid: boolean
  sourceRevision: string | null
  currentRevision: string
  candidateRevision: string | null
}): StandardizeApplyState {
  if (!hasResult || !reportValid || !candidateRevision) return "invalid"
  if (candidateRevision === currentRevision) return "applied"
  if (sourceRevision && sourceRevision !== currentRevision) return "stale"
  return "ready"
}

interface AiDocumentWorkspaceProps {
  open: boolean
  mode: AiWorkspaceMode
  requestId: number
  assistantInstruction?: string
  assistantAutoSubmit?: boolean
  onAssistantAutoSubmitConsumed?: () => void
  onModeChange: (mode: AiWorkspaceMode) => void
  onOpenGeneratedDraftAssistant?: (action: UrlGenerationAssistantAction) => void
  onClose: () => void
}

type AiRunPhase =
  | "connecting"
  | "waiting"
  | "streaming"
  | "validating"
  | "done"
  | "cancelled"
  | "error"

interface AiRunMetrics {
  task: AiRunnableMode
  phase: AiRunPhase
  startedAt: number
}

const RESIZE_ACTIVATION_DISTANCE = 4

interface ResizeGesture {
  pointerId: number
  target: HTMLDivElement
  startX: number
  startWidth: number
  panelAndContentWidth: number
  lastWidth: number
  dragging: boolean
  previousCursor: string
  previousUserSelect: string
}

export function clampAiWorkspaceWidth(
  width: number,
  containerWidth: number,
  panelAndContentWidth = containerWidth
) {
  const upper = Math.max(
    420,
    Math.min(containerWidth * 0.65, panelAndContentWidth - 480)
  )
  return Math.round(Math.min(Math.max(width, 420), upper))
}

export function hasResizeExceededThreshold(startX: number, currentX: number) {
  return Math.abs(currentX - startX) >= RESIZE_ACTIVATION_DISTANCE
}

export function AiDocumentWorkspace({
  open,
  mode,
  requestId,
  assistantInstruction,
  assistantAutoSubmit = false,
  onAssistantAutoSubmitConsumed,
  onModeChange,
  onOpenGeneratedDraftAssistant,
  onClose,
}: AiDocumentWorkspaceProps) {
  const t = useTranslations("AiWorkspace")
  const locale = useLocale() as Locale
  const activeDocumentId = useDesignStore((state) => state.activeDocumentId)
  const rawMarkdown = useDesignStore((state) => state.rawMarkdown)
  const updateRawMarkdown = useDesignStore((state) => state.updateRawMarkdown)
  const setAiTask = useDesignStore((state) => state.setAiTask)
  const settings = useAiSettingsStore()
  const urlGenerationJob = useUrlGenerationStore((state) => state.job)
  const urlGenerationRunning = urlGenerationJob?.status === "running"
  const savedWidth = useUiPreferences((state) => state.aiWorkspaceWidth)
  const setSavedWidth = useUiPreferences((state) => state.setAiWorkspaceWidth)
  const openAiSettings = useAiSettingsDialog()
  const controllerRef = useRef<AbortController | null>(null)
  const resizeGestureRef = useRef<ResizeGesture | null>(null)
  const panelWrapperRef = useRef<HTMLDivElement | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const handledRequestRef = useRef(requestId)
  const [standardized, setStandardized] = useState("")
  const [standardizeSource, setStandardizeSource] = useState("")
  const [standardizeSourceRevision, setStandardizeSourceRevision] = useState<
    string | null
  >(null)
  const [report, setReport] = useState<ConvertedCompletenessReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState<AiRunnableMode | null>(null)
  const [runMetrics, setRunMetrics] = useState<AiRunMetrics | null>(null)
  const [panelWidth, setPanelWidth] = useState(savedWidth)
  const [isResizing, setIsResizing] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const activeProfile =
    settings.profiles.find(
      (profile) => profile.id === settings.activeProfileId
    ) ?? settings.profiles[0]

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPanelWidth(savedWidth))
    return () => window.cancelAnimationFrame(frame)
  }, [savedWidth])

  const cancelActive = useCallback(() => {
    const controller = controllerRef.current
    controllerRef.current = null
    if (!controller || controller.signal.aborted) return
    controller.abort(
      new DOMException("AI document task cancelled", "AbortError")
    )
    setRunning(null)
    setAiTask({ status: "idle", error: undefined })
    setRunMetrics((current) =>
      current && !["done", "error", "cancelled"].includes(current.phase)
        ? { ...current, phase: "cancelled" }
        : current
    )
  }, [setAiTask])

  useEffect(() => {
    cancelActive()
  }, [activeDocumentId, cancelActive])

  useEffect(() => {
    if (!open) cancelActive()
  }, [cancelActive, open])

  useEffect(
    () => () => {
      const controller = controllerRef.current
      controllerRef.current = null
      if (!controller || controller.signal.aborted) return
      controller.abort(
        new DOMException("AI document workspace unmounted", "AbortError")
      )
    },
    []
  )

  const finishResize = useCallback(
    (persist: boolean) => {
      const gesture = resizeGestureRef.current
      if (!gesture) return
      resizeGestureRef.current = null
      if (gesture.target.hasPointerCapture(gesture.pointerId)) {
        gesture.target.releasePointerCapture(gesture.pointerId)
      }
      if (gesture.dragging) {
        document.body.style.cursor = gesture.previousCursor
        document.body.style.userSelect = gesture.previousUserSelect
        setIsResizing(false)
        if (persist) setSavedWidth(gesture.lastWidth)
      }
    },
    [setSavedWidth]
  )

  useEffect(() => {
    const cancelResize = () => finishResize(false)
    window.addEventListener("blur", cancelResize)
    return () => {
      window.removeEventListener("blur", cancelResize)
      cancelResize()
    }
  }, [finishResize])

  useEffect(() => {
    if (!profileMenuOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileMenuOpen(false)
    }
    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [profileMenuOpen])

  useEffect(() => {
    if (
      !open ||
      !panelWrapperRef.current ||
      typeof ResizeObserver === "undefined"
    )
      return
    const wrapper = panelWrapperRef.current
    const container = wrapper.parentElement
    const content = wrapper.previousElementSibling as HTMLElement | null
    if (!container || !content) return
    const observer = new ResizeObserver(() => {
      setPanelWidth((width) =>
        clampAiWorkspaceWidth(
          width,
          container.clientWidth,
          width + content.clientWidth
        )
      )
    })
    observer.observe(container)
    observer.observe(content)
    return () => observer.disconnect()
  }, [open])

  const runTask = useCallback(
    async (task: AiRunnableMode) => {
      cancelActive()
      const controller = new AbortController()
      const startedAt = Date.now()
      controllerRef.current = controller
      setError(null)
      setRunning(task)
      setRunMetrics({
        task,
        phase: "connecting",
        startedAt,
      })
      setStandardized("")
      setStandardizeSource(rawMarkdown)
      setStandardizeSourceRevision(getDocumentRevision(rawMarkdown))
      setReport(null)
      setAiTask({
        status: "streaming",
        task: "convert",
        model: settings.model,
        error: undefined,
      })

      try {
        const stream = await streamAiConvert({
          task: "convert",
          input: rawMarkdown,
          settings,
          signal: controller.signal,
          locale,
        })
        setRunMetrics((current) =>
          current?.task === task && current.startedAt === startedAt
            ? { ...current, phase: "waiting" }
            : current
        )
        let output = ""
        let lastUiUpdateAt = 0
        const updateMetrics = (
          patch: Partial<Omit<AiRunMetrics, "task" | "startedAt">>
        ) => {
          setRunMetrics((current) =>
            current?.task === task && current.startedAt === startedAt
              ? { ...current, ...patch }
              : current
          )
        }
        for await (const chunk of stream.textStream) {
          if (!chunk) continue
          output += chunk
          const now = Date.now()
          updateMetrics({ phase: "streaming" })
          if (now - lastUiUpdateAt >= 80) {
            lastUiUpdateAt = now
            if (task === "standardize") setStandardized(output)
          }
        }
        const finishReason = await stream.finishReason
        ensureAiTextOutput(output, locale)
        updateMetrics({ phase: "validating" })
        setStandardized(output)
        setReport(validateConvertedMarkdown(output, finishReason))
        setAiTask({
          status: "done",
          task: "convert",
          model: settings.model,
          error: undefined,
        })
        updateMetrics({ phase: "done" })
      } catch (cause) {
        if (controller.signal.aborted) return
        const message = getAiUserFacingError(cause, locale, t("requestFailed"))
        setError(message)
        setRunMetrics((current) =>
          current?.task === task && current.startedAt === startedAt
            ? { ...current, phase: "error" }
            : current
        )
        setAiTask({ status: "error", error: message, model: settings.model })
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null
          setRunning(null)
        }
      }
    },
    [cancelActive, locale, rawMarkdown, setAiTask, settings, t]
  )

  const requestTask = useCallback(
    (task: AiRunnableMode) => {
      if (!settings.apiKey.trim()) {
        openAiSettings("ai")
        return
      }
      void runTask(task)
    },
    [openAiSettings, runTask, settings.apiKey]
  )

  useEffect(() => {
    if (!open || requestId <= 0 || handledRequestRef.current === requestId)
      return
    handledRequestRef.current = requestId
    if (mode === "assistant" || urlGenerationJob) return
    const frame = window.requestAnimationFrame(() => requestTask(mode))
    return () => window.cancelAnimationFrame(frame)
  }, [mode, open, requestId, requestTask, urlGenerationJob])

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return
    const panel = event.currentTarget.parentElement
    const wrapper = panel?.parentElement
    const container = wrapper?.parentElement
    const content = wrapper?.previousElementSibling as HTMLElement | null
    if (!container || !content) return
    finishResize(false)
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeGestureRef.current = {
      pointerId: event.pointerId,
      target: event.currentTarget,
      startX: event.clientX,
      startWidth: panelWidth,
      panelAndContentWidth: panelWidth + content.clientWidth,
      lastWidth: panelWidth,
      dragging: false,
      previousCursor: document.body.style.cursor,
      previousUserSelect: document.body.style.userSelect,
    }
  }

  const moveResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = resizeGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    if (event.pointerType === "mouse" && event.buttons !== 1) {
      finishResize(false)
      return
    }
    if (!gesture.dragging) {
      if (!hasResizeExceededThreshold(gesture.startX, event.clientX)) return
      gesture.dragging = true
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      setIsResizing(true)
    }
    const wrapper = panelWrapperRef.current
    const container = wrapper?.parentElement
    if (!container) return
    const width = clampAiWorkspaceWidth(
      gesture.startWidth + gesture.startX - event.clientX,
      container.clientWidth,
      gesture.panelAndContentWidth
    )
    gesture.lastWidth = width
    setPanelWidth(width)
  }

  const applyStandardized = () => {
    if (standardizeApplyState !== "ready") return
    updateRawMarkdown(standardized)
    toast(
      standardizedCompilation.ok ? t("applied") : t("appliedWithLimits"),
      standardizedCompilation.ok ? "success" : "warning"
    )
  }

  const visibleMetrics =
    mode === "standardize" && runMetrics?.task === mode ? runMetrics : null
  const currentRevision = getDocumentRevision(rawMarkdown)
  const candidateRevision = standardized.trim()
    ? getDocumentRevision(standardized)
    : null
  const standardizedCompilation = compileDesignArtifacts(standardized)
  const standardizeApplyState = resolveStandardizeApplyState({
    hasResult: Boolean(standardized.trim()),
    reportValid: report?.valid === true,
    sourceRevision: standardizeSourceRevision,
    currentRevision,
    candidateRevision,
  })

  return (
    <div
      ref={panelWrapperRef}
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "fixed inset-0 z-[90] w-full transition-[width] duration-200 ease-out lg:static lg:inset-auto lg:z-auto lg:h-full lg:shrink-0 lg:overflow-hidden",
        open
          ? "pointer-events-auto lg:w-[var(--ai-panel-width)]"
          : "pointer-events-none lg:w-0"
      )}
      style={{ "--ai-panel-width": `${panelWidth}px` } as React.CSSProperties}
    >
      <aside
        className={cn(
          "flex h-full min-h-0 w-full flex-col border-l border-border/70 bg-background shadow-xl transition-transform duration-200 ease-out lg:[container-type:inline-size] lg:w-[var(--ai-panel-width)] lg:min-w-[420px] lg:shadow-none",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div
          role="separator"
          aria-label={t("resize")}
          aria-orientation="vertical"
          aria-valuemin={420}
          aria-valuenow={panelWidth}
          tabIndex={0}
          onPointerDown={startResize}
          onPointerMove={moveResize}
          onPointerUp={() => finishResize(true)}
          onPointerCancel={() => finishResize(false)}
          onLostPointerCapture={() => finishResize(false)}
          onDoubleClick={() => {
            setPanelWidth(520)
            setSavedWidth(520)
          }}
          onKeyDown={(event) => {
            if (!event.currentTarget.parentElement?.parentElement) return
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
            event.preventDefault()
            const delta = event.key === "ArrowLeft" ? 24 : -24
            const panel = event.currentTarget.parentElement
            const wrapper = panel?.parentElement
            const container = wrapper?.parentElement
            const content =
              wrapper?.previousElementSibling as HTMLElement | null
            if (!container || !content) return
            const next = clampAiWorkspaceWidth(
              panelWidth + delta,
              container.clientWidth,
              panelWidth + content.clientWidth
            )
            setPanelWidth(next)
            setSavedWidth(next)
          }}
          className={cn(
            "absolute inset-y-0 -left-1 z-10 hidden w-2 cursor-col-resize touch-none place-items-center outline-none after:h-10 after:w-0.5 after:rounded-full after:bg-border hover:after:bg-primary focus-visible:after:bg-primary lg:grid",
            isResizing && "after:bg-primary"
          )}
        />
        <div className="shrink-0 border-b border-border/70 bg-muted/[0.12] p-3">
          <div className="flex items-stretch gap-2">
            <div
              className="grid min-w-0 flex-1 grid-cols-2 gap-2"
              aria-label={t("tasks")}
            >
              <WorkspaceModeTab
                active={mode === "standardize"}
                disabled={running !== null || urlGenerationRunning}
                icon={<WandSparkles className="size-4" />}
                label={t("generate")}
                detail={
                  urlGenerationJob
                    ? t("urlGenerateDetail", {
                        host: urlGenerationJob.hostname,
                      })
                    : t("generateDetail")
                }
                badge={urlGenerationJob ? t("websiteTask") : t("default")}
                onClick={() => onModeChange("standardize")}
              />
              <WorkspaceModeTab
                active={mode === "assistant"}
                disabled={running !== null || urlGenerationRunning}
                icon={<MessageSquareText className="size-4" />}
                label={t("assistant")}
                detail={t("assistantDetail")}
                onClick={() => onModeChange("assistant")}
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="self-center"
              onClick={onClose}
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {mode === "standardize" && !urlGenerationJob && error && (
            <p className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
              {error}
            </p>
          )}

          {mode === "assistant" ? (
            activeDocumentId && open ? (
              <AiAssistantChat
                key={`${activeDocumentId}:${requestId}`}
                documentId={activeDocumentId}
                markdown={rawMarkdown}
                onApply={updateRawMarkdown}
                initialInstruction={assistantInstruction}
                autoSubmitInitialInstruction={assistantAutoSubmit}
                onAutoSubmitInitialInstruction={onAssistantAutoSubmitConsumed}
              />
            ) : null
          ) : urlGenerationJob ? (
            <UrlGenerationProgress
              onOpenAiAssistant={onOpenGeneratedDraftAssistant}
            />
          ) : (
            <StandardizeContent
              source={standardizeSource || rawMarkdown}
              result={standardized}
              report={report}
              running={running === "standardize"}
              metrics={visibleMetrics}
              applyState={standardizeApplyState}
              onRun={() => requestTask("standardize")}
            />
          )}
        </div>

        {mode === "standardize" &&
          !urlGenerationJob &&
          (running === "standardize" || standardized.trim()) && (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 bg-background px-4 py-2.5">
              {running === "standardize" ? (
                <Button variant="outline" size="sm" onClick={cancelActive}>
                  <X className="h-3.5 w-3.5" />
                  {t("cancel")}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestTask("standardize")}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t("regenerate")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={applyStandardized}
                    disabled={standardizeApplyState !== "ready"}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {standardizeApplyState === "applied"
                      ? t("appliedButton")
                      : standardizeApplyState === "stale"
                        ? t("staleCandidate")
                        : t("apply")}
                  </Button>
                </>
              )}
            </div>
          )}

        <footer className="relative flex shrink-0 items-center justify-between gap-3 border-t border-border/70 px-4 py-2.5">
          <button
            type="button"
            onClick={() => openAiSettings("ai")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {t("settings")}
          </button>
          <div ref={profileMenuRef} className="relative min-w-0">
            <button
              type="button"
              disabled={running !== null || urlGenerationRunning}
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((value) => !value)}
              className="flex max-w-[250px] items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-medium">
                  {activeProfile?.name ?? t("unconfigured")}
                </span>
                <span className="block truncate text-[9px] text-muted-foreground">
                  {activeProfile?.model || t("noModel")}
                </span>
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
            </button>

            {profileMenuOpen && (
              <div
                role="menu"
                aria-label={t("switchProfile")}
                className="absolute right-0 bottom-full z-20 mb-2 w-[min(300px,calc(100vw-2rem))] rounded-xl border border-border/70 bg-popover p-1.5 shadow-xl"
              >
                <p className="px-2.5 py-2 text-[10px] font-medium text-muted-foreground">
                  {t("chooseProfile")}
                </p>
                <div className="max-h-64 overflow-y-auto">
                  {settings.profiles.map((profile) => {
                    const active = profile.id === settings.activeProfileId
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => {
                          settings.selectProfile(profile.id)
                          setProfileMenuOpen(false)
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-muted",
                          active && "bg-muted/70"
                        )}
                      >
                        <span className="grid size-4 shrink-0 place-items-center">
                          {active && (
                            <Check className="size-3.5 text-primary" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium">
                            {profile.name}
                          </span>
                          <span className="block truncate text-[10px] text-muted-foreground">
                            {getAiProvider(profile.providerId).label} ·{" "}
                            {profile.model || t("noModel")}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-1 border-t border-border/70 pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      openAiSettings("ai")
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Settings2 className="size-3.5" />
                    {t("manageProfiles")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </footer>
      </aside>
    </div>
  )
}

function WorkspaceModeTab({
  active,
  disabled,
  icon,
  label,
  detail,
  badge,
  onClick,
}: {
  active: boolean
  disabled: boolean
  icon: React.ReactNode
  label: string
  detail: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-[background-color,border-color,color,opacity]",
        active
          ? "border-border bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-background/60 hover:text-foreground",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-md",
          active
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-xs font-semibold">{label}</span>
          {badge && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
          {detail}
        </span>
      </span>
    </button>
  )
}

function StandardizeContent({
  source,
  result,
  report,
  running,
  metrics,
  applyState,
  onRun,
}: {
  source: string
  result: string
  report: ConvertedCompletenessReport | null
  running: boolean
  metrics: AiRunMetrics | null
  applyState: StandardizeApplyState
  onRun: () => void
}) {
  const t = useTranslations("AiWorkspace")
  const locale = useLocale()
  if ((!result && !running) || (!running && metrics?.phase === "cancelled"))
    return (
      <EmptyAction
        icon={<WandSparkles className="h-5 w-5" />}
        eyebrow={t("standardizeEyebrow")}
        title={t("standardizeTitle")}
        description={t("standardizeDescription")}
        points={[
          t("standardizePoint1"),
          t("standardizePoint2"),
          t("standardizePoint3"),
        ]}
        context={t("fastContext", {
          count: source.length.toLocaleString(locale),
        })}
        action={t("startGenerate")}
        onAction={onRun}
      />
    )

  const parsedResult = !running ? (report?.result ?? null) : null

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">
            {running ? t("generatingTitle") : t("generatedTitle")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {running ? t("generatingDetail") : t("generatedDetail")}
          </p>
        </div>
        {running && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>

      <RunPhaseStatus metrics={metrics} />

      {applyState === "applied" && !running ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
          {t("appliedCandidateHelp")}
        </p>
      ) : applyState === "stale" && !running ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          {t("staleCandidateHelp")}
        </p>
      ) : null}

      {report && !report.valid && !running && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          {report.reasons.join("；")}
        </div>
      )}

      {parsedResult ? (
        <StandardizeFiles
          result={parsedResult}
          markdown={result}
          className="h-[46vh] min-h-65"
        />
      ) : (
        <DocumentPane
          label={t("result")}
          value={result}
          live={running}
          className="h-[40vh] min-h-55"
        />
      )}

      {!running && result.trim() && <SourceDisclosure source={source} />}
    </div>
  )
}

function StandardizeFiles({
  result,
  markdown,
  className,
}: {
  result: ParseResult
  markdown: string
  className?: string
}) {
  const t = useTranslations("AiWorkspace")
  const prefix = slugify(result.tokens.meta.name || "design")
  const fileSources = useMemo(
    () => buildDesignFileSources({ tokens: result.tokens, markdown, prefix }),
    [markdown, prefix, result.tokens]
  )
  const compilation = useMemo(
    () => compileDesignArtifacts(markdown),
    [markdown]
  )
  const availableCount = fileSources.filter((file) => !file.disabled).length
  const issueCount = compilation.ok ? 0 : Math.max(compilation.issues.length, 1)
  return (
    <div className="flex min-h-0 flex-col gap-2">
      {compilation.ok ? (
        <p className="text-[11px] text-muted-foreground">
          {t("filesHint", { count: availableCount })}
        </p>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          <p className="font-medium">
            {t("filesLimitedHint", { count: issueCount })}
          </p>
          <p className="mt-0.5 opacity-80">{t("filesLimitedHelp")}</p>
        </div>
      )}
      <DesignFileTabs
        fileSources={fileSources}
        onDownloadAll={() =>
          downloadBlob(
            exportToZip(result.tokens, result.rawSections, markdown),
            `${prefix}-design-system.zip`
          )
        }
        onCopyError={() => toast(t("copyFailed"), "warning")}
        className={className}
      />
    </div>
  )
}

function SourceDisclosure({ source }: { source: string }) {
  const t = useTranslations("AiWorkspace")
  const locale = useLocale()
  return (
    <details className="group rounded-lg border border-border/70 bg-muted/10">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[11px] font-medium text-muted-foreground">
        <span>
          {t("compareSource", { count: source.length.toLocaleString(locale) })}
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <pre className="max-h-[300px] overflow-auto border-t border-border/60 p-3 font-mono text-[11px] leading-5 whitespace-pre-wrap text-muted-foreground">
        {source}
      </pre>
    </details>
  )
}

function DocumentPane({
  label,
  value,
  live,
  className,
}: {
  label: string
  value: string
  live?: boolean
  className?: string
}) {
  const t = useTranslations("AiWorkspace")
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-muted/15",
        className
      )}
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border/60 px-3 text-[11px] font-medium text-muted-foreground">
        {label}
        {live && <span>{t("generating")}</span>}
      </div>
      <pre className="flex-1 overflow-auto p-3 font-mono text-[11px] leading-5 whitespace-pre-wrap">
        {value || t("waitingResult")}
      </pre>
    </section>
  )
}

function EmptyAction({
  icon,
  eyebrow,
  title,
  description,
  points,
  context,
  action,
  onAction,
}: {
  icon: React.ReactNode
  eyebrow: string
  title: string
  description: string
  points: string[]
  context: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="min-h-72 border-y border-border/70 py-7">
      <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-primary uppercase">
        <span className="grid size-7 place-items-center rounded-md bg-primary/10">
          {icon}
        </span>
        {eyebrow}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <ul className="mt-5 grid gap-2 text-xs text-muted-foreground">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-2">
            <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {point}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
        <Button onClick={onAction}>
          {action}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[11px] text-muted-foreground">{context}</span>
      </div>
    </div>
  )
}

function RunPhaseStatus({ metrics }: { metrics: AiRunMetrics | null }) {
  const t = useTranslations("AiWorkspace")
  if (!metrics) return null
  const active = ["connecting", "waiting", "streaming", "validating"].includes(
    metrics.phase
  )
  const label: Record<AiRunPhase, string> = {
    connecting: t("phasePreparing"),
    waiting: t("phaseWaitingModel"),
    streaming: t("phaseReceivingBody"),
    validating: t("phaseValidating"),
    done: t("phaseDone"),
    cancelled: t("phaseCancelled"),
    error: t("phaseError"),
  }
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
        metrics.phase === "error"
          ? "border-destructive/20 bg-destructive/5 text-destructive"
          : metrics.phase === "done"
            ? "border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"
            : "border-border/70 bg-muted/[0.18] text-muted-foreground"
      )}
    >
      {active ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
      ) : metrics.phase === "done" ? (
        <Check className="size-3.5 shrink-0" />
      ) : (
        <X className="size-3.5 shrink-0" />
      )}
      <span>{label[metrics.phase]}</span>
    </div>
  )
}
