"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Copy,
  FileText,
  Loader2,
  WandSparkles,
  X,
} from "lucide-react"
import { useDesignStore } from "@/lib/store/design-store"
import { ensureAiTextOutput, streamAiConvert } from "@/lib/ai/ai-client"
import { getAiUserFacingError } from "@/lib/ai/provider-error"
import { useAiFeatureEnabled } from "@/hooks/use-ai-feature-enabled"
import { useAiSettingsStore } from "@/lib/store/ai-settings-store"
import type {
  ImportDiagnosticsReport,
  ImportSuggestion,
} from "@/lib/types/tokens"
import { Sheet } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/lib/i18n/config"

interface ImportDiagnosticsPanelProps {
  open: boolean
  onClose: () => void
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: string
}) {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3">
      <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${tone ?? ""}`}>{value}</p>
    </div>
  )
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: "high" | "medium" | "low"
}) {
  const t = useTranslations("ImportDiagnostics.confidence")
  const className =
    confidence === "high"
      ? "border-emerald-200 text-emerald-700"
      : confidence === "medium"
        ? "border-amber-200 text-amber-700"
        : "border-rose-200 text-rose-700"

  return (
    <Badge variant="outline" className={className}>
      {t(confidence)}
    </Badge>
  )
}

export function ImportDiagnosticsPanel({
  open,
  onClose,
}: ImportDiagnosticsPanelProps) {
  const locale = useLocale() as Locale
  const t = useTranslations("ImportDiagnostics")
  const common = useTranslations("Common")
  const tokens = useDesignStore((state) => state.tokens)
  const parseStatus = useDesignStore((state) => state.parseStatus)
  const importDiagnostics = useDesignStore((state) => state.importDiagnostics)
  const applyImportSuggestion = useDesignStore(
    (state) => state.applyImportSuggestion
  )
  const applyAllImportSuggestions = useDesignStore(
    (state) => state.applyAllImportSuggestions
  )
  const rawMarkdown = useDesignStore((state) => state.rawMarkdown)
  const setImportDiagnostics = useDesignStore(
    (state) => state.setImportDiagnostics
  )
  const setAiTask = useDesignStore((state) => state.setAiTask)
  const aiEnabled = useAiFeatureEnabled()
  const aiSettings = useAiSettingsStore()
  const [copiedDraft, setCopiedDraft] = useState(false)
  const [aiRepairing, setAiRepairing] = useState(false)
  const [aiRepairError, setAiRepairError] = useState<string | null>(null)
  const categoryLabels: Record<string, string> = {
    "semantic-role": t("category.semanticRole"),
    "missing-field": t("category.missingField"),
    "format-risk": t("category.formatRisk"),
    "metadata-draft": t("category.metadataDraft"),
  }

  const actionableSuggestions = useMemo(
    () =>
      importDiagnostics?.suggestions.filter(
        (suggestion) => suggestion.action.type !== "none"
      ) ?? [],
    [importDiagnostics]
  )

  const canApplySuggestions = parseStatus === "valid"
  const metadataDraft = importDiagnostics?.metadataDraft ?? ""

  const handleAiRepair = async () => {
    if (!aiSettings.apiKey || !rawMarkdown) return
    setAiRepairing(true)
    setAiRepairError(null)
    setAiTask({ status: "streaming", model: aiSettings.model })
    try {
      const stream = await streamAiConvert({
        task: "repair",
        input: rawMarkdown,
        diagnostics: importDiagnostics?.warnings ?? [],
        settings: aiSettings,
        locale,
      })
      let output = ""
      for await (const chunk of stream.textStream) output += chunk
      ensureAiTextOutput(output, locale)
      const start = output.indexOf("{")
      const end = output.lastIndexOf("}")
      const parsed: unknown = JSON.parse(output.slice(start, end + 1))
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !Array.isArray((parsed as { suggestions?: unknown }).suggestions)
      ) {
        throw new Error(t("invalidAiSuggestions"))
      }
      const suggestions = (
        parsed as { suggestions: unknown[] }
      ).suggestions.filter((value): value is ImportSuggestion => {
        if (!value || typeof value !== "object") return false
        const item = value as Partial<ImportSuggestion>
        return (
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          Boolean(item.action)
        )
      })
      const report: ImportDiagnosticsReport = {
        summary: {
          suggestions: suggestions.length,
          actionable: suggestions.filter((item) => item.action.type !== "none")
            .length,
          warnings: importDiagnostics?.warnings.length ?? 0,
        },
        suggestions,
        warnings: importDiagnostics?.warnings ?? [],
        metadataDraft: importDiagnostics?.metadataDraft ?? "",
      }
      setImportDiagnostics(report)
      setAiTask({ status: "done", model: aiSettings.model, error: undefined })
    } catch (error) {
      const message = getAiUserFacingError(error, locale, t("aiRepairFailed"))
      setAiRepairError(message)
      setAiTask({ status: "error", model: aiSettings.model, error: message })
    } finally {
      setAiRepairing(false)
    }
  }

  const handleCopyDraft = async () => {
    if (!metadataDraft) return
    await navigator.clipboard.writeText(metadataDraft)
    setCopiedDraft(true)
    setTimeout(() => setCopiedDraft(false), 1500)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      className="w-full sm:w-[420px] lg:w-[480px]"
    >
      <div className="flex h-full flex-col">
        <div className="border-b bg-background px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">{t("title")}</h2>
                <Badge
                  variant="secondary"
                  className="text-[10px] tracking-wide uppercase"
                >
                  {t("advisory")}
                </Badge>
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                {t("description")}
              </p>
              {tokens && (
                <p className="text-xs text-muted-foreground">
                  {t("currentDocument", { name: tokens.meta.name })}
                </p>
              )}
            </div>

            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-5">
            {!importDiagnostics ? (
              <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                {t("waiting")}
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryCard
                    label={t("suggestions")}
                    value={importDiagnostics.summary.suggestions}
                  />
                  <SummaryCard
                    label={t("actionable")}
                    value={importDiagnostics.summary.actionable}
                    tone="text-emerald-700"
                  />
                  <SummaryCard
                    label={t("warnings")}
                    value={importDiagnostics.summary.warnings}
                    tone="text-amber-700"
                  />
                </div>

                {!canApplySuggestions && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>{t("invalidDocument")}</p>
                    </div>
                  </div>
                )}

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {t("suggestions")}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("suggestionDetail")}
                      </p>
                    </div>
                    {aiEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleAiRepair()}
                        disabled={
                          aiRepairing || !aiSettings.apiKey || !rawMarkdown
                        }
                      >
                        {aiRepairing ? (
                          <Loader2
                            data-icon="inline-start"
                            className="animate-spin"
                          />
                        ) : (
                          <WandSparkles data-icon="inline-start" />
                        )}
                        {t("aiSuggestions")}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyAllImportSuggestions}
                      disabled={
                        !canApplySuggestions ||
                        actionableSuggestions.length === 0
                      }
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t("applyAll")}
                    </Button>
                  </div>

                  {aiRepairError && (
                    <p className="text-xs text-destructive">{aiRepairError}</p>
                  )}

                  {importDiagnostics.suggestions.length > 0 ? (
                    importDiagnostics.suggestions.map((suggestion) => {
                      const actionable = suggestion.action.type !== "none"

                      return (
                        <div
                          key={suggestion.id}
                          className="space-y-3 rounded-lg border bg-background p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">
                                  {categoryLabels[suggestion.category] ??
                                    suggestion.category.replace(/-/g, " ")}
                                </Badge>
                                <ConfidenceBadge
                                  confidence={suggestion.confidence}
                                />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold">
                                  {suggestion.title}
                                </h4>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                  {suggestion.description}
                                </p>
                              </div>
                            </div>

                            <Button
                              variant={actionable ? "secondary" : "ghost"}
                              size="sm"
                              onClick={() =>
                                applyImportSuggestion(suggestion.id)
                              }
                              disabled={!canApplySuggestions || !actionable}
                            >
                              {actionable ? t("apply") : t("readOnly")}
                            </Button>
                          </div>

                          <p className="text-xs leading-5 text-muted-foreground">
                            {suggestion.rationale}
                          </p>

                          {suggestion.preview && (
                            <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs leading-6 whitespace-pre-wrap">
                              {suggestion.preview}
                            </pre>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                      {t("noSuggestions")}
                    </div>
                  )}
                </section>

                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">{t("warnings")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("warningDetail")}
                    </p>
                  </div>

                  {importDiagnostics.warnings.length > 0 ? (
                    <div className="space-y-2">
                      {importDiagnostics.warnings.map((warning, index) => (
                        <div
                          key={`${warning}-${index}`}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>{warning}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                      {t("noWarnings")}
                    </div>
                  )}
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">
                          {t("metadataTitle")}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("metadataDetail")}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleCopyDraft()}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedDraft ? common("copied") : common("copy")}
                    </Button>
                  </div>

                  <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-xs leading-6 whitespace-pre-wrap">
                    {metadataDraft}
                  </pre>
                </section>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </Sheet>
  )
}
