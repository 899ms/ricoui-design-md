"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle, CloudAlert, FileDiff, GitFork } from "lucide-react"
import { useCloudSync } from "@/components/cloud-sync-provider"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Dialog } from "@/components/ui/dialog"
import { buildDocumentLineDiff } from "@/lib/ai/document-repair-chat"
import { useDesignStore } from "@/lib/store/design-store"
import { useSyncState } from "@/lib/sync/sync-state"
import type { DocumentDiffLine } from "@/lib/ai/document-repair-chat"
import type { DocumentConflictResolution } from "@/lib/sync/types"
import { cn } from "@/lib/utils"

function visibleDiffLines(lines: DocumentDiffLine[]) {
  const visible = new Set<number>()
  lines.forEach((line, index) => {
    if (line.type === "same") return
    for (let cursor = Math.max(0, index - 2); cursor <= index + 2; cursor += 1)
      if (cursor < lines.length) visible.add(cursor)
  })
  return [...visible].sort((left, right) => left - right).slice(0, 320)
}

export function DocumentSyncConflictBanner() {
  const t = useTranslations("SyncConflict")
  const activeDocumentId = useDesignStore((state) => state.activeDocumentId)
  const local = useDesignStore((state) =>
    state.documents.find((document) => document.id === state.activeDocumentId)
  )
  const conflict = useSyncState((state) =>
    state.conflicts.find(
      (item) => item.entity === "document" && item.entityId === activeDocumentId
    )
  )
  const { resolveDocumentConflict } = useCloudSync()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmRemote, setConfirmRemote] = useState(false)
  const [busy, setBusy] = useState<DocumentConflictResolution | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const diff = useMemo(
    () =>
      conflict?.entity === "document" && local
        ? buildDocumentLineDiff(conflict.remote.rawMarkdown, local.rawMarkdown)
        : null,
    [conflict, local]
  )
  const shownIndexes = useMemo(
    () => (diff ? visibleDiffLines(diff.lines) : []),
    [diff]
  )

  if (!conflict || conflict.entity !== "document" || !local) return null

  const resolve = async (resolution: DocumentConflictResolution) => {
    setBusy(resolution)
    setMessage(null)
    try {
      const result = await resolveDocumentConflict(conflict.id, resolution)
      if (result === "resolved") {
        setDialogOpen(false)
        setConfirmRemote(false)
      } else if (result === "remote-changed") {
        setMessage(t("remoteChangedAgain"))
      } else {
        setMessage(t("unavailable"))
      }
    } catch {
      setMessage(t("unavailable"))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <section
        role="alert"
        className="border-b border-amber-300/70 bg-[linear-gradient(90deg,rgba(245,158,11,0.13),rgba(245,158,11,0.035))] px-4 py-3 lg:px-6"
      >
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-md border border-amber-300/80 bg-amber-50 text-amber-700 shadow-[var(--shadow-sm)]">
            <CloudAlert className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {t("title")}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {t("detail")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMessage(null)
              setDialogOpen(true)
            }}
            className="border-amber-300/80 bg-background/90"
          >
            <FileDiff data-icon="inline-start" />
            {t("compare")}
          </Button>
        </div>
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        label={t("dialogTitle")}
        className="max-w-4xl"
      >
        <div className="border-b border-border/70 px-6 py-5 pr-12">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800">
              <GitFork className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold">{t("dialogTitle")}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("dialogDetail")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <VersionSummary
              label={t("cloudVersion")}
              name={conflict.remote.name}
              detail={t("cloudVersionDetail")}
            />
            <VersionSummary
              label={t("localVersion")}
              name={local.name}
              detail={t("localVersionDetail")}
              local
            />
          </div>

          <div className="overflow-hidden rounded-lg border border-border/70 bg-[#0d1420] text-[#d7dfeb] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-xs">
              <span className="font-medium">DESIGN.md</span>
              <span className="text-white/55">
                {t("lineSummary", {
                  added: diff?.added ?? 0,
                  removed: diff?.removed ?? 0,
                })}
              </span>
            </div>
            <div className="max-h-[340px] overflow-auto py-2 font-mono text-[12px] leading-5">
              {shownIndexes.length > 0 ? (
                shownIndexes.map((index, position) => {
                  const line = diff!.lines[index]
                  const previous = shownIndexes[position - 1]
                  return (
                    <div key={`${index}-${line.type}`}>
                      {previous !== undefined && index - previous > 1 ? (
                        <div className="px-4 py-1 text-white/30">···</div>
                      ) : null}
                      <div
                        className={cn(
                          "grid grid-cols-[24px_1fr] px-3",
                          line.type === "add" &&
                            "bg-emerald-400/12 text-emerald-100",
                          line.type === "remove" &&
                            "bg-rose-400/12 text-rose-100",
                          line.type === "same" && "text-white/55"
                        )}
                      >
                        <span className="text-white/35 select-none">
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
                })
              ) : (
                <p className="px-4 py-8 text-center text-white/55">
                  {t("metadataOnly")}
                </p>
              )}
            </div>
          </div>

          {message ? (
            <p className="flex items-start gap-2 rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmRemote(true)}
              disabled={busy !== null}
            >
              {t("useCloud")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void resolve("save-as-new")}
              disabled={busy !== null}
            >
              {t("saveAsNew")}
            </Button>
            <Button
              size="sm"
              onClick={() => void resolve("keep-local")}
              disabled={busy !== null}
            >
              {t("overwriteCloud")}
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmRemote}
        title={t("useCloudConfirmTitle")}
        description={t("useCloudConfirmDetail")}
        confirmLabel={t("useCloud")}
        tone="destructive"
        onClose={() => setConfirmRemote(false)}
        onConfirm={() => void resolve("keep-remote")}
      />
    </>
  )
}

function VersionSummary({
  label,
  name,
  detail,
  local = false,
}: {
  label: string
  name: string
  detail: string
  local?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3",
        local
          ? "border-primary/25 bg-primary/[0.04]"
          : "border-border/70 bg-muted/25"
      )}
    >
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1.5 truncate text-sm font-semibold">{name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}
