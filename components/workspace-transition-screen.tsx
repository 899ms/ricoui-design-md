"use client"

import { useTranslations } from "next-intl"
import { Cloud, Loader2, LogOut, RefreshCw } from "lucide-react"
import type { WorkspaceTransitionPhase } from "@/lib/sync/workspace-transition"
import { Button } from "@/components/ui/button"

export function WorkspaceTransitionScreen({
  phase,
  error,
  onRetry,
  onRestoreLocal,
  canRestoreLocal = true,
}: {
  phase: WorkspaceTransitionPhase | "checking-session"
  error: string | null
  onRetry: () => void
  onRestoreLocal: () => void
  canRestoreLocal?: boolean
}) {
  const t = useTranslations("WorkspaceTransition")
  const checkingSession = phase === "checking-session"
  const failed = phase === "cloud-error"
  const leaving = phase === "leaving-cloud"

  return (
    <main className="app-bg grid h-full min-h-0 flex-1 place-items-center bg-background p-6">
      <section className="w-full max-w-md rounded-xl border border-border/70 bg-card p-6 text-center shadow-lg">
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
          {failed ? (
            <Cloud className="size-5" />
          ) : (
            <Loader2 className="size-5 animate-spin" />
          )}
        </span>
        <h1 className="mt-4 text-base font-semibold">
          {checkingSession
            ? t("checkingTitle")
            : failed
              ? t("errorTitle")
              : leaving
                ? t("leavingTitle")
                : t("enteringTitle")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {checkingSession
            ? t("checkingDetail")
            : failed
              ? t("errorDetail")
              : leaving
                ? t("leavingDetail")
                : t("enteringDetail")}
        </p>
        {error && (
          <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-left text-xs text-destructive">
            {error}
          </p>
        )}
        {failed && (
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={onRetry}>
              <RefreshCw className="size-3.5" />
              {t("retry")}
            </Button>
            {canRestoreLocal && (
              <Button variant="outline" onClick={onRestoreLocal}>
                <LogOut className="size-3.5" />
                {t("restoreLocal")}
              </Button>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
