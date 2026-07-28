"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Check,
  Circle,
  FileCheck2,
  Globe2,
  Loader2,
  MessageSquareText,
  Save,
  WandSparkles,
  Wrench,
  X,
} from "lucide-react"
import { useDesignStore } from "@/lib/store/design-store"
import {
  getUrlGenerationAssistantAction,
  useUrlGenerationStore,
  type UrlGenerationAssistantAction,
  type UrlGenerationPhase,
} from "@/lib/store/url-generation-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const PHASES: Array<{
  id: UrlGenerationPhase
  icon: typeof Globe2
}> = [
  { id: "fetching", icon: Globe2 },
  { id: "generating", icon: WandSparkles },
  { id: "validating", icon: FileCheck2 },
  { id: "saving", icon: Save },
]

const PHASES_WITH_REPAIR: Array<{
  id: UrlGenerationPhase
  icon: typeof Globe2
}> = [
  { id: "fetching", icon: Globe2 },
  { id: "generating", icon: WandSparkles },
  { id: "repairing", icon: Wrench },
  { id: "validating", icon: FileCheck2 },
  { id: "saving", icon: Save },
]

const PHASE_PROGRESS: Record<UrlGenerationPhase, number> = {
  fetching: 0.12,
  generating: 0.56,
  repairing: 0.7,
  validating: 0.82,
  saving: 0.94,
}

