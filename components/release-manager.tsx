"use client"

import { useEffect, useState } from "react"
import { strFromU8, unzipSync } from "fflate"
import { Archive, Download, FilePlus2, Loader2, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAccountDialog } from "@/components/account-dialog-provider"
import { Button } from "@/components/ui/button"
import { useDesignStore } from "@/lib/store/design-store"
import { downloadBlob } from "@/lib/download"
import { sha256Hex } from "@/lib/export/artifact-hash"
import type { ReleaseRecord } from "@/lib/releases/types"

async function responseError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string
  } | null
  return body?.error || `Request failed (${response.status})`
}

export function ReleaseManager() {
  const t = useTranslations("Releases")
  const common = useTranslations("Common")
  const { user, openAccount } = useAccountDialog()
  const createDocument = useDesignStore((state) => state.createDocument)
  const [releases, setReleases] = useState<ReleaseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    if (!user) {
      setReleases([])
      setLoading(false)
      return
    }
    setLoading(true)
    const response = await fetch("/api/releases", { cache: "no-store" })
    if (!response.ok) setError(await responseError(response))
    else {
      const result = (await response.json()) as { releases: ReleaseRecord[] }
      setReleases(result.releases)
      setError(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    const controller = new AbortController()
    void fetch("/api/releases", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response))
        return response.json() as Promise<{ releases: ReleaseRecord[] }>
      })
      .then((result) => {
        setReleases(result.releases)
        setError(null)
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return
        setError(cause instanceof Error ? cause.message : t("loadFailed"))
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [t, user])

  const getArchive = async (release: ReleaseRecord) => {
    const signed = await fetch(`/api/releases/${release.id}/download-url`, {
      method: "POST",
    })
    if (!signed.ok) throw new Error(await responseError(signed))
    const data = (await signed.json()) as { url: string; sha256: string }
    const archiveResponse = await fetch(data.url)
    if (!archiveResponse.ok) throw new Error(t("archiveDownloadFailed"))
    const bytes = new Uint8Array(await archiveResponse.arrayBuffer())
    if ((await sha256Hex(bytes)) !== data.sha256)
      throw new Error(t("archiveInvalid"))
    return bytes
  }

  const download = async (release: ReleaseRecord) => {
    setBusyId(release.id)
    try {
      const bytes = await getArchive(release)
      downloadBlob(
        new Blob([new Uint8Array(bytes)]),
        `${release.source_name}-delivery.zip`
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("downloadFailed"))
    } finally {
      setBusyId(null)
    }
  }

  const downloadEntry = async (
    release: ReleaseRecord,
    entry: ReleaseRecord["manifest"][number]
  ) => {
    setBusyId(release.id)
    try {
      const files = unzipSync(await getArchive(release))
      const bytes = files[entry.name]
      if (!bytes || (await sha256Hex(bytes)) !== entry.sha256)
        throw new Error(t("fileInvalid"))
      downloadBlob(
        new Blob([new Uint8Array(bytes)], { type: entry.mediaType }),
        entry.name
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("downloadFailed"))
    } finally {
      setBusyId(null)
    }
  }

  const restore = async (release: ReleaseRecord) => {
    if (!window.confirm(t("restoreConfirm"))) return
    setBusyId(release.id)
    try {
      const files = unzipSync(await getArchive(release))
      const markdownName = Object.keys(files).find((name) =>
        name.endsWith("-DESIGN.md")
      )
      if (!markdownName) throw new Error(t("missingDesignMd"))
      await createDocument({
        source: "blank",
        name: t("restoredName", { name: release.source_name }),
        content: strFromU8(files[markdownName]),
      })
      window.location.href = "/editor"
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("restoreFailed"))
      setBusyId(null)
    }
  }

  const remove = async (release: ReleaseRecord) => {
    if (!window.confirm(t("deleteConfirm"))) return
    setBusyId(release.id)
    const response = await fetch(`/api/releases/${release.id}`, {
      method: "DELETE",
    })
    if (!response.ok) setError(await responseError(response))
    else await reload()
    setBusyId(null)
  }

  if (!user)
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Archive className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-4 font-medium">{t("signInTitle")}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("signInDetail")}
        </p>
        <Button className="mt-5" onClick={openAccount}>
          {t("signIn")}
        </Button>
      </div>
    )

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {loading ? (
        <div className="grid min-h-40 place-items-center">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : releases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            {t("emptyTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            {t("emptyDetail")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {releases.map((release) => (
            <article
              key={release.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-medium">{release.source_name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("versionMeta", {
                    version: release.source_version,
                    size: (release.stored_bytes / 1024).toFixed(1),
                    date: new Date(release.created_at).toLocaleString(),
                  })}
                </p>
                <details className="mt-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer select-none">
                    {t("viewFiles")}
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {release.manifest.map((entry) => (
                      <button
                        key={entry.name}
                        type="button"
                        disabled={busyId === release.id}
                        onClick={() => void downloadEntry(release, entry)}
                        className="rounded-md border border-border px-2 py-1 hover:bg-muted disabled:opacity-50"
                      >
                        {entry.name}
                      </button>
                    ))}
                  </div>
                </details>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === release.id}
                  onClick={() => void download(release)}
                >
                  <Download />
                  {t("downloadZip")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === release.id}
                  onClick={() => void restore(release)}
                >
                  <FilePlus2 />
                  {t("restoreDraft")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={busyId === release.id}
                  onClick={() => void remove(release)}
                >
                  <Trash2 />
                  {common("delete")}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
