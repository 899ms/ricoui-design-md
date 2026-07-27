"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  Archive,
  Check,
  Cloud,
  Download,
  EyeOff,
  Loader2,
  LogOut,
  Mail,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react"
import { getBrowserSupabaseClient } from "@/lib/sync/supabase"
import { useAccountDialog } from "@/components/account-dialog-provider"
import { useCloudSync } from "@/components/cloud-sync-provider"
import { useSyncState } from "@/lib/sync/sync-state"
import {
  readLocalCopyHidden,
  writeLocalCopyHidden,
} from "@/lib/sync/workspace-transition"
import {
  clearPersistedWorkspaceState,
  clearWorkspaceSnapshot,
} from "@/lib/storage/workspace-persistence"
import { formatRelativeTime } from "@/lib/format"
import type { Locale } from "@/lib/i18n/config"
import { useDesignStore } from "@/lib/store/design-store"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  CLOUD_DOCUMENT_LIMIT,
  CLOUD_LIBRARY_LIMIT,
} from "@/lib/sync/cloud-limits"
import { TurnstileWidget } from "@/components/turnstile-widget"
import {
  getAccountInitial,
  getAccountLoginProvider,
  validateDisplayName,
} from "@/lib/account-profile"
import { exportAccountSourceBackup } from "@/lib/export/account-source-backup"
import { downloadBlob } from "@/lib/download"

const STATUS_TONE = {
  local: "bg-muted-foreground/45",
  offline: "bg-amber-500",
  pending: "bg-amber-500",
  syncing: "bg-sky-500 animate-pulse",
  synced: "bg-emerald-500",
  conflict: "bg-amber-500",
  "quota-blocked": "bg-amber-500",
  error: "bg-destructive",
} as const