export function UrlGenerationProgress({
  onOpenAiAssistant,
}: {
  onOpenAiAssistant?: (action: UrlGenerationAssistantAction) => void
}) {
  const t = useTranslations("UrlGeneration")
  const locale = useLocale()
  const router = useRouter()
  const job = useUrlGenerationStore((state) => state.job)
  const cancel = useUrlGenerationStore((state) => state.cancel)
  const dismiss = useUrlGenerationStore((state) => state.dismiss)
  const saveInvalidDraft = useUrlGenerationStore(
    (state) => state.saveInvalidDraft
  )
  const switchDocument = useDesignStore((state) => state.switchDocument)
  const setActiveView = useDesignStore((state) => state.setActiveView)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (job?.status !== "running") return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [job?.status])

  if (!job) return null

  const phases = job.attempts === 2 ? PHASES_WITH_REPAIR : PHASES
  const activeIndex = phases.findIndex((phase) => phase.id === job.phase)
  const progress = job.status === "done" ? 1 : PHASE_PROGRESS[job.phase]
  const elapsedSeconds = Math.max(
    1,
    Math.round(((job.completedAt ?? now) - job.startedAt) / 1000)
  )
  const number = new Intl.NumberFormat(locale)
  const needsRepair =
    job.status === "invalid" ||
    (job.status === "done" &&
      (job.quality === "invalid" || job.derivedReady === false))
  const assistantAction = getUrlGenerationAssistantAction(job)
  const displayedIssues =
    job.quality === "invalid" && job.blockingIssues?.length
      ? job.blockingIssues
      : job.quality === "review" && job.advisoryIssues?.length
        ? job.advisoryIssues
        : job.issues

  const openDocument = () => {
    if (!job.documentId) return
    switchDocument(job.documentId)
    setActiveView("document")
    dismiss()
    router.push("/editor")
  }

  const openAiAssistant = () => {
    if (!job.documentId) return
    switchDocument(job.documentId)
    setActiveView("document")
    dismiss()
    router.push("/editor")
    if (assistantAction) onOpenAiAssistant?.(assistantAction)
  }

  const detail =
    job.status === "error"
      ? job.error || t("unknownError")
      : job.status === "cancelled"
        ? t("cancelledDetail", { seconds: elapsedSeconds })
        : job.status === "invalid"
          ? t("invalidDetail", {
              count: displayedIssues.length,
              seconds: elapsedSeconds,
            })
          : job.status === "done"
            ? job.quality === "ready"
              ? t("readyDetail", { seconds: elapsedSeconds })
              : job.quality === "invalid"
                ? t("invalidSavedDetail", {
                    count: displayedIssues.length,
                    seconds: elapsedSeconds,
                  })
                : t("reviewDetail", {
                    count: displayedIssues.length,
                    seconds: elapsedSeconds,
                  })
            : job.phase === "generating" && job.generatedCharacters > 0
              ? t("phaseDetail.generatingWithCount", {
                  count: number.format(job.generatedCharacters),
                })
              : job.phase === "generating" &&
                  job.source?.kind !== undefined &&
                  job.source.kind !== "website"
                ? t("phaseDetail.generatingPublished")
                : job.phase === "generating" && job.sourceCacheHit
                  ? t("phaseDetail.generatingCached")
                  : t(`phaseDetail.${job.phase}`)

  const title =
    job.status === "running"
      ? t("runningTitle", { host: job.hostname })
      : job.status === "cancelled"
        ? t("cancelledTitle", { host: job.hostname })
        : job.status === "invalid"
          ? t("invalidTitle", { host: job.hostname })
          : job.status === "done"
            ? job.quality === "ready"
              ? t("doneTitle", { host: job.hostname })
              : job.quality === "invalid"
                ? t("invalidSavedTitle", { host: job.hostname })
                : t("reviewTitle", { host: job.hostname })
            : t("errorTitle", { host: job.hostname })

  const StatusIcon =
    job.status === "running"
      ? Loader2
      : job.status === "done" && job.quality !== "invalid"
        ? Check
        : job.status === "cancelled"
          ? X
          : AlertTriangle

  return (
    <section aria-live="polite" aria-label={t("regionLabel")}>
      <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-primary uppercase">
        <WandSparkles className="size-3.5" />
        {t("workspaceEyebrow")}
      </div>

      <div className="mt-4 flex items-start gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg border",
            job.status === "error"
              ? "border-destructive/25 bg-destructive/8 text-destructive"
              : needsRepair
                ? "border-amber-500/25 bg-amber-500/8 text-amber-700 dark:text-amber-300"
                : job.status === "done"
                  ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300"
                  : "border-primary/20 bg-primary/8 text-primary"
          )}
        >
          <StatusIcon
            className={cn("size-4", job.status === "running" && "animate-spin")}
          />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base leading-6 font-semibold text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {detail}
          </p>
        </div>
      </div>

      {job.status === "running" ? (
        <>
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full origin-left rounded-full bg-primary transition-transform duration-500"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>

          <ol className="mt-4 divide-y divide-border/55 border-y border-border/55">
            {phases.map((phase, index) => {
              const Icon = phase.icon
              const complete = index < activeIndex
              const active = index === activeIndex
              return (
                <li
                  key={phase.id}
                  className={cn(
                    "flex items-center gap-3 py-2.5 text-xs",
                    active
                      ? "text-foreground"
                      : complete
                        ? "text-foreground/75"
                        : "text-muted-foreground/60"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-md",
                      active && "bg-primary/10 text-primary",
                      complete && "text-emerald-600"
                    )}
                  >
                    {complete ? (
                      <Check className="size-3.5" />
                    ) : active ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Circle className="size-2.5" />
                    )}
                  </span>
                  <Icon className="size-3.5 shrink-0" />
                  <span className="font-medium">{t(`phase.${phase.id}`)}</span>
                </li>
              )
            })}
          </ol>
        </>
      ) : null}

      {(job.status === "done" || job.status === "invalid") &&
      job.quality !== "ready" &&
      displayedIssues.length > 0 ? (
        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            {job.quality === "review" ? t("advisoryItems") : t("reviewItems")}
          </p>
          <ul className="mt-2 space-y-2">
            {displayedIssues.slice(0, 4).map((issue) => (
              <li
                key={issue}
                className="flex items-start gap-2 text-xs leading-5 text-foreground/80"
              >
                {job.quality === "review" ? (
                  <WandSparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                )}
                <span>{t(`issue.${issue}`)}</span>
              </li>
            ))}
            {displayedIssues.length > 4 ? (
              <li className="pl-5.5 text-xs text-muted-foreground">
                {t("moreIssues", { count: displayedIssues.length - 4 })}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        {job.status === "running" && job.phase !== "saving" ? (
          <Button variant="outline" size="sm" onClick={cancel}>
            <X className="size-3.5" />
            {t("cancel")}
          </Button>
        ) : null}
        {job.status === "invalid" ? (
          <Button size="sm" onClick={() => void saveInvalidDraft()}>
            {t("saveReviewDraft")}
          </Button>
        ) : null}
        {job.status === "done" && job.documentId ? (
          <Button size="sm" onClick={openDocument}>
            {t("openDraft")}
          </Button>
        ) : null}
        {assistantAction && job.documentId && onOpenAiAssistant ? (
          <Button variant="outline" size="sm" onClick={openAiAssistant}>
            <MessageSquareText data-icon="inline-start" />
            {assistantAction.kind === "repair-derived"
              ? t("repairWithAi")
              : t("completeWithAi")}
          </Button>
        ) : null}
        {(job.status === "error" ||
          job.status === "invalid" ||
          job.status === "cancelled") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              dismiss()
              router.push("/search")
            }}
          >
            {t("backToSearch")}
          </Button>
        )}
        {job.status !== "running" ? (
          <Button variant="ghost" size="sm" onClick={dismiss}>
            {t("finish")}
          </Button>
        ) : null}
      </div>
    </section>
  )
}
