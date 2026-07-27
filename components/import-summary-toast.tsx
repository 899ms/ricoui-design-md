"use client"

import { AlertTriangle, CheckCircle2, FileText, X } from "lucide-react"
import { useTranslations } from "next-intl"
import type { BatchImportIssue, BatchImportResult } from "@/lib/types/tokens"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ImportSummaryToast({
  result,
  onDismiss,
  onOpenLatest,
}: {
  result: BatchImportResult | null
  onDismiss: () => void
  onOpenLatest?: () => void
}) {
  const t = useTranslations("ImportSummary")
  if (!result) return null

  const issueLabel = (issue: BatchImportIssue) =>
    issue.kind === "parse-error" ? t("failed") : t("skipped")
  const issueReason = (issue: BatchImportIssue) => {
    if (issue.kind === "invalid-type") return t("invalidType")
    if (issue.kind === "too-large") return t("tooLarge")
    if (issue.kind === "quota") return t("quota")
    return t("parseError")
  }

  const issues = [...result.failed, ...result.skipped]
  const hasIssues = issues.length > 0
  const title =
    result.successCount > 0
      ? t("imported", { count: result.successCount })
      : t("noneImported")

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[90] w-[min(28rem,calc(100vw-2rem))]">
      <div
        role="status"
        className={cn(
          "pointer-events-auto rounded-lg border bg-popover/96 p-4 shadow-[var(--shadow-lg)] backdrop-blur-xl",
          hasIssues ? "border-amber-300/70" : "border-border/70"
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md",
              hasIssues
                ? "bg-amber-500/10 text-amber-700"
                : "bg-green-500/10 text-green-700"
            )}
          >
            {hasIssues ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("summary", {
                    total: result.totalCount,
                    success: result.successCount,
                    failed: result.failed.length,
                    skipped: result.skipped.length,
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={t("close")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {issues.length > 0 ? (
              <div className="mt-3 max-h-36 space-y-1 overflow-y-auto rounded-md border border-border/70 bg-background/70 p-2">
                {issues.map((issue, index) => (
                  <div
                    key={`${issue.filename}-${issue.kind}-${index}`}
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-xs"
                  >
                    <span className="font-medium text-muted-foreground">
                      {issueLabel(issue)}
                    </span>
                    <span className="truncate font-medium">
                      {issue.filename}
                    </span>
                    <span />
                    <span className="text-muted-foreground">
                      {issueReason(issue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {result.createdIds.length > 0 && onOpenLatest ? (
              <div className="mt-3 flex justify-end">
                <Button size="xs" variant="outline" onClick={onOpenLatest}>
                  <FileText className="h-3.5 w-3.5" />
                  {t("openLatest")}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