function InlineDisplayName({
  displayName,
  updateDisplayName,
}: {
  displayName: string
  updateDisplayName: (name: string) => Promise<void>
}) {
  const t = useTranslations("Account")
  const common = useTranslations("Common")
  const [draft, setDraft] = useState(displayName)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<"invalid" | "save" | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const validation = validateDisplayName(draft)
  const changed = validation.value !== displayName

  const startEditing = () => {
    setDraft(displayName)
    setError(null)
    setEditing(true)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const cancel = () => {
    setDraft(displayName)
    setError(null)
    setEditing(false)
  }

  const save = async () => {
    if (!validation.valid) {
      setError("invalid")
      return
    }
    if (!changed) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateDisplayName(validation.value)
      setEditing(false)
    } catch {
      setError("save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-w-0">
      {editing ? (
        <div className="flex min-w-0 items-center gap-1.5">
          <Input
            ref={inputRef}
            value={draft}
            maxLength={40}
            disabled={saving}
            aria-label={t("displayName")}
            aria-invalid={error === "invalid"}
            className="h-8 max-w-60 min-w-0 rounded-lg px-2.5 text-sm font-semibold"
            onChange={(event) => {
              setDraft(event.target.value)
              setError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void save()
              }
              if (event.key === "Escape") {
                event.preventDefault()
                cancel()
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={saving}
            aria-label={t("saveProfile")}
            title={t("saveProfile")}
            onClick={() => void save()}
          >
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={saving}
            aria-label={common("cancel")}
            title={common("cancel")}
            onClick={cancel}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex min-w-0 items-center gap-1.5">
          <h2
            className="truncate text-base font-semibold tracking-tight"
            title={displayName}
            onDoubleClick={startEditing}
          >
            {displayName || t("signedIn")}
          </h2>
          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground"
            aria-label={t("editDisplayName")}
            title={t("editDisplayName")}
            onClick={startEditing}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs text-destructive">
          {t(error === "invalid" ? "displayNameInvalid" : "profileSaveFailed")}
        </p>
      )}
    </div>
  )
}

export function AccountDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const t = useTranslations("Account")
  const common = useTranslations("Common")
  const locale = useLocale()
  const { user, displayName, updateDisplayName } = useAccountDialog()
  const { signOut, getLocalImportCatalog, importLocalSources } = useCloudSync()
  const syncStatus = useSyncState((state) => state.status)
  const pendingCount = useSyncState((state) => state.pendingCount)
  const lastSyncedAt = useSyncState((state) => state.lastSyncedAt)
  const error = useSyncState((state) => state.error)
  const requestRetry = useSyncState((state) => state.requestRetry)
  const documents = useDesignStore((state) => state.documents)
  const libraryEntries = useDesignStore((state) => state.libraryEntries)
  const documentsCount = documents.length
  const libraryCount = libraryEntries.length
  const favoritesCount = useDesignStore((state) => state.brandFavorites.length)
  const [email, setEmail] = useState("")
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [deleteEmail, setDeleteEmail] = useState("")
  const [busy, setBusy] = useState<
    "magic" | "google" | "signout" | "delete" | null
  >(null)
  const [message, setMessage] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [signOutBlocked, setSignOutBlocked] = useState(false)
  const [localCatalog, setLocalCatalog] = useState<{
    documents: Array<{ id: string; name: string; bytes: number }>
    libraryEntries: Array<{ id: string; name: string; bytes: number }>
  }>({ documents: [], libraryEntries: [] })
  const [selectedLocalKeys, setSelectedLocalKeys] = useState<string[]>([])
  const [importingLocal, setImportingLocal] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [localImportExpanded, setLocalImportExpanded] = useState(false)
  const [localCopyHidden, setLocalCopyHidden] = useState(() =>
    readLocalCopyHidden(user?.id)
  )
  const [cloudUsage, setCloudUsage] = useState<{
    document_count: number
    library_count: number
    markdown_bytes: number
    release_count: number
    release_bytes: number
  } | null>(null)
  const [registrationEnabled, setRegistrationEnabled] = useState(true)
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => {
        setLocalImportExpanded(false)
        setSelectedLocalKeys([])
      }, 0)
      return () => window.clearTimeout(timer)
    }
    if (user) {
      void getLocalImportCatalog().then(setLocalCatalog)
      void fetch("/api/account", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload) => setCloudUsage(payload?.usage ?? null))
    } else {
      const client = getBrowserSupabaseClient()
      if (client) {
        void client
          .from("cloud_controls")
          .select("registration_enabled")
          .eq("singleton", true)
          .single()
          .then((result: { data: { registration_enabled?: boolean } | null }) =>
            setRegistrationEnabled(result.data?.registration_enabled !== false)
          )
      }
    }
  }, [getLocalImportCatalog, open, syncStatus, user])

  const redirectTo =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/auth/callback`
  const statusLabel = common(`syncStatus.${syncStatus}`)
  const userInitial = useMemo(
    () => getAccountInitial(displayName),
    [displayName]
  )

  const startMagicLink = async () => {
    const client = getBrowserSupabaseClient()
    if (!client || !email.trim()) return
    setBusy("magic")
    setMessage(null)
    const { error: authError } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: registrationEnabled,
        captchaToken: captchaToken ?? undefined,
      },
    })
    setBusy(null)
    if (authError) {
      setSentEmail(null)
      setMessage(authError.message)
    } else {
      setSentEmail(email.trim())
    }
  }

  const startGoogle = async () => {
    const client = getBrowserSupabaseClient()
    if (!client) return
    setBusy("google")
    const { error: authError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    })
    if (authError) {
      setBusy(null)
      setMessage(authError.message)
    }
  }

  const handleSignOut = async () => {
    setBusy("signout")
    setMessage(null)
    setSignOutBlocked(false)
    try {
      await signOut()
      onClose()
    } catch (signOutError) {
      const blocked =
        signOutError instanceof Error &&
        signOutError.message.startsWith("RICO_SIGNOUT_BLOCKED")
      setSignOutBlocked(blocked)
      setMessage(
        blocked
          ? t("signOutBlocked")
          : signOutError instanceof Error
            ? signOutError.message
            : t("signOutFailed")
      )
    } finally {
      setBusy(null)
    }
  }

  const handleForceSignOut = async () => {
    setBusy("signout")
    try {
      await signOut(true)
      setSignOutBlocked(false)
      onClose()
    } catch {
      setMessage(t("signOutFailed"))
    } finally {
      setBusy(null)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    if (deleteEmail.trim().toLowerCase() !== (user.email ?? "").toLowerCase())
      return
    setBusy("delete")
    setMessage(null)
    try {
      const response = await fetch("/api/account", { method: "DELETE" })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error || t("deleteAccountFailed"))
      }
      await clearPersistedWorkspaceState()
      await clearWorkspaceSnapshot({ kind: "local" })
      await signOut(true)
      setSentEmail(null)
      setEmail("")
      setDeleteEmail("")
      onClose()
    } catch {
      setMessage(t("deleteAccountFailed"))
    } finally {
      setBusy(null)
    }
  }

  const toggleLocalSource = (key: string) =>
    setSelectedLocalKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    )

  const copySelectedLocalSources = async () => {
    setImportingLocal(true)
    const result = await importLocalSources(selectedLocalKeys)
    setSelectedLocalKeys([])
    setImportResult(
      t("localCopyResult", {
        imported: result.imported,
        skipped: result.skipped,
      })
    )
    setLocalImportExpanded(false)
    setImportingLocal(false)
  }

  const dismissLocalImport = () => {
    setSelectedLocalKeys([])
    setLocalImportExpanded(false)
  }

  const hideLocalCopy = () => {
    setLocalCopyHidden(true)
    writeLocalCopyHidden(user?.id, true)
    setSelectedLocalKeys([])
    setLocalImportExpanded(false)
  }

  const showLocalCopy = () => {
    writeLocalCopyHidden(user?.id, false)
    setLocalCopyHidden(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      label={t("label")}
      className="max-w-2xl overflow-hidden"
    >
      {user ? (
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-5 pr-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border/70 bg-muted text-sm font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
                {userInitial}
              </span>
              <div className="min-w-0">
                <InlineDisplayName
                  key={`${user.id}:${user.updated_at ?? "profile"}`}
                  displayName={displayName}
                  updateDisplayName={updateDisplayName}
                />
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {user.email ?? t("personalWorkspace")}
                  <span aria-hidden="true"> · </span>
                  {t(
                    getAccountLoginProvider(user) === "google"
                      ? "loginGoogle"
                      : "loginMagicLink"
                  )}
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground">
              <span
                aria-hidden="true"
                className={cn("size-1.5 rounded-full", STATUS_TONE[syncStatus])}
              />
              {statusLabel}
            </span>
          </div>

          <section className="mt-6 grid grid-cols-3 gap-3">
            {[
              {
                label: t("statDrafts"),
                count: cloudUsage?.document_count ?? documentsCount,
                limit: CLOUD_DOCUMENT_LIMIT,
              },
              {
                label: t("statLibrary"),
                count: cloudUsage?.library_count ?? libraryCount,
                limit: CLOUD_LIBRARY_LIMIT,
              },
              { label: t("statFavorites"), count: favoritesCount, limit: 200 },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-center"
              >
                <p className="text-lg font-semibold tabular-nums">
                  {stat.count}/{stat.limit}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </section>

          {cloudUsage ? (
            <section className="mt-3 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>{t("cloudMarkdownUsage")}</span>
                <span className="tabular-nums">
                  {(cloudUsage.markdown_bytes / 1024).toFixed(1)} KiB / 1 MiB
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span>{t("cloudReleaseUsage")}</span>
                <span className="tabular-nums">
                  {t("cloudReleaseUsageValue", {
                    count: cloudUsage.release_count,
                    size: (cloudUsage.release_bytes / 1024).toFixed(1),
                  })}
                </span>
              </div>
              {cloudUsage.markdown_bytes >= 0.8 * 1048576 ||
              cloudUsage.release_bytes >= 0.8 * 5242880 ? (
                <p className="mt-2 text-amber-700">{t("cloudUsageWarning")}</p>
              ) : null}
            </section>
          ) : null}

          <section className="mt-4 border-y border-border/70 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t("cloudWorkspace")}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t("cloudDetail")}
                  {pendingCount > 0
                    ? ` ${t("pendingCount", { count: pendingCount })}`
                    : ""}
                </p>
                {lastSyncedAt ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t("lastSynced", {
                      time: formatRelativeTime(lastSyncedAt, {
                        locale: locale as Locale,
                      }),
                    })}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestRetry}
                  className="active:translate-y-px"
                >
                  <RefreshCw data-icon="inline-start" />
                  {syncStatus === "error" ? t("retrySync") : t("syncNow")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/releases" onClick={onClose} />}
                >
                  <Archive data-icon="inline-start" />
                  {t("manageReleases")}
                </Button>
              </div>
            </div>
            {error && (
              <p className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
                {error}
              </p>
            )}
          </section>

          {localCopyHidden ? (
            <section className="py-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={showLocalCopy}
              >
                <Cloud className="h-3.5 w-3.5" />
                {t("showLocalCopy")}
              </Button>
            </section>
          ) : (
            <section className="py-4">
              <div className="flex items-start gap-3">
                <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  {localCatalog.documents.length > 0 ||
                  localCatalog.libraryEntries.length > 0 ? (
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {t("copyLocalTitle")}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {localImportExpanded
                              ? t("copyLocalDetail")
                              : t("localSourceSummary", {
                                  documents: localCatalog.documents.length,
                                  library: localCatalog.libraryEntries.length,
                                })}
                          </p>
                        </div>
                        {localImportExpanded ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("closeLocalCopy")}
                            onClick={dismissLocalImport}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setImportResult(null)
                                setLocalImportExpanded(true)
                              }}
                            >
                              {t("chooseLocalSources")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t("hideLocalCopy")}
                              title={t("hideLocalCopy")}
                              onClick={hideLocalCopy}
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {localImportExpanded ? (
                        <div className="mt-3 space-y-2">
                          <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                            {[
                              ...localCatalog.documents.map((item) => ({
                                ...item,
                                key: `document:${item.id}`,
                                kind: t("statDrafts"),
                              })),
                              ...localCatalog.libraryEntries.map((item) => ({
                                ...item,
                                key: `library_entry:${item.id}`,
                                kind: t("statLibrary"),
                              })),
                            ].map((item) => (
                              <label
                                key={item.key}
                                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedLocalKeys.includes(item.key)}
                                  onChange={() => toggleLocalSource(item.key)}
                                />
                                <span className="min-w-0 flex-1 truncate">
                                  {item.name}
                                </span>
                                <span className="text-muted-foreground">
                                  {item.kind} · {(item.bytes / 1024).toFixed(1)}{" "}
                                  KiB
                                </span>
                              </label>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                selectedLocalKeys.length === 0 || importingLocal
                              }
                              onClick={() => void copySelectedLocalSources()}
                            >
                              {importingLocal ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Cloud className="h-3.5 w-3.5" />
                              )}
                              {t("copySelected", {
                                count: selectedLocalKeys.length,
                              })}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={importingLocal}
                              onClick={dismissLocalImport}
                            >
                              {t("skipLocalCopy")}
                            </Button>
                          </div>
                        </div>
                      ) : importResult ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {importResult}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">
                        {t("copyLocalTitle")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("noLocalSources")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="border-t border-border/70 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t("sourceBackupTitle")}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t("sourceBackupDetail", {
                    documents: documents.length,
                    library: libraryEntries.length,
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={documents.length + libraryEntries.length === 0}
                onClick={() =>
                  downloadBlob(
                    exportAccountSourceBackup(documents, libraryEntries),
                    "ricoui-design-source-backup.zip"
                  )
                }
              >
                <Download className="h-3.5 w-3.5" />
                {t("downloadSourceBackup")}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t("localAiSettings")}
            </p>
          </section>

          <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-4">
            <p className="max-w-md text-xs leading-5 text-muted-foreground">
              {t("signOutDetail")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleSignOut()}
              disabled={busy !== null}
              className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive active:translate-y-px"
            >
              {busy === "signout" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              {t("signOut")}
            </Button>
            {signOutBlocked ? (
              <Button
                variant="destructive"
                size="sm"
                disabled={busy !== null}
                onClick={() => void handleForceSignOut()}
              >
                <LogOut className="h-3.5 w-3.5" />
                {t("discardAndSignOut")}
              </Button>
            ) : null}
          </div>

          <section className="mt-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              {t("deleteAccount")}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t("deleteAccountDetail")}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={deleteEmail}
                onChange={(event) => setDeleteEmail(event.target.value)}
                placeholder={user.email ?? ""}
                type="email"
                autoComplete="off"
                className="sm:max-w-xs"
                aria-label={t("deleteAccountConfirm")}
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleDeleteAccount()}
                disabled={
                  busy !== null ||
                  deleteEmail.trim().toLowerCase() !==
                    (user?.email ?? "").toLowerCase()
                }
                className="shrink-0 active:translate-y-px"
              >
                {busy === "delete" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {t("deleteAccountSubmit")}
              </Button>
            </div>
            {message && (
              <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
                {message}
              </p>
            )}
          </section>
        </div>
      ) : (
        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <section className="border-b border-border/70 bg-muted/30 p-6 sm:p-7 md:border-r md:border-b-0">
            <div className="grid size-10 place-items-center rounded-xl border border-border/70 bg-background shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
              <Cloud className="h-4 w-4 text-foreground" />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight">
              {t("followYou")}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {t("followDetail")}
            </p>
            <ul className="mt-6 space-y-3 text-xs leading-5 text-muted-foreground">
              {[
                t("featureBackup"),
                t("featureOffline"),
                t("featureConflict"),
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-muted/15 p-6 sm:p-7">
            {sentEmail ? (
              <div className="pr-8">
                <div className="grid size-11 place-items-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-base font-semibold tracking-tight">
                  {t("magicLinkSentTitle")}
                </h2>
                <p className="mt-2 text-sm leading-6 break-words text-muted-foreground">
                  {t("magicLinkSentDetail", { email: sentEmail })}
                </p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {t("magicLinkSpamHint")}
                </p>
                {message && (
                  <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
                    {message}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void startMagicLink()}
                    disabled={busy !== null}
                    className="active:translate-y-px"
                  >
                    {busy === "magic" ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <RefreshCw />
                    )}
                    {t("resendMagicLink")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setSentEmail(null)
                      setEmail("")
                      setMessage(null)
                    }}
                    disabled={busy !== null}
                    className="text-muted-foreground active:translate-y-px"
                  >
                    {t("useAnotherEmail")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="pr-8">
                  <h2 className="text-base font-semibold tracking-tight">
                    {t("signInTitle")}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("signInDetail")}
                  </p>
                </div>

                <form
                  className="mt-6 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void startMagicLink()
                  }}
                >
                  <label className="grid gap-2 text-xs font-medium">
                    {t("email")}
                    <Input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="email"
                    />
                  </label>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t("magicLinkDetail")}
                  </p>
                  {!registrationEnabled ? (
                    <p className="rounded-md border border-amber-300/60 bg-amber-500/5 px-3 py-2 text-xs leading-5 text-amber-700">
                      新账户注册暂时关闭；已有账户仍可通过原邮箱登录。
                    </p>
                  ) : null}
                  {turnstileSiteKey ? (
                    <TurnstileWidget
                      siteKey={turnstileSiteKey}
                      onToken={setCaptchaToken}
                    />
                  ) : null}
                  <Button
                    type="submit"
                    className="w-full active:translate-y-px"
                    disabled={
                      busy !== null ||
                      !email.trim() ||
                      (!!turnstileSiteKey && !captchaToken)
                    }
                  >
                    {busy === "magic" ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Mail />
                    )}
                    {t("sendMagicLink")}
                  </Button>
                </form>

                <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="h-px flex-1 bg-border/70" />
                  {t("orUse")}
                  <span className="h-px flex-1 bg-border/70" />
                </div>

                <Button
                  variant="outline"
                  className="w-full active:translate-y-px"
                  onClick={() => void startGoogle()}
                  disabled={busy !== null}
                >
                  {busy === "google" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ShieldCheck />
                  )}
                  {t("continueGoogle")}
                </Button>

                {message && (
                  <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
                    {message}
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </Dialog>
  )
}
