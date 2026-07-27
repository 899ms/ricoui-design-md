"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  BookOpenText,
  ChevronDown,
  Code2,
  FileText,
  Layers3,
  PanelRightClose,
  PanelRightOpen,
  WrapText,
} from "lucide-react"
import { useDesignStore } from "@/lib/store/design-store"
import { useUiPreferences } from "@/lib/store/ui-preferences"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet } from "@/components/ui/sheet"
import { MarkdownReadingPreview } from "@/components/markdown-reading-preview"
import { MarkdownSourceEditor } from "@/components/markdown-source-editor"
import { cn } from "@/lib/utils"

// Full parse + clone + persist-signature runs on every store write, so the
// textarea buffers keystrokes locally and syncs after a short pause
// (PROJECT-REVIEW §4.1).
const EDIT_DEBOUNCE_MS = 250
const SOURCE_LINE_HEIGHT = 24

interface OutlineEntry {
  level: 2 | 3
  text: string
  line: number
  offset: number
}

function getSectionOutline(markdown: string): OutlineEntry[] {
  const entries: OutlineEntry[] = []
  const lines = markdown.split("\n")
  let offset = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/^(#{2,3})\s+(.+?)\s*$/)
    if (match) {
      entries.push({
        level: match[1].length as 2 | 3,
        text: match[2].trim(),
        line: i,
        offset,
      })
    }
    offset += line.length + 1
  }
  return entries
}

