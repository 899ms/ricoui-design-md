"use client"

import {
  Fragment,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertTriangle,
  Check,
  CircleStop,
  FileDiff,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react"
import { ensureAiTextOutput, streamAiConvert } from "@/lib/ai/ai-client"
import { getAiUserFacingError } from "@/lib/ai/provider-error"
import {
  assistantOutcomeMeetsIntent,
  buildDocumentLineDiff,
  detectAssistantAreas,
  formatRepairConversation,
  getAssistantProposalAction,
  hasDocumentChanges,
  isDocumentRepairEnvelopeError,
  parseDocumentRepairResponse,
  resolveAssistantIntent,
} from "@/lib/ai/document-repair-chat"
import { getDocumentRevision } from "@/lib/document-revision"
import {
  evaluateDesignDocument,
  formatDocumentEvaluationDiagnostics,
  type DocumentEvaluation,
} from "@/lib/document-evaluation"
import { useAiSettingsStore } from "@/lib/store/ai-settings-store"
import {
  createAiRepairMessage,
  useAiRepairChatStore,
  type AiRepairMessage,
} from "@/lib/store/ai-repair-chat-store"
import { useDesignStore } from "@/lib/store/design-store"
import { toast } from "@/lib/store/toast"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"
import { useAiSettingsDialog } from "@/components/ai-settings-dialog-provider"
import { Button } from "@/components/ui/button"

const EMPTY_MESSAGES: AiRepairMessage[] = []
const MAX_VISIBLE_DIFF_LINES = 260

function visibleDiffIndexes(
  lines: ReturnType<typeof buildDocumentLineDiff>["lines"]
) {
  if (lines.length <= MAX_VISIBLE_DIFF_LINES) {
    return lines.map((_, index) => index)
  }

  const indexes = new Set<number>()
  lines.forEach((line, index) => {
    if (line.type === "same") return
    for (let context = -2; context <= 2; context += 1) {
      const candidate = index + context
      if (candidate >= 0 && candidate < lines.length) indexes.add(candidate)
    }
  })
  return [...indexes]
    .sort((left, right) => left - right)
    .slice(0, MAX_VISIBLE_DIFF_LINES)
}

export function AiAssistantChat({
  documentId,
  markdown,
  onApply,
  initialInstruction,
  autoSubmitInitialInstruction = false,
  onAutoSubmitInitialInstruction,
}: {
  documentId: string
  markdown: string
  onApply: (markdown: string) => void
  initialInstruction?: string
  autoSubmitInitialInstruction?: boolean
  onAutoSubmitInitialInstruction?: () => void
}) {
  const t = useTranslations("AiWorkspace")
  const issueCopy = useTranslations("UrlGeneration.issue")
  const locale = useLocale() as Locale
  const settings = useAiSettingsStore()
  const openAiSettings = useAiSettingsDialog()
  const setAiTask = useDesignStore((state) => state.setAiTask)
  const messages = useAiRepairChatStore(
    (state) => state.threads[documentId]?.messages ?? EMPTY_MESSAGES
  )
  const proposal = useAiRepairChatStore(
    (state) => state.threads[documentId]?.proposal
  )
  const hydrated = useAiRepairChatStore((state) => state.hydrated)
  const appendMessage = useAiRepairChatStore((state) => state.appendMessage)
  const setProposal = useAiRepairChatStore((state) => state.setProposal)
  const clearThread = useAiRepairChatStore((state) => state.clearThread)
  const controllerRef = useRef<AbortController | null>(null)
  const autoSubmittedRef = useRef(false)
  const endRef = useRef<HTMLDivElement | null>(null)
  const [instruction, setInstruction] = useState(initialInstruction ?? "")
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (useAiRepairChatStore.persist.hasHydrated()) {
      useAiRepairChatStore.getState().setHydrated(true)
      return
    }
    void Promise.resolve(useAiRepairChatStore.persist.rehydrate()).then(() => {
      useAiRepairChatStore.getState().setHydrated(true)
    })
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" })
  }, [messages.length, proposal, running])

  useEffect(
    () => () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    },
    [documentId]
  )

  const currentRevision = getDocumentRevision(markdown)
  const currentEvaluation = useMemo(
    () => evaluateDesignDocument(markdown),
    [markdown]
  )
  const staleProposal =
    proposal !== undefined && proposal.baseRevision !== currentRevision
  const diff = useMemo(
    () =>
      proposal ? buildDocumentLineDiff(markdown, proposal.markdown) : null,
    [markdown, proposal]
  )
  const shownDiffIndexes = useMemo(
    () => (diff ? visibleDiffIndexes(diff.lines) : []),
    [diff]
  )
  const proposalEvaluation = useMemo(
    () => (proposal ? evaluateDesignDocument(proposal.markdown) : null),
    [proposal]
  )
  const proposalIssues = proposalEvaluation
    ? formatDocumentEvaluationDiagnostics(proposalEvaluation)
    : []
  const proposalQuality =
    proposalEvaluation?.derived.status === "ready" ? "ready" : "warning"
  const proposalAction = proposal
    ? getAssistantProposalAction(proposalQuality ?? "blocked", staleProposal)
    : null

  const describeIssue = (issue: string) => {
    if (issue === "structured-content-unavailable") {
      return t("structuredUnavailable")
    }
    if (issue.startsWith("parse-error:")) return t("parseUnavailable")
    if (issueCopy.has(issue)) return issueCopy(issue as never)
    const exportIssue =
      /^(missing-token|invalid-token|invalid-value|unresolved-reference):\s*([^()]+?)(?:\s*\((.*)\))?$/.exec(
        issue
      )
    if (exportIssue) {
      const [, code, rawPath] = exportIssue
      const path = rawPath.trim()
      const font = /^typography\.fontFamilies\.(\d+)\.token$/.exec(path)
      if (code === "missing-token" && font) {
        return t("missingFontToken", { index: Number(font[1]) + 1 })
      }
      if (code === "missing-token") return t("missingExportToken", { path })
      if (code === "invalid-token") return t("invalidExportToken", { path })
      if (code === "invalid-value") return t("invalidExportValue", { path })
      return t("unresolvedExportReference", { path })
    }
    return issue
  }

  const cancel = () => {
    controllerRef.current?.abort()
  }

  const send = async (suggestedInstruction?: string) => {
    const nextInstruction = (suggestedInstruction ?? instruction).trim()
    if (!nextInstruction || running) return
    if (!settings.apiKey.trim()) {
      openAiSettings("ai")
      return
    }

    const controller = new AbortController()
    const detectedIntent = resolveAssistantIntent(
      nextInstruction,
      currentEvaluation
    )
    controllerRef.current = controller
    setRunning(true)
    setError(null)
    setInstruction("")
    appendMessage(documentId, createAiRepairMessage("user", nextInstruction))
    setAiTask({
      status: "streaming",
      task: "assistant",
      model: settings.model,
      error: undefined,
    })

    try {
      const diagnostics = formatDocumentEvaluationDiagnostics(currentEvaluation)
      const requestRevision = async ({
        source,
        request,
        machineDiagnostics,
        previousOutput,
      }: {
        source: string
        request: string
        machineDiagnostics: string[]
        previousOutput?: string
      }) => {
        const requests = [
          request,
          `${request}\n\nYour previous response could not be parsed. Return only the exact required envelope with <<<TASK>>>, <<<REPLY>>>, <<<DESIGN_MD>>>, the complete revised document, and <<<END_DESIGN_MD>>>. Do not omit or rename any marker.`,
        ]

        for (const [attempt, attemptRequest] of requests.entries()) {
          const stream = await streamAiConvert({
            task: "assistant",
            input: source,
            instruction: attemptRequest,
            diagnostics: [...new Set(machineDiagnostics)],
            conversation: formatRepairConversation(messages),
            previousOutput,
            assistantIntent: detectedIntent,
            settings,
            signal: controller.signal,
            locale,
          })
          let output = ""
          for await (const chunk of stream.textStream) output += chunk
          const finishReason = await stream.finishReason
          ensureAiTextOutput(output, locale)
          if (finishReason !== "stop") throw new Error(t("assistantIncomplete"))
          try {
            return parseDocumentRepairResponse(output)
          } catch (cause) {
            if (attempt === 0 && isDocumentRepairEnvelopeError(cause)) continue
            throw cause
          }
        }
        throw new Error(t("assistantEnvelopeFailed"))
      }

      let result = await requestRevision({
        source: markdown,
        request: nextInstruction,
        machineDiagnostics: diagnostics,
        previousOutput: staleProposal ? undefined : proposal?.markdown,
      })
      let hasChanges = hasDocumentChanges(markdown, result.markdown)
      let afterEvaluation = evaluateDesignDocument(result.markdown)
      let goalMet = assistantOutcomeMeetsIntent({
        intent: detectedIntent,
        before: currentEvaluation,
        after: afterEvaluation,
        hasChanges,
      })

      // Retry one failed deterministic verification against the candidate.
      // The corrected Markdown remains an unapplied proposal.
      if (detectedIntent !== "explain" && !goalMet) {
        result = await requestRevision({
          source: result.markdown,
          request: `Continue the user's original request: ${nextInstruction}\n\nDeterministic verification of the previous draft failed. Rewrite the complete DESIGN.md so the listed diagnostics are actually resolved; do not merely describe changes or return the same structure.`,
          machineDiagnostics:
            formatDocumentEvaluationDiagnostics(afterEvaluation),
        })
        hasChanges = hasDocumentChanges(markdown, result.markdown)
        afterEvaluation = evaluateDesignDocument(result.markdown)
        goalMet = assistantOutcomeMeetsIntent({
          intent: detectedIntent,
          before: currentEvaluation,
          after: afterEvaluation,
          hasChanges,
        })
      }

      const resultIntent = detectedIntent
      const assistantMessage = createAiRepairMessage(
        "assistant",
        hasChanges
          ? `${t("assistantProposalSummaryPrefix")}\n\n${result.summary}`
          : result.summary,
        hasChanges ? "reply" : "no-change"
      )
      setProposal(
        documentId,
        hasChanges
          ? {
              intent: resultIntent,
              scope: result.scope,
              summary: result.summary,
              markdown: result.markdown,
              baseRevision: currentRevision,
              createdAt: assistantMessage.createdAt,
              quality:
                afterEvaluation.derived.status === "ready"
                  ? "ready"
                  : "warning",
              issues: formatDocumentEvaluationDiagnostics(afterEvaluation),
              beforeEvaluation: currentEvaluation,
              afterEvaluation,
              goalMet,
            }
          : undefined
      )
      appendMessage(documentId, assistantMessage)
      setAiTask({
        status: "done",
        task: "assistant",
        model: settings.model,
        error: undefined,
      })
    } catch (cause) {
      if (controller.signal.aborted) {
        setAiTask({ status: "idle", error: undefined })
        return
      }
      const message = isDocumentRepairEnvelopeError(cause)
        ? t("assistantEnvelopeFailed")
        : getAiUserFacingError(cause, locale, t("assistantFailed"))
      setError(message)
      setAiTask({
        status: "error",
        task: "assistant",
        model: settings.model,
        error: message,
      })
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
      setRunning(false)
    }
  }

  const autoSubmitInstruction = useEffectEvent((value: string) => {
    onAutoSubmitInitialInstruction?.()
    void send(value)
  })

  useEffect(() => {
    if (
      !hydrated ||
      !autoSubmitInitialInstruction ||
      !initialInstruction?.trim() ||
      autoSubmittedRef.current
    ) {
      return
    }
    autoSubmittedRef.current = true
    autoSubmitInstruction(initialInstruction)
  }, [autoSubmitInitialInstruction, hydrated, initialInstruction])

  const applyProposal = () => {
    if (!proposal || staleProposal) return
    onApply(proposal.markdown)
    setProposal(documentId, undefined)
    toast(
      proposalEvaluation?.derived.status === "ready"
        ? t("assistantApplied")
        : t("assistantAppliedWithLimits"),
      proposalEvaluation?.derived.status === "ready" ? "success" : "warning"
    )
  }

  const refreshProposal = () => {
    void send(t("assistantRefreshInstruction"))
  }

  const suggestions = [
    t("assistantSuggestion1"),
    t("assistantSuggestion2"),
    t("assistantSuggestion3"),
  ]
  const pendingIntent = instruction.trim()
    ? resolveAssistantIntent(instruction, currentEvaluation)
    : null
  const pendingAreas = pendingIntent
    ? detectAssistantAreas(instruction, pendingIntent)
    : []

  return (
    <div className="flex min-h-full flex-col gap-4">
      {messages.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("clearConversation")}
            disabled={running}
            onClick={() => clearThread(documentId)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}

      {hydrated && messages.length === 0 && !proposal ? (
        <section className="rounded-xl border border-border/70 bg-muted/15 p-3.5">
          <div className="flex items-center gap-2 text-xs font-medium">
            <MessageSquareText className="size-3.5 text-primary" />
            {t("assistantEmptyTitle")}
          </div>
          <div className="mt-3 grid gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                className="rounded-lg border border-border/70 bg-background px-3 py-2.5 text-left text-xs leading-5 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {messages.length > 0 && (
        <section aria-label={t("assistantConversation")} className="grid gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[92%] cursor-text rounded-xl px-3.5 py-3 text-xs leading-5 select-text",
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "border border-border/70 bg-muted/20 text-foreground"
              )}
            >
              {message.role === "assistant" ? (
                <div className="grid gap-2">
                  {message.outcome === "no-change" && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                      {t("assistantNoChanges")}
                    </div>
                  )}
                  <AssistantMessageContent content={message.content} />
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{message.content}</span>
              )}
            </div>
          ))}
        </section>
      )}

      {running && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] px-3.5 py-3">
          <span className="flex min-w-0 items-center gap-2 text-xs">
            <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
            {t("assistantWorking")}
          </span>
          <Button variant="ghost" size="xs" onClick={cancel}>
            <CircleStop className="size-3.5" />
            {t("cancel")}
          </Button>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
          {error}
        </p>
      )}

      {proposal && diff && (
        <section className="overflow-hidden rounded-xl border border-border/80 bg-card">
          <div className="border-b border-border/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileDiff className="size-4 text-primary" />
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold">
                    {t("proposalTitle")}
                  </h4>
                  {proposal.intent && (
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {t(`intent.${proposal.intent}`)}
                      {proposal.scope ? ` · ${proposal.scope}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <ProposalStatus
                quality={proposalQuality ?? "blocked"}
                stale={staleProposal}
              />
            </div>
          </div>

          {proposalIssues.length > 0 && (
            <div className="border-b border-border/70 bg-amber-500/[0.04] px-4 py-3">
              <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <div className="grid gap-1">
                  {proposalIssues.slice(0, 5).map((issue) => (
                    <span key={issue}>{describeIssue(issue)}</span>
                  ))}
                  <span className="mt-1 text-muted-foreground">
                    {t("proposalWarningHelp")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {proposal.goalMet === false && (
            <div className="border-b border-border/70 bg-amber-500/[0.04] px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300">
              {t("assistantGoalUnmet")}
            </div>
          )}

          {proposalEvaluation && (
            <CapabilityComparison
              before={proposal.beforeEvaluation ?? currentEvaluation}
              after={proposalEvaluation}
            />
          )}

          <details className="group border-b border-border/70">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-medium hover:bg-muted/20">
              <span>{t("viewChanges")}</span>
              <span className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">
                  +{diff.added} {t("addedLines")}
                </span>
                <span className="text-destructive">
                  −{diff.removed} {t("removedLines")}
                </span>
              </span>
            </summary>
            <div className="max-h-[360px] cursor-text overflow-auto border-t border-border/60 bg-muted/10 py-2 font-mono text-[10px] leading-5 select-text">
              {shownDiffIndexes.map((index, position) => {
                const line = diff.lines[index]
                const previousIndex = shownDiffIndexes[position - 1]
                return (
                  <div key={`${index}-${line.type}`}>
                    {position > 0 && index - previousIndex > 1 && (
                      <div className="px-3 py-1 text-center text-muted-foreground/60">
                        ···
                      </div>
                    )}
                    <div
                      className={cn(
                        "grid grid-cols-[20px_1fr] px-3",
                        line.type === "add" &&
                          "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
                        line.type === "remove" &&
                          "bg-destructive/10 text-destructive",
                        line.type === "same" && "text-muted-foreground"
                      )}
                    >
                      <span aria-hidden="true">
                        {line.type === "add"
                          ? "+"
                          : line.type === "remove"
                            ? "−"
                            : " "}
                      </span>
                      <span className="break-all whitespace-pre-wrap">
                        {line.text || " "}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </details>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProposal(documentId, undefined)}
              disabled={running}
            >
              <X className="size-3.5" />
              {t("discardProposal")}
            </Button>
            {proposalAction === "refresh" ? (
              <Button size="sm" onClick={refreshProposal} disabled={running}>
                <RefreshCw className="size-3.5" />
                {t("assistantRefreshProposal")}
              </Button>
            ) : (
              <Button size="sm" onClick={applyProposal} disabled={running}>
                <Check className="size-3.5" />
                {t("applyRevision")}
              </Button>
            )}
          </div>
        </section>
      )}

      <div ref={endRef} />

      <section className="sticky bottom-0 mt-auto rounded-xl border border-border/80 bg-background/95 p-3 shadow-[0_-8px_24px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
        <p className="mb-2 text-[10px] leading-4 text-muted-foreground">
          {t("proposalOnlyNotice")}
        </p>
        {pendingIntent && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-muted/45 px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <MessageSquareText className="size-3.5 shrink-0 text-primary" />
            <span>
              {t("intentDetected", {
                intent: t(`intent.${pendingIntent}`),
                scope: pendingAreas
                  .map((area) => t(`intentArea.${area}`))
                  .join(locale === "zh-CN" ? "、" : ", "),
              })}
            </span>
          </div>
        )}
        <label htmlFor="ai-assistant-instruction" className="sr-only">
          {t("assistantComposerLabel")}
        </label>
        <textarea
          id="ai-assistant-instruction"
          value={instruction}
          disabled={running}
          rows={3}
          placeholder={t("assistantComposerPlaceholder")}
          onChange={(event) => setInstruction(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault()
              void send()
            }
          }}
          className="min-h-20 w-full resize-none bg-transparent px-1 text-xs  outline-none placeholder:text-muted-foreground"
        />
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/60 pt-2">
          <span className="text-[10px] text-muted-foreground">
            {t("assistantSendHint")}
          </span>
          <Button
            size="sm"
            disabled={running || !instruction.trim()}
            onClick={() => void send()}
          >
            <Send className="size-3.5" />
            {t("sendAssistant")}
          </Button>
        </div>
      </section>
    </div>
  )
}
function CapabilityComparison({
  before,
  after,
}: {
  before: DocumentEvaluation
  after: DocumentEvaluation
}) {
  const t = useTranslations("AiWorkspace")
  const rows = ["parse", "structured", "derived"] as const
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 border-b border-border/70 px-4 py-3 text-[11px]">
      <span className="font-medium text-muted-foreground">
        {t("capability")}
      </span>
      <span className="text-muted-foreground">{t("before")}</span>
      <span className="text-muted-foreground">{t("after")}</span>
      {rows.map((row) => (
        <Fragment key={row}>
          <span>{t(`capabilityLevel.${row}`)}</span>
          <CapabilityMark ready={before[row].status === "ready"} />
          <CapabilityMark ready={after[row].status === "ready"} />
        </Fragment>
      ))}
    </div>
  )
}

function CapabilityMark({ ready }: { ready: boolean }) {
  const t = useTranslations("AiWorkspace")
  return (
    <span className={ready ? "text-emerald-600" : "text-amber-600"}>
      {ready ? t("available") : t("limited")}
    </span>
  )
}

function renderInlineMarkdown(value: string, keyPrefix: string): ReactNode[] {
  return value
    .split(/(\*\*[^*]+\*\*|`[^`\n]+`)/g)
    .filter(Boolean)
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={key} className="font-semibold text-foreground">
            {renderInlineMarkdown(part.slice(2, -2), `${key}-strong`)}
          </strong>
        )
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={key}
            className="rounded bg-muted px-1 py-0.5 font-mono text-[0.92em] text-foreground"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
}

function AssistantMessageContent({ content }: { content: string }) {
  const normalized = content.replace(/\s+(?=\d+\.\s+\*\*)/g, "\n")
  const lines = normalized.replace(/\r\n?/g, "\n").split("\n")
  const blocks: ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index].trim()
    if (!line) {
      index += 1
      continue
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(line)
    if (ordered) {
      const items: string[] = []
      while (index < lines.length) {
        const match = /^\d+\.\s+(.+)$/.exec(lines[index].trim())
        if (!match) break
        items.push(match[1])
        index += 1
      }
      blocks.push(
        <ol key={`ordered-${index}`} className="list-decimal space-y-1.5 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`} className="pl-1">
              {renderInlineMarkdown(item, `ordered-${index}-${itemIndex}`)}
            </li>
          ))}
        </ol>
      )
      continue
    }

    const bullet = /^[-*]\s+(.+)$/.exec(line)
    if (bullet) {
      const items: string[] = []
      while (index < lines.length) {
        const match = /^[-*]\s+(.+)$/.exec(lines[index].trim())
        if (!match) break
        items.push(match[1])
        index += 1
      }
      blocks.push(
        <ul key={`bullet-${index}`} className="list-disc space-y-1.5 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`} className="pl-1">
              {renderInlineMarkdown(item, `bullet-${index}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    const heading = /^#{1,4}\s+(.+)$/.exec(line)
    if (heading) {
      blocks.push(
        <p key={`heading-${index}`} className="font-semibold text-foreground">
          {renderInlineMarkdown(heading[1], `heading-${index}`)}
        </p>
      )
      index += 1
      continue
    }

    const paragraph: string[] = [line]
    index += 1
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^#{1,4}\s+/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push(
      <p key={`paragraph-${index}`}>
        {renderInlineMarkdown(paragraph.join(" "), `paragraph-${index}`)}
      </p>
    )
  }

  return <div className="grid gap-2.5">{blocks}</div>
}

function ProposalStatus({
  quality,
  stale,
}: {
  quality: "ready" | "warning" | "blocked"
  stale: boolean
}) {
  const t = useTranslations("AiWorkspace")
  const label = stale
    ? t("proposalStale")
    : quality === "ready"
      ? t("proposalReady")
      : quality === "warning"
        ? t("proposalWarning")
        : t("proposalBlocked")
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium",
        !stale &&
          quality === "ready" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        !stale &&
          quality === "warning" &&
          "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        (stale || quality === "blocked") && "bg-destructive/10 text-destructive"
      )}
    >
      {label}
    </span>
  )
}