export function DocumentEditor() {
  const t = useTranslations("Editor.document")
  const [documentMode, setDocumentMode] = useState<"source" | "reading">(
    "source"
  )
  const rawMarkdown = useDesignStore((state) => state.rawMarkdown)
  const parseStatus = useDesignStore((state) => state.parseStatus)
  const parseError = useDesignStore((state) => state.parseError)
  const documentDiagnostics = useDesignStore(
    (state) => state.documentDiagnostics
  )
  const lastValidParsedDocument = useDesignStore(
    (state) => state.lastValidParsedDocument
  )
  const parsedDocument = useDesignStore((state) => state.parsedDocument)
  const updateRawMarkdown = useDesignStore((state) => state.updateRawMarkdown)
  const documentModel = parsedDocument ?? lastValidParsedDocument

  const outlineCollapsed = useUiPreferences((state) => state.outlineCollapsed)
  const setOutlineCollapsed = useUiPreferences(
    (state) => state.setOutlineCollapsed
  )
  const outlineSummaryCollapsed = useUiPreferences(
    (state) => state.outlineSummaryCollapsed
  )
  const toggleOutlineSummaryCollapsed = useUiPreferences(
    (state) => state.toggleOutlineSummaryCollapsed
  )
  const sourceEditorWrap = useUiPreferences((state) => state.sourceEditorWrap)
  const toggleSourceEditorWrap = useUiPreferences(
    (state) => state.toggleSourceEditorWrap
  )

  const [draft, setDraft] = useState(rawMarkdown)
  const draftRef = useRef(rawMarkdown)
  const lastSyncedRef = useRef(rawMarkdown)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const readingScrollRef = useRef<HTMLDivElement>(null)
  const [activeOutline, setActiveOutline] = useState<string | null>(null)
  const [outlineMobileOpen, setOutlineMobileOpen] = useState(false)

  const flushDraft = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (draftRef.current !== lastSyncedRef.current) {
      lastSyncedRef.current = draftRef.current
      updateRawMarkdown(draftRef.current)
    }
  }, [updateRawMarkdown])

  // Adopt external store changes (undo/redo, structured edits, doc switch).
  useEffect(() => {
    if (rawMarkdown === lastSyncedRef.current) return
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    lastSyncedRef.current = rawMarkdown
    draftRef.current = rawMarkdown
    setDraft(rawMarkdown)
  }, [rawMarkdown])

  const handleDraftChange = useCallback(
    (value: string) => {
      draftRef.current = value
      setDraft(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        lastSyncedRef.current = draftRef.current
        updateRawMarkdown(draftRef.current)
      }, EDIT_DEBOUNCE_MS)
    },
    [updateRawMarkdown]
  )

  // Don't lose the trailing <250ms of input on tab switch/close or unmount.
  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushDraft()
    }
    window.addEventListener("pagehide", flushDraft)
    document.addEventListener("visibilitychange", flushWhenHidden)
    return () => {
      window.removeEventListener("pagehide", flushDraft)
      document.removeEventListener("visibilitychange", flushWhenHidden)
      flushDraft()
    }
  }, [flushDraft])

  const switchDocumentMode = useCallback(
    (mode: "source" | "reading") => {
      if (mode === "reading") flushDraft()
      setDocumentMode(mode)
    },
    [flushDraft]
  )

  const sectionOutline = useMemo(() => getSectionOutline(draft), [draft])

  const tokenSummary = useMemo(() => {
    if (!documentModel) return null

    const { tokens } = documentModel
    return [
      { label: t("sections"), value: sectionOutline.length },
      { label: t("colors"), value: tokens.colors.length },
      { label: t("typeSteps"), value: tokens.typography.typeScale.length },
      { label: t("spacing"), value: tokens.spacing.length },
      { label: t("components"), value: tokens.components.length },
    ]
  }, [documentModel, sectionOutline.length, t])

  const unmodeledCount =
    documentModel?.sectionSkeleton.filter((section) => !section.modeled)
      .length ?? 0

  // Active-outline tracking. Reading mode uses an IntersectionObserver on the
  // rendered h2/h3; source mode derives it from the textarea scroll position.
  useEffect(() => {
    if (documentMode !== "reading") return
    const root = readingScrollRef.current
    if (!root) return
    const headings = Array.from(root.querySelectorAll<HTMLElement>("h2, h3"))
    if (headings.length === 0) {
      setActiveOutline(null)
      return
    }

    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const text = (entry.target as HTMLElement).textContent?.trim() ?? ""
          if (!text) continue
          visible.set(text, entry.intersectionRatio)
        }
        let best: string | null = null
        let bestRatio = 0
        for (const heading of headings) {
          const text = heading.textContent?.trim() ?? ""
          const ratio = visible.get(text) ?? 0
          if (ratio > bestRatio) {
            bestRatio = ratio
            best = text
          }
        }
        if (best) setActiveOutline(best)
      },
      { root, rootMargin: "0px 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] }
    )
    headings.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [documentMode, draft])

  const handleSourceScroll = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    let active: OutlineEntry | null = null
    if (sourceEditorWrap) {
      const maxScroll = Math.max(1, ta.scrollHeight - ta.clientHeight)
      const approximateOffset =
        (Math.min(ta.scrollTop, maxScroll) / maxScroll) * draft.length
      for (const entry of sectionOutline) {
        if (entry.offset <= approximateOffset) active = entry
        else break
      }
    } else {
      const topLine = Math.round((ta.scrollTop + 8) / SOURCE_LINE_HEIGHT)
      for (const entry of sectionOutline) {
        if (entry.line <= topLine) active = entry
        else break
      }
    }
    setActiveOutline(active?.text ?? null)
  }, [draft.length, sectionOutline, sourceEditorWrap])

  const jumpToHeading = useCallback(
    (entry: OutlineEntry) => {
      if (documentMode === "source") {
        const ta = textareaRef.current
        if (!ta) return
        ta.focus()
        ta.setSelectionRange(entry.offset, entry.offset)
        ta.scrollTop = sourceEditorWrap
          ? Math.max(
              0,
              (entry.offset / Math.max(1, draft.length)) *
                Math.max(0, ta.scrollHeight - ta.clientHeight) -
                24
            )
          : Math.max(0, entry.line * SOURCE_LINE_HEIGHT - 24)
        setActiveOutline(entry.text)
        return
      }
      const root = readingScrollRef.current
      if (!root) return
      const headings = Array.from(root.querySelectorAll<HTMLElement>("h2, h3"))
      const target = headings.find(
        (heading) => (heading.textContent ?? "").trim() === entry.text
      )
      target?.scrollIntoView({ behavior: "smooth", block: "start" })
      setActiveOutline(entry.text)
    },
    [documentMode, draft.length, sourceEditorWrap]
  )

  const handleJump = (entry: OutlineEntry) => {
    jumpToHeading(entry)
    setOutlineMobileOpen(false)
  }

  const outlineBody = (
    <div className="space-y-5 p-4">
      {sectionOutline.length > 0 ? (
        <nav className="space-y-0.5" aria-label={t("outlineAria")}>
          {sectionOutline.map((entry) => {
            const isActive = activeOutline === entry.text
            return (
              <button
                key={`${entry.line}-${entry.text}`}
                type="button"
                onClick={() => handleJump(entry)}
                className={cn(
                  "block w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                  entry.level === 3
                    ? "ml-3 border-l border-border/40 pl-2.5 text-muted-foreground"
                    : "font-medium text-foreground",
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                )}
                aria-current={isActive ? "true" : undefined}
              >
                {entry.text}
              </button>
            )
          })}
        </nav>
      ) : (
        <p className="text-xs text-muted-foreground">{t("outlineEmpty")}</p>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={toggleOutlineSummaryCollapsed}
          className="flex w-full items-center gap-2 text-left"
          aria-expanded={!outlineSummaryCollapsed}
          aria-controls="outline-snapshot"
        >
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{t("snapshot")}</h3>
          <ChevronDown
            className={cn(
              "ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform",
              outlineSummaryCollapsed && "-rotate-90"
            )}
          />
        </button>

        <div id="outline-snapshot">
          {tokenSummary ? (
            outlineSummaryCollapsed ? (
              <p className="text-[11px] text-muted-foreground">
                {tokenSummary
                  .map((item) => `${item.value} ${item.label}`)
                  .join(" · ")}
              </p>
            ) : (
              <div className="space-y-1.5">
                {tokenSummary.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-md border border-border/50 bg-background/60 px-3 py-1.5 text-xs shadow-[var(--shadow-sm)]"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-xs text-muted-foreground">{t("noSummary")}</p>
          )}
        </div>
      </div>

      {unmodeledCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          {t("unmodeled", { count: unmodeledCount })}
        </div>
      )}
    </div>
  )

  return (
    <div className="editor-canvas flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        {(parseStatus === "degraded" || parseStatus === "invalid") && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                {documentDiagnostics.map((diagnostic) => (
                  <p key={`${diagnostic.kind}-${diagnostic.message}`}>
                    {diagnostic.message}
                  </p>
                ))}
                {parseError && documentDiagnostics.length === 0 && (
                  <p>{parseError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <div className="relative flex min-w-0 flex-1 flex-col p-3 lg:p-4">
            {/* Compact 源码/阅读 switch — floats at the document surface
                top-right (V7-PRD §4.4). */}
            <div className="pointer-events-auto absolute top-5 right-5 z-20 flex h-7 items-center gap-1.5 lg:top-6 lg:right-10">
              {documentMode === "source" && (
                <button
                  type="button"
                  aria-pressed={sourceEditorWrap}
                  aria-label={
                    sourceEditorWrap ? t("wrapEnabled") : t("wrapDisabled")
                  }
                  title={
                    sourceEditorWrap ? t("wrapEnabled") : t("wrapDisabled")
                  }
                  onClick={toggleSourceEditorWrap}
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-md border transition-colors active:translate-y-px",
                    sourceEditorWrap
                      ? "border-border/70 bg-background text-foreground shadow-[var(--shadow-sm)]"
                      : "border-transparent bg-muted/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <WrapText className="size-3.5" />
                </button>
              )}
              <div
                className="segmented-control flex h-7 items-center gap-0.5 rounded-md p-0.5"
                role="tablist"
                aria-label={t("displayMode")}
              >
                <ModeButton
                  active={documentMode === "source"}
                  onClick={() => switchDocumentMode("source")}
                  icon={<Code2 className="h-3.5 w-3.5" />}
                  label={t("source")}
                />
                <ModeButton
                  active={documentMode === "reading"}
                  onClick={() => switchDocumentMode("reading")}
                  icon={<BookOpenText className="h-3.5 w-3.5" />}
                  label={t("reading")}
                />
              </div>
            </div>

            {/* Mobile: outline opener, mirrors the switch on the left
                (V7-PRD §4.3 collapse, §4.8 mobile). */}
            <button
              type="button"
              onClick={() => setOutlineMobileOpen(true)}
              className="absolute top-5 left-5 z-20 inline-flex h-7 items-center gap-1 rounded-md border border-border/60 bg-background/80 px-2 text-[11px] font-medium backdrop-blur-sm lg:hidden"
              aria-label={t("openOutline")}
            >
              <Layers3 className="h-3.5 w-3.5" />
              <Badge variant="outline" className="text-[10px]">
                {sectionOutline.length}
              </Badge>
            </button>

            <div className="min-h-0 flex-1">
              {documentMode === "source" ? (
                <MarkdownSourceEditor
                  textareaRef={textareaRef}
                  value={draft}
                  ariaLabel={t("sourceEditor")}
                  softWrap={sourceEditorWrap}
                  onChange={handleDraftChange}
                  onScroll={handleSourceScroll}
                  onBlur={flushDraft}
                />
              ) : (
                <div
                  ref={readingScrollRef}
                  className="code-editor-surface h-full overflow-y-auto rounded-lg pt-11"
                >
                  <div className="mx-auto w-full  px-4 pb-10 lg:px-5">
                    <MarkdownReadingPreview markdown={draft} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Outline panel — desktop only (V7-PRD §4.3). */}
          {outlineCollapsed ? (
            <aside className="editor-sidebar hidden w-12 shrink-0 flex-col items-center gap-2 border-l border-border/60 py-3 lg:flex">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOutlineCollapsed(false)}
                aria-label={t("expandOutline")}
                title={t("expandOutline")}
              >
                <PanelRightOpen className="h-4 w-4" />
              </Button>
              <Badge variant="outline" className="text-[10px]">
                {sectionOutline.length}
              </Badge>
            </aside>
          ) : (
            <aside className="editor-sidebar hidden w-72 shrink-0 border-l border-border/60 lg:flex lg:flex-col">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                <Layers3 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">{t("outline")}</h3>
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {sectionOutline.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setOutlineCollapsed(true)}
                  aria-label={t("collapseOutline")}
                  title={t("collapseOutline")}
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="min-h-0 flex-1">{outlineBody}</ScrollArea>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile outline drawer (C7 / M4). */}
      <Sheet
        open={outlineMobileOpen}
        onClose={() => setOutlineMobileOpen(false)}
        side="right"
        className="w-[300px] p-0"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{t("outline")}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOutlineMobileOpen(false)}
            aria-label={t("closeOutline")}
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-49px)]">{outlineBody}</ScrollArea>
      </Sheet>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      title={label}
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded px-2 text-[11px] font-medium transition-colors outline-none",
        active
          ? "bg-background text-foreground shadow-[var(--shadow-sm)]"
          : "text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
